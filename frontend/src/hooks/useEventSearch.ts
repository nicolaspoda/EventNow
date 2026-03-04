import { useState, useEffect, useMemo } from 'react';
import { eventService } from '../services/eventService';
import { useSearchParams } from 'react-router-dom';

interface SearchFilters {
  query?: string;
  type?: string;
  categories?: string[];
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  priceRanges?: string[];
  availableOnly?: boolean;
  sortBy?: string;
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

interface Event {
  id: string;
  title: string;
  description?: string;
  location: string;
  imageUrl?: string;
  eventDate: string;
  type: string;
  category: string;
  stats?: EventStats;
  ticketCategories: Array<{
    name: string;
    price: number;
    currentStock: number;
    initialStock: number;
  }>;
  organizer: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const useEventSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const filters: SearchFilters = useMemo(() => {
    return {
      query: searchParams.get('q') || undefined,
      type: searchParams.get('type') || undefined,
      categories: searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
      location: searchParams.get('location') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      priceRanges: searchParams.get('priceRanges')?.split(',').filter(Boolean) || undefined,
      availableOnly: searchParams.get('availableOnly') === 'true',
      sortBy: searchParams.get('sortBy') || 'DATE_ASC',
    };
  }, [searchParams]);

  useEffect(() => {
    void fetchEvents();
  }, [filters]);

  useEffect(() => {
    const onFocus = () => void fetchEvents();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [filters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.searchEvents(filters);
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
    if (nextFilters.sortBy && nextFilters.sortBy !== 'DATE_ASC') newParams.set('sortBy', nextFilters.sortBy);

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
  };
};
