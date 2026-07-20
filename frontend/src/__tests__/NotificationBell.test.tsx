import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationBell } from '../components/NotificationBell';
import { notificationService } from '../services/notificationService';
import { staffInvitationsService } from '../services/staffInvitationsService';
import { socketService } from '../services/socketService';
import { useAuth } from '../utils/useAuth';
import type { Notification } from '../types/notification.types';

vi.mock('../services/notificationService', () => ({
  notificationService: {
    getUnreadCount: vi.fn(),
    getForUser: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../services/participationService', () => ({
  participationService: {
    resolveEventIdForNotification: vi.fn(),
  },
}));

vi.mock('../services/staffInvitationsService', () => ({
  staffInvitationsService: {
    accept: vi.fn(),
    decline: vi.fn(),
  },
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    saveAuthData: vi.fn(),
  },
}));

vi.mock('../services/socketService', () => ({
  socketService: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

const followerNotification: Notification = {
  id: 'n1',
  userId: 'u1',
  type: 'NEW_FOLLOWER',
  title: 'Nouvel abonné',
  body: 'Bob vous suit désormais',
  read: false,
  relatedId: 'bob-id',
  createdAt: new Date().toISOString(),
};

const staffInvitationNotification: Notification = {
  id: 'n2',
  userId: 'u1',
  type: 'STAFF_INVITATION',
  title: 'Invitation staff',
  body: "Vous êtes invité à rejoindre l'équipe",
  read: false,
  relatedId: 'event-1',
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'u1', username: 'alice', email: 'a@a.com', role: 'USER' },
    isAuthenticated: true,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
  vi.mocked(notificationService.getUnreadCount).mockResolvedValue(0);
  vi.mocked(notificationService.getForUser).mockResolvedValue([]);
});

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );
}

describe('NotificationBell - unread count', () => {
  it('shows no badge when there are no unread notifications', async () => {
    renderBell();
    await waitFor(() => expect(notificationService.getUnreadCount).toHaveBeenCalled());
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows the unread count badge', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(3);
    renderBell();
    expect(await screen.findByText('3')).toBeInTheDocument();
  });

  it('caps the badge at "99+" for large counts', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(150);
    renderBell();
    expect(await screen.findByText('99+')).toBeInTheDocument();
  });
});

describe('NotificationBell - dropdown menu', () => {
  it('is closed by default and opens on click, fetching notifications', async () => {
    vi.mocked(notificationService.getForUser).mockResolvedValue([followerNotification]);
    renderBell();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(await screen.findByText('Nouvel abonné')).toBeInTheDocument();
  });

  it('shows an empty state when there are no notifications', async () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('Aucune notification')).toBeInTheDocument();
  });

  it('marks a single notification as read when clicked', async () => {
    vi.mocked(notificationService.getForUser).mockResolvedValue([followerNotification]);
    vi.mocked(notificationService.markAsRead).mockResolvedValue(undefined);
    renderBell();

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const item = await screen.findByText('Nouvel abonné');

    await act(async () => {
      fireEvent.click(item);
    });

    expect(notificationService.markAsRead).toHaveBeenCalledWith('n1');
  });

  it('marks all notifications as read', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1);
    vi.mocked(notificationService.getForUser).mockResolvedValue([followerNotification]);
    vi.mocked(notificationService.markAllAsRead).mockResolvedValue(undefined);
    renderBell();

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const markAllButton = await screen.findByText('Tout marquer comme lu');

    await act(async () => {
      fireEvent.click(markAllButton);
    });

    expect(notificationService.markAllAsRead).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Tout marquer comme lu')).not.toBeInTheDocument();
  });
});

describe('NotificationBell - staff invitations', () => {
  it('accepts a staff invitation, saves the returned session and dispatches the staff-status event', async () => {
    vi.mocked(notificationService.getForUser).mockResolvedValue([staffInvitationNotification]);
    vi.mocked(staffInvitationsService.accept).mockResolvedValue({
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
      user: { id: 'u1', username: 'alice', email: 'a@a.com', role: 'USER' },
    });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const acceptButton = await screen.findByRole('button', { name: 'Accepter' });

    await act(async () => {
      fireEvent.click(acceptButton);
    });

    expect(staffInvitationsService.accept).toHaveBeenCalledWith('event-1');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'staff-status-changed' }),
    );
  });

  it('declines a staff invitation after confirmation and removes it from the list', async () => {
    vi.mocked(notificationService.getForUser).mockResolvedValue([staffInvitationNotification]);
    vi.mocked(staffInvitationsService.decline).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const declineButton = await screen.findByRole('button', { name: 'Refuser' });

    await act(async () => {
      fireEvent.click(declineButton);
    });

    expect(staffInvitationsService.decline).toHaveBeenCalledWith('event-1');
    await waitFor(() => expect(screen.queryByText('Invitation staff')).not.toBeInTheDocument());
  });

  it('does not decline when the confirmation dialog is cancelled', async () => {
    vi.mocked(notificationService.getForUser).mockResolvedValue([staffInvitationNotification]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const declineButton = await screen.findByRole('button', { name: 'Refuser' });

    await act(async () => {
      fireEvent.click(declineButton);
    });

    expect(staffInvitationsService.decline).not.toHaveBeenCalled();
  });
});

describe('NotificationBell - socket subscription', () => {
  it('subscribes to newNotification and socketReconnected on mount', () => {
    renderBell();

    expect(socketService.on).toHaveBeenCalledWith('newNotification', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('socketReconnected', expect.any(Function));
  });

  it('unsubscribes from socket events on unmount', () => {
    const { unmount } = renderBell();
    unmount();

    expect(socketService.off).toHaveBeenCalledWith('newNotification', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('socketReconnected', expect.any(Function));
  });
});
