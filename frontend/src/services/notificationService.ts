import { api } from './api';
import type { Notification } from '../types/notification.types';

export const notificationService = {
  getForUser: async (unreadOnly = false): Promise<Notification[]> => {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    const response = await api.get<Notification[]>(`/notifications${params}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<number>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
