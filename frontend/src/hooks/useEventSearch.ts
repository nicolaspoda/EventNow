import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { eventService } from '../services/eventService';
import { useSearchParams } from 'react-router-dom';
import type { Event } from '../types/event.types';

interface SearchFilters {
  query?: string;
  type?: string;
  categories?: string[];
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  priceRanges?: string[];
  availableOnly?: boolean;
  myEvents?: boolean;
  followedOnly?: boolean;
  sortBy?: string;
  radiusKm?: number;
}

interface UserPosition {
  lat: number;
  lon: number;
}

interface EventStats {
  totalCapacity: number;
  totalSold: number;
  availableTickets: number;
  fillRate: number;
  priceRange: {
    min: number;
    max: number;
  };
}

type EventWithStats = Event & {
  stats?: EventStats;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const useEventSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);
  const [positionError, setPositionError] = useState<string | null>(null);
  const initialPositionRequested = useRef(false);

  useEffect(() => {
    if (initialPositionRequested.current || !navigator.geolocation) return;
    initialPositionRequested.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('sortBy', 'DISTANCE_ASC');
          return next;
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
  }, [setSearchParams]);

  const filters: SearchFilters = useMemo(() => {
    const radiusParam = searchParams.get('radiusKm');
    const radiusKm = radiusParam != null && radiusParam !== '' ? Number(radiusParam) : undefined;
    return {
      query: searchParams.get('q') || undefined,
      type: searchParams.get('type') || undefined,
      categories: searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
      location: searchParams.get('location') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      priceRanges: searchParams.get('priceRanges')?.split(',').filter(Boolean) || undefined,
      availableOnly: searchParams.get('availableOnly') === 'true',
      myEvents: searchParams.get('myEvents') === 'true',
      followedOnly: searchParams.get('followedOnly') === 'true',
      sortBy: searchParams.get('sortBy') || 'DATE_ASC',
      ...(radiusKm != null && !Number.isNaN(radiusKm) && radiusKm > 0 && { radiusKm }),
    };
  }, [searchParams]);

  useEffect(() => {
    void fetchEvents();
  }, [filters, userPosition]);

  const requestUserPosition = useCallback((options?: { forDisplayOnly?: boolean; sortOnly?: boolean }) => {
    setPositionError(null);
    setPositionLoading(true);
    if (!navigator.geolocation) {
      setPositionError('La géolocalisation n\'est pas supportée par votre navigateur.');
      setPositionLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setPositionLoading(false);
        if (!options?.forDisplayOnly) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('sortBy', 'DISTANCE_ASC');
            if (!options?.sortOnly) next.set('radiusKm', '50');
            return next;
          });
        }
      },
      () => {
        setPositionError('Impossible d\'obtenir votre position. Vérifiez les autorisations.');
        setPositionLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [setSearchParams]);

  const clearNearMeFilter = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('radiusKm');
      return next;
    });
  }, [setSearchParams]);

  const clearUserPosition = useCallback(() => {
    setUserPosition(null);
    setPositionError(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('radiusKm');
      if (next.get('sortBy') === 'DISTANCE_ASC') next.delete('sortBy');
      return next;
    });
  }, [setSearchParams]);

  useEffect(() => {
    const onFocus = () => void fetchEvents();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [filters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const apiParams: Record<string, unknown> = { ...filters };
      if (userPosition) {
        apiParams.latitude = userPosition.lat;
        apiParams.longitude = userPosition.lon;
      }
      if (filters.radiusKm != null && filters.radiusKm > 0) {
        apiParams.radiusKm = filters.radiusKm;
      }
      const data = await eventService.searchEvents(apiParams);
      const normalizedEvents = (data.events || []).map((ev: Record<string, unknown>) => {
        const rawDate = ev.eventDate ?? ev.event_date;
        let eventDateStr: string | undefined;
        if (rawDate instanceof Date) {
          eventDateStr = Number.isNaN(rawDate.getTime()) ? undefined : rawDate.toISOString();
        } else if (typeof rawDate === 'string' && rawDate.trim()) {
          const d = new Date(rawDate.trim());
          eventDateStr = Number.isNaN(d.getTime()) ? undefined : rawDate.trim();
        }
        return {
          ...ev,
          eventDate: eventDateStr ?? (typeof ev.eventDate === 'string' ? ev.eventDate : undefined) ?? (typeof ev.event_date === 'string' ? ev.event_date : undefined),
          createdAt: typeof ev.createdAt === 'string' ? ev.createdAt : new Date().toISOString(),
          updatedAt: typeof ev.updatedAt === 'string' ? ev.updatedAt : new Date().toISOString(),
        };
      });
      setEvents(normalizedEvents);
      setPagination(data.pagination);
    } catch {
      setEvents([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: unknown) => {
    const filterKey = key === 'q' ? 'query' : key;
    const nextFilters: SearchFilters = { ...filters };

    if (value === null || value === undefined || value === '') {
      delete nextFilters[filterKey as keyof SearchFilters];
    } else if (filterKey === 'availableOnly') {
      nextFilters.availableOnly = value === true || value === 'true';
    } else if (filterKey === 'myEvents') {
      nextFilters.myEvents = value === true || value === 'true';
    } else if (filterKey === 'followedOnly') {
      nextFilters.followedOnly = value === true || value === 'true';
    } else if (filterKey === 'categories' && Array.isArray(value)) {
      nextFilters.categories = value.length > 0 ? (value as string[]) : undefined;
    } else if (filterKey === 'priceRanges' && Array.isArray(value)) {
      nextFilters.priceRanges = value.length > 0 ? (value as string[]) : undefined;
    } else {
      (nextFilters as Record<string, unknown>)[filterKey] = value;
    }

    // Ne pas conserver "places disponibles" quand on change un autre filtre :
    // il ne reste coché que si l'utilisateur vient de le cocher.
    if (filterKey !== 'availableOnly') {
      nextFilters.availableOnly = false;
    }

    const newParams = new URLSearchParams();
    if (nextFilters.query) newParams.set('q', nextFilters.query);
    if (nextFilters.type) newParams.set('type', nextFilters.type);
    if (nextFilters.categories?.length) newParams.set('categories', nextFilters.categories.join(','));
    if (nextFilters.location) newParams.set('location', nextFilters.location);
    if (nextFilters.dateFrom) newParams.set('dateFrom', nextFilters.dateFrom);
    if (nextFilters.dateTo) newParams.set('dateTo', nextFilters.dateTo);
    if (nextFilters.priceRanges?.length) newParams.set('priceRanges', nextFilters.priceRanges.join(','));
    if (nextFilters.availableOnly === true) newParams.set('availableOnly', 'true');
    if (nextFilters.myEvents === true) newParams.set('myEvents', 'true');
    if (nextFilters.followedOnly === true) newParams.set('followedOnly', 'true');
    if (nextFilters.sortBy && nextFilters.sortBy !== 'DATE_ASC') newParams.set('sortBy', nextFilters.sortBy);
    if (nextFilters.radiusKm != null && nextFilters.radiusKm > 0) newParams.set('radiusKm', String(nextFilters.radiusKm));

    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.type) count++;
    if (filters.categories?.length) count++;
    if (filters.location) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.priceRanges?.length) count++;
    if (filters.availableOnly) count++;
    if (filters.myEvents) count++;
    if (filters.followedOnly) count++;
    if (filters.radiusKm != null && filters.radiusKm > 0) count++;
    return count;
  }, [filters]);

  return {
    events,
    loading,
    pagination,
    filters,
    updateFilter,
    clearFilters,
    activeFiltersCount,
    userPosition,
    positionLoading,
    positionError,
    requestUserPosition,
    clearUserPosition,
    clearNearMeFilter,
  };
};
