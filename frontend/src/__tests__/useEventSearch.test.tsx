import { renderHook, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { useEventSearch } from '../hooks/useEventSearch';
import { eventService } from '../services/eventService';

vi.mock('../services/eventService', () => ({
  eventService: {
    searchEvents: vi.fn(),
  },
}));

const searchResult = {
  events: [
    {
      id: 'e1',
      title: 'Concert',
      location: 'Paris',
      eventDate: '2026-01-01T20:00:00.000Z',
      organizerId: 'org1',
      ticketCategories: [],
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/events']}>{children}</MemoryRouter>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(eventService.searchEvents).mockResolvedValue(searchResult);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useEventSearch', () => {
  it('fetches events on mount with the default DATE_ASC sort', async () => {
    const { result } = renderHook(() => useEventSearch(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(eventService.searchEvents).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'DATE_ASC' }),
    );
    expect(result.current.events).toHaveLength(1);
    expect(result.current.pagination).toEqual(searchResult.pagination);
  });

  it('clears loading and events when the search request fails', async () => {
    vi.mocked(eventService.searchEvents).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useEventSearch(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([]);
    expect(result.current.pagination).toBeNull();
  });

  it('updateFilter sets the query and reports it in activeFiltersCount', async () => {
    const { result } = renderHook(() => useEventSearch(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateFilter('q', 'jazz');
    });

    await waitFor(() => expect(result.current.filters.query).toBe('jazz'));
    expect(result.current.activeFiltersCount).toBe(1);
  });

  it('updateFilter resets availableOnly when a different filter changes', async () => {
    const { result } = renderHook(() => useEventSearch(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateFilter('availableOnly', true);
    });
    await waitFor(() => expect(result.current.filters.availableOnly).toBe(true));

    act(() => {
      result.current.updateFilter('location', 'Lyon');
    });

    await waitFor(() => expect(result.current.filters.location).toBe('Lyon'));
    expect(result.current.filters.availableOnly).toBe(false);
  });

  it('clearFilters removes all query params', async () => {
    const { result } = renderHook(() => useEventSearch(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateFilter('q', 'jazz');
    });
    await waitFor(() => expect(result.current.filters.query).toBe('jazz'));

    act(() => {
      result.current.clearFilters();
    });

    await waitFor(() => expect(result.current.filters.query).toBeUndefined());
    expect(result.current.activeFiltersCount).toBe(0);
  });

  it('requestUserPosition reports an error when geolocation is unsupported', async () => {
    vi.stubGlobal('navigator', { geolocation: undefined, permissions: undefined });

    const { result } = renderHook(() => useEventSearch(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.requestUserPosition();
    });

    expect(result.current.positionError).toBe(
      "La géolocalisation n'est pas supportée par votre navigateur.",
    );
    expect(result.current.positionLoading).toBe(false);
  });

  it('requestUserPosition sets the user position and switches to distance sorting on success', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 48.85, longitude: 2.35 },
      } as GeolocationPosition);
    });
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition },
      permissions: undefined,
    });

    const { result } = renderHook(() => useEventSearch(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.requestUserPosition();
    });

    await waitFor(() => expect(result.current.userPosition).toEqual({ lat: 48.85, lon: 2.35 }));
    expect(result.current.positionLoading).toBe(false);
    await waitFor(() => expect(result.current.filters.sortBy).toBe('DISTANCE_ASC'));
    expect(result.current.filters.radiusKm).toBe(50);
  });

  it('requestUserPosition reports a permission-denied error', async () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, PERMISSION_DENIED: 1, TIMEOUT: 3 } as GeolocationPositionError);
      },
    );
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition },
      permissions: undefined,
    });

    const { result } = renderHook(() => useEventSearch(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.requestUserPosition();
    });

    await waitFor(() =>
      expect(result.current.positionError).toBe(
        'Géolocalisation bloquée. Autorisez la localisation dans votre navigateur puis réessayez.',
      ),
    );
  });

  it('clearUserPosition resets position state and removes distance sorting', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition);
    });
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition },
      permissions: undefined,
    });

    const { result } = renderHook(() => useEventSearch(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.requestUserPosition();
    });
    await waitFor(() => expect(result.current.userPosition).not.toBeNull());

    act(() => {
      result.current.clearUserPosition();
    });

    expect(result.current.userPosition).toBeNull();
    await waitFor(() => expect(result.current.filters.sortBy).toBe('DATE_ASC'));
    expect(result.current.filters.radiusKm).toBeUndefined();
  });
});
