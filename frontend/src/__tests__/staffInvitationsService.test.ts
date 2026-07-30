import { describe, it, expect, vi, beforeEach } from 'vitest';
import { staffInvitationsService } from '../services/staffInvitationsService';
import { api } from '../services/api';
import type { StaffInvitation } from '../services/staffInvitationsService';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const invitation: StaffInvitation = {
  id: 'i1',
  email: 'staff@example.com',
  token: 'tok123',
  status: 'PENDING',
  expiresAt: '2026-02-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('staffInvitationsService', () => {
  it('create trims the email and posts it with the event id', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: invitation });

    const result = await staffInvitationsService.create('  staff@example.com  ', 'e1');

    expect(api.post).toHaveBeenCalledWith('/staff-invitations', {
      email: 'staff@example.com',
      eventId: 'e1',
    });
    expect(result).toEqual(invitation);
  });

  it('getMyInvitations fetches invitations sent by the organizer', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [invitation] });

    const result = await staffInvitationsService.getMyInvitations();

    expect(api.get).toHaveBeenCalledWith('/staff-invitations/my-invitations');
    expect(result).toEqual([invitation]);
  });

  it('getPendingForMe fetches pending invitations for the current user', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [invitation] });

    const result = await staffInvitationsService.getPendingForMe();

    expect(api.get).toHaveBeenCalledWith('/staff-invitations/pending');
    expect(result).toEqual([invitation]);
  });

  it('getByToken fetches the invitation for a token', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: invitation });

    const result = await staffInvitationsService.getByToken('tok123');

    expect(api.get).toHaveBeenCalledWith('/staff-invitations/token/tok123');
    expect(result).toEqual(invitation);
  });

  it('accept posts the token and returns the response', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'ok' } });

    const result = await staffInvitationsService.accept('tok123');

    expect(api.post).toHaveBeenCalledWith('/staff-invitations/accept', { token: 'tok123' });
    expect(result).toEqual({ message: 'ok' });
  });

  it('decline posts the token', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'declined' } });

    const result = await staffInvitationsService.decline('tok123');

    expect(api.post).toHaveBeenCalledWith('/staff-invitations/decline', { token: 'tok123' });
    expect(result).toEqual({ message: 'declined' });
  });

  it('cancel deletes the invitation by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { message: 'cancelled' } });

    const result = await staffInvitationsService.cancel('i1');

    expect(api.delete).toHaveBeenCalledWith('/staff-invitations/i1');
    expect(result).toEqual({ message: 'cancelled' });
  });
});
