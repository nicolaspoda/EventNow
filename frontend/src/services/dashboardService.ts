import { api } from './api';
import type { UpcomingEvent } from '../types/dashboard.types';

export const dashboardService = {
  getOrganizerOverview: async () => {
    const response = await api.get('/dashboard/organizer/overview');
    return response.data;
  },

  getOrganizerEvents: async () => {
    const response = await api.get('/dashboard/organizer/events');
    return response.data;
  },

  getEventStats: async (eventId: string) => {
    const response = await api.get(
      `/dashboard/organizer/events/${eventId}/stats`,
    );
    return response.data;
  },

  getClientOverview: async () => {
    const response = await api.get('/dashboard/client/overview');
    return response.data;
  },

  getClientEvents: async () => {
    const response = await api.get('/dashboard/client/events');
    return response.data;
  },

  getEventParticipants: async (eventId: string) => {
    const response = await api.get(
      `/dashboard/client/events/${eventId}/participants`,
    );
    return response.data;
  },

  getMyUpcomingEvents: async (): Promise<UpcomingEvent[]> => {
    const response = await api.get<UpcomingEvent[]>('/dashboard/my-upcoming-events');
    return response.data;
  },
};
