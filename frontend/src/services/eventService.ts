import axios from 'axios';
import type { Event, EventFilters } from '../types/event.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const eventService = {
  getEvents: async (filters?: EventFilters): Promise<Event[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    
    const queryString = params.toString();
    const url = queryString ? `${API_URL}/events?${queryString}` : `${API_URL}/events`;
    
    const response = await axios.get<Event[]>(url);
    return response.data;
  },

  getEventById: async (id: string): Promise<Event> => {
    const response = await axios.get<Event>(`${API_URL}/events/${id}`);
    return response.data;
  },
};
