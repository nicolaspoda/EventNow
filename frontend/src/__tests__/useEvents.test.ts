import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEvents } from '../hooks/useEvents';
import { eventService } from '../services/eventService';
import type { Event } from '../types/event.types';

vi.mock('../services/eventService', () => ({
  eventService: {
    getEvents: vi.fn(),
  },
}));

const event: Event = {
  id: 'e1',
  title: 'Concert',
  location: 'Paris',
  eventDate: '2026-01-01T20:00:00.000Z',
  organizerId: 'org1',
  ticketCategories: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useEvents', () => {
  it('starts in a loading state with no events or error', () => {
    vi.mocked(eventService.getEvents).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useEvents({}));

    expect(result.current.loading).toBe(true);
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('loads events and stops loading on success', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValue([event]);

    const { result } = renderHook(() => useEvents({ search: 'concert' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([event]);
    expect(result.current.error).toBeNull();
    expect(eventService.getEvents).toHaveBeenCalledWith({ search: 'concert' });
  });

  it('sets a user-facing error message and empties loading on failure', async () => {
    vi.mocked(eventService.getEvents).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useEvents({}));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Erreur lors du chargement des événements');
    expect(result.current.events).toEqual([]);
  });

  it('refetches when the filters change', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValue([event]);

    const { rerender } = renderHook(({ filters }) => useEvents(filters), {
      initialProps: { filters: { search: 'a' } },
    });

    await waitFor(() => expect(eventService.getEvents).toHaveBeenCalledTimes(1));

    rerender({ filters: { search: 'b' } });

    await waitFor(() => expect(eventService.getEvents).toHaveBeenCalledTimes(2));
    expect(eventService.getEvents).toHaveBeenLastCalledWith({ search: 'b' });
  });
});
