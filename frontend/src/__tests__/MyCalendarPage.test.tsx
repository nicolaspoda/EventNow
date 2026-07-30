import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyCalendarPage from '../pages/MyCalendarPage';
import { dashboardService } from '../services/dashboardService';
import type { ParticipatedEvent } from '../types/dashboard.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getMyCalendarEvents: vi.fn(),
  },
}));

vi.mock('../components/calendar/CalendarView', () => ({
  default: ({
    events,
    onSelectEvent,
  }: {
    events: ParticipatedEvent[];
    onSelectEvent?: (event: ParticipatedEvent) => void;
  }) => (
    <div data-testid="calendar-view">
      {events.map((e) => (
        <button key={e.id} type="button" onClick={() => onSelectEvent?.(e)}>
          {e.title}
        </button>
      ))}
    </div>
  ),
}));

function makeEvent(overrides: Partial<ParticipatedEvent> = {}): ParticipatedEvent {
  return {
    id: 'e1',
    title: 'Concert de jazz',
    eventDate: '2099-06-01T20:00:00.000Z',
    location: 'Paris',
    type: 'PROFESSIONAL',
    category: 'MUSIC',
    isPast: false,
    ...overrides,
  } as ParticipatedEvent;
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <MyCalendarPage />
    </MemoryRouter>,
  );
}

describe('MyCalendarPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(dashboardService.getMyCalendarEvents).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement de votre calendrier...')).toBeInTheDocument();
  });

  it('shows an error message and allows retrying', async () => {
    vi.mocked(dashboardService.getMyCalendarEvents)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([]);

    renderPage();

    expect(
      await screen.findByText('Impossible de charger vos événements'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() =>
      expect(dashboardService.getMyCalendarEvents).toHaveBeenCalledTimes(2),
    );
  });

  it('shows an empty state and navigates to events', async () => {
    vi.mocked(dashboardService.getMyCalendarEvents).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucun événement')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Découvrir les événements' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  it('shows the event counts split between upcoming and past', async () => {
    vi.mocked(dashboardService.getMyCalendarEvents).mockResolvedValue([
      makeEvent({ id: 'e1', isPast: false }),
      makeEvent({ id: 'e2', isPast: true }),
      makeEvent({ id: 'e3', isPast: true }),
    ]);

    renderPage();

    expect(
      await screen.findByText('3 événements au total · 1 à venir · 2 passés'),
    ).toBeInTheDocument();
  });

  it('navigates to the event detail page when an event is selected on the calendar', async () => {
    vi.mocked(dashboardService.getMyCalendarEvents).mockResolvedValue([makeEvent()]);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Concert de jazz' }));

    expect(mockNavigate).toHaveBeenCalledWith('/events/e1');
  });

  it('navigates to the list view and to events discovery', async () => {
    vi.mocked(dashboardService.getMyCalendarEvents).mockResolvedValue([makeEvent()]);

    renderPage();
    await screen.findByTestId('calendar-view');

    fireEvent.click(screen.getByRole('button', { name: 'Vue liste' }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-upcoming-events');

    fireEvent.click(screen.getByRole('button', { name: 'Découvrir plus' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });
});
