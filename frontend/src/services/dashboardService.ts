import { api } from './api';
import type { UpcomingEvent, ParticipatedEvent } from '../types/dashboard.types';

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

  getUserOverview: async () => {
    const response = await api.get('/dashboard/user/overview');
    return response.data;
  },

  getUserEvents: async () => {
    const response = await api.get('/dashboard/user/events');
    return response.data;
  },

  getEventParticipants: async (eventId: string) => {
    const response = await api.get(
      `/dashboard/user/events/${eventId}/participants`,
    );
    return response.data;
  },

  getMyUpcomingEvents: async (): Promise<UpcomingEvent[]> => {
    const response = await api.get<UpcomingEvent[]>('/dashboard/my-upcoming-events');
    return response.data;
  },

  getMyParticipatedEvents: async (): Promise<ParticipatedEvent[]> => {
    const response = await api.get<ParticipatedEvent[]>('/dashboard/my-participated-events');
    return response.data;
  },

  getMyCalendarEvents: async (): Promise<ParticipatedEvent[]> => {
    const response = await api.get<ParticipatedEvent[]>('/dashboard/my-calendar-events');
    return response.data;
  },
};
