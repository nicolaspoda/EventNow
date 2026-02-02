import { useState, useEffect } from 'react';
import type { Event, EventFilters } from '../types/event.types';
import { eventService } from '../services/eventService';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

export const useEvents = (filters: EventFilters) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await eventService.getEvents(filters);
        setEvents(data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Erreur lors du chargement des événements'));
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filters]);

  return { events, loading, error };
};
