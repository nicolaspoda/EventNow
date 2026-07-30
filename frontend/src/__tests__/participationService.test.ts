import { describe, it, expect, vi, beforeEach } from 'vitest';
import { participationService } from '../services/participationService';
import { api } from '../services/api';
import type { ParticipationRequest, CreateParticipationRequestDto } from '../types/participation.types';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const request: ParticipationRequest = {
  id: 'r1',
  eventId: 'e1',
  userId: 'u1',
  status: 'PENDING',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('participationService', () => {
  it('create posts the participation request dto', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: request });
    const dto: CreateParticipationRequestDto = { eventId: 'e1' };

    const result = await participationService.create(dto);

    expect(api.post).toHaveBeenCalledWith('/participation-requests', dto);
    expect(result).toEqual(request);
  });

  it('getByEvent fetches requests for an event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [request] });

    const result = await participationService.getByEvent('e1');

    expect(api.get).toHaveBeenCalledWith('/participation-requests/event/e1');
    expect(result).toEqual([request]);
  });

  it('resolveEventIdForNotification encodes the relatedId', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { eventId: 'e1' } });

    const result = await participationService.resolveEventIdForNotification('some id/with slash');

    expect(api.get).toHaveBeenCalledWith(
      '/participation-requests/resolve-event-id/some%20id%2Fwith%20slash',
    );
    expect(result).toEqual({ eventId: 'e1' });
  });

  it('getMyRequests fetches the current user requests', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [request] });

    const result = await participationService.getMyRequests();

    expect(api.get).toHaveBeenCalledWith('/participation-requests/my');
    expect(result).toEqual([request]);
  });

  it('getMyRequestForEvent fetches the request for a given event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: request });

    const result = await participationService.getMyRequestForEvent('e1');

    expect(api.get).toHaveBeenCalledWith('/participation-requests/my/event/e1');
    expect(result).toEqual(request);
  });

  it('getPendingForOrganizer fetches pending requests', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [request] });

    const result = await participationService.getPendingForOrganizer();

    expect(api.get).toHaveBeenCalledWith('/participation-requests/pending-for-organizer');
    expect(result).toEqual([request]);
  });

  it('respond patches the request with the given action', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: request });

    const result = await participationService.respond('r1', 'ACCEPT');

    expect(api.patch).toHaveBeenCalledWith('/participation-requests/r1/respond', { action: 'ACCEPT' });
    expect(result).toEqual(request);
  });
});
