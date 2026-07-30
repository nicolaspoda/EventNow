import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../services/notificationService';
import { api } from '../services/api';
import type { Notification } from '../types/notification.types';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const notification: Notification = {
  id: 'n1',
  userId: 'u1',
  type: 'FOLLOW',
  title: 'New follower',
  body: 'Alice started following you',
  read: false,
  createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('notificationService', () => {
  it('getForUser fetches without the unreadOnly param by default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [notification] });

    const result = await notificationService.getForUser();

    expect(api.get).toHaveBeenCalledWith('/notifications');
    expect(result).toEqual([notification]);
  });

  it('getForUser fetches with the unreadOnly param when true', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await notificationService.getForUser(true);

    expect(api.get).toHaveBeenCalledWith('/notifications?unreadOnly=true');
  });

  it('getUnreadCount fetches the unread count', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: 3 });

    const result = await notificationService.getUnreadCount();

    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
    expect(result).toBe(3);
  });

  it('markAsRead patches the given notification id', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: notification });

    const result = await notificationService.markAsRead('n1');

    expect(api.patch).toHaveBeenCalledWith('/notifications/n1/read');
    expect(result).toEqual(notification);
  });

  it('markAllAsRead patches the read-all endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: undefined });

    await notificationService.markAllAsRead();

    expect(api.patch).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('delete deletes the given notification id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await notificationService.delete('n1');

    expect(api.delete).toHaveBeenCalledWith('/notifications/n1');
  });
});
