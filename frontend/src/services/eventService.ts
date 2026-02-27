import { api } from './api';
import type { Event, EventFilters } from '../types/event.types';

export const eventService = {
  getEvents: async (filters?: EventFilters): Promise<Event[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    
    const queryString = params.toString();
    const url = queryString ? `/events?${queryString}` : '/events';
    
    const response = await api.get<Event[]>(url);
    return response.data;
  },

  getEventById: async (id: string): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },
};
