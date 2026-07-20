import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventsPage from '../pages/EventsPage';
import { useEventSearch } from '../hooks/useEventSearch';
import { useAuth } from '../utils/useAuth';
import type { Event } from '../types/event.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../hooks/useEventSearch', () => ({
  useEventSearch: vi.fn(),
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/eventService', () => ({
  eventService: {
    getSuggestions: vi.fn().mockResolvedValue([]),
  },
}));

let capturedOnEventClick: ((eventId: string) => void) | undefined;
vi.mock('../components/map/EventsMap', () => ({
  EventsMap: ({ onEventClick }: { onEventClick?: (eventId: string) => void }) => {
    capturedOnEventClick = onEventClick;
    return <div data-testid="events-map" />;
  },
}));

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'e1',
    title: 'Concert de jazz',
    location: 'Paris',
    eventDate: '2026-06-15T20:00:00.000Z',
    organizerId: 'org1',
    ticketCategories: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function defaultSearchState(overrides: Partial<ReturnType<typeof useEventSearch>> = {}) {
  return {
    events: [],
    loading: false,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    filters: { sortBy: 'DATE_ASC' },
    updateFilter: vi.fn(),
    clearFilters: vi.fn(),
    activeFiltersCount: 0,
    userPosition: null,
    positionLoading: false,
    positionError: null,
    requestUserPosition: vi.fn(),
    clearUserPosition: vi.fn(),
    clearNearMeFilter: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useEventSearch>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'me', username: 'me', email: 'me@example.com', role: 'USER' },
    isAuthenticated: true,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>,
  );
}

describe('EventsPage - results and loading', () => {
  it('shows the result count and the event list', () => {
    vi.mocked(useEventSearch).mockReturnValue(
      defaultSearchState({
        events: [makeEvent()],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    );

    renderPage();

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/événement.*trouvé/)).toBeInTheDocument();
    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
  });

  it('shows a loading indicator while searching', () => {
    vi.mocked(useEventSearch).mockReturnValue(defaultSearchState({ loading: true }));

    renderPage();

    expect(screen.getByText('Recherche en cours...')).toBeInTheDocument();
  });

  it('shows the empty state from EventList when there are no results', () => {
    vi.mocked(useEventSearch).mockReturnValue(defaultSearchState());

    renderPage();

    expect(screen.getByText('Aucun événement trouvé')).toBeInTheDocument();
  });
});

describe('EventsPage - filters and search', () => {
  it('updates the query filter as the user types', () => {
    const updateFilter = vi.fn();
    vi.mocked(useEventSearch).mockReturnValue(defaultSearchState({ updateFilter }));

    renderPage();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'jazz' } });

    expect(updateFilter).toHaveBeenCalledWith('q', 'jazz');
  });

  it('shows filter chips and clears an individual filter', () => {
    const updateFilter = vi.fn();
    vi.mocked(useEventSearch).mockReturnValue(
      defaultSearchState({
        filters: { sortBy: 'DATE_ASC', location: 'Paris' },
        activeFiltersCount: 1,
        updateFilter,
      }),
    );

    renderPage();

    fireEvent.click(screen.getByText('Lieu: Paris'));

    expect(updateFilter).toHaveBeenCalledWith('location', null);
  });

  it('does not show filter chips when there are no active filters', () => {
    vi.mocked(useEventSearch).mockReturnValue(defaultSearchState({ activeFiltersCount: 0 }));

    renderPage();

    expect(screen.queryByText('Filtres actifs:')).not.toBeInTheDocument();
  });
});

describe('EventsPage - view mode toggle', () => {
  it('defaults to the list view with sort options visible', () => {
    vi.mocked(useEventSearch).mockReturnValue(defaultSearchState());

    renderPage();

    expect(screen.getByLabelText('Ordre de tri')).toBeInTheDocument();
    expect(screen.queryByTestId('events-map')).not.toBeInTheDocument();
  });

  it('switches to the map view', () => {
    vi.mocked(useEventSearch).mockReturnValue(defaultSearchState());

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Vue carte' }));

    expect(screen.getByTestId('events-map')).toBeInTheDocument();
    expect(screen.queryByLabelText('Ordre de tri')).not.toBeInTheDocument();
  });
});

describe('EventsPage - "near me" sorting', () => {
  it('requests the user position when sorting by distance without a known position', () => {
    const requestUserPosition = vi.fn();
    vi.mocked(useEventSearch).mockReturnValue(
      defaultSearchState({ userPosition: null, requestUserPosition }),
    );

    renderPage();
    fireEvent.change(screen.getByLabelText('Ordre de tri'), { target: { value: 'DISTANCE_ASC' } });

    expect(requestUserPosition).toHaveBeenCalledWith({ sortOnly: true });
  });

  it('applies distance sort directly when the user position is already known', () => {
    const updateFilter = vi.fn();
    vi.mocked(useEventSearch).mockReturnValue(
      defaultSearchState({ userPosition: { lat: 1, lon: 2 }, updateFilter }),
    );

    renderPage();
    fireEvent.change(screen.getByLabelText('Ordre de tri'), { target: { value: 'DISTANCE_ASC' } });

    expect(updateFilter).toHaveBeenCalledWith('sortBy', 'DISTANCE_ASC');
  });

  it('shows the "near me" active chip and clears it', () => {
    const clearNearMeFilter = vi.fn();
    vi.mocked(useEventSearch).mockReturnValue(
      defaultSearchState({ filters: { sortBy: 'DATE_ASC', radiusKm: 25 }, clearNearMeFilter }),
    );

    renderPage();
    fireEvent.click(screen.getByText('Près de moi (25 km)'));

    expect(clearNearMeFilter).toHaveBeenCalledTimes(1);
  });

  it('shows a position error message when present', () => {
    vi.mocked(useEventSearch).mockReturnValue(
      defaultSearchState({ positionError: 'Géolocalisation bloquée.' }),
    );

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Géolocalisation bloquée.');
  });
});

describe('EventsPage - navigation to an event from the map', () => {
  it('navigates to the event detail page when a map marker is clicked', () => {
    vi.mocked(useEventSearch).mockReturnValue(defaultSearchState({ events: [makeEvent()] }));

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Vue carte' }));
    capturedOnEventClick?.('e1');

    expect(mockNavigate).toHaveBeenCalledWith('/events/e1');
  });
});
