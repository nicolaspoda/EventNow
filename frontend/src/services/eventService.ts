import { api } from './api';
import type {
  Event,
  EventFilters,
  CreateEventPayload,
  UpdateEventPayload,
} from '../types/event.types';

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

  createEvent: async (payload: CreateEventPayload): Promise<Event> => {
    const response = await api.post<Event>('/events', payload);
    return response.data;
  },

  updateEvent: async (
    id: string,
    payload: UpdateEventPayload,
  ): Promise<Event> => {
    const response = await api.patch<Event>(`/events/${id}`, payload);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },
};
