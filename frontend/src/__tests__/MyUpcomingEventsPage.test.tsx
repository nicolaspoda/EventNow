import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyUpcomingEventsPage from '../pages/MyUpcomingEventsPage';
import { dashboardService } from '../services/dashboardService';
import type { UpcomingEvent } from '../types/dashboard.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getMyUpcomingEvents: vi.fn(),
  },
}));

vi.mock('../components/dashboard/FriendsActivitySection', () => ({
  FriendsActivitySection: () => <div data-testid="friends-activity" />,
}));

function makeEvent(overrides: Partial<UpcomingEvent> = {}): UpcomingEvent {
  return {
    id: 'e1',
    title: 'Concert de jazz',
    eventDate: '2026-06-15T20:00:00.000Z',
    location: 'Paris',
    type: 'PROFESSIONAL',
    category: 'CONCERT' as never,
    participationType: 'TICKET',
    ticketCount: 1,
    categoryName: 'Standard',
    ...overrides,
  } as UpcomingEvent;
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <MyUpcomingEventsPage />
    </MemoryRouter>,
  );
}

describe('MyUpcomingEventsPage - loading, error and empty states', () => {
  it('shows a loading state initially', () => {
    vi.mocked(dashboardService.getMyUpcomingEvents).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement de vos sorties...')).toBeInTheDocument();
  });

  it('shows an error state with a retry button', async () => {
    vi.mocked(dashboardService.getMyUpcomingEvents).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText('Impossible de charger vos événements à venir'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });

  it('retries loading when the retry button is clicked', async () => {
    vi.mocked(dashboardService.getMyUpcomingEvents).mockRejectedValueOnce(new Error('boom'));
    vi.mocked(dashboardService.getMyUpcomingEvents).mockResolvedValueOnce([makeEvent()]);

    renderPage();
    await screen.findByRole('button', { name: 'Réessayer' });
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByText('Concert de jazz')).toBeInTheDocument();
  });

  it('shows an empty state with links to friends events and participations', async () => {
    vi.mocked(dashboardService.getMyUpcomingEvents).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucune sortie prévue')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voir les sorties de mes amis' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events?friendsOnly=true');

    fireEvent.click(screen.getByText('Voir mes participations (passés et à venir)'));
    expect(mockNavigate).toHaveBeenCalledWith('/my-participated-events');
  });
});

describe('MyUpcomingEventsPage - listing and filters', () => {
  it('shows the event count and cards', async () => {
    vi.mocked(dashboardService.getMyUpcomingEvents).mockResolvedValue([
      makeEvent({ id: 'e1', participationType: 'TICKET' }),
      makeEvent({ id: 'e2', participationType: 'ORGANIZER', title: 'Festival rock' }),
    ]);

    renderPage();

    expect(await screen.findByText('2 sorties programmées')).toBeInTheDocument();
    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText('Festival rock')).toBeInTheDocument();
    expect(screen.getByTestId('friends-activity')).toBeInTheDocument();
  });

  it('filters events by participation type', async () => {
    vi.mocked(dashboardService.getMyUpcomingEvents).mockResolvedValue([
      makeEvent({ id: 'e1', participationType: 'TICKET', title: 'Concert de jazz' }),
      makeEvent({ id: 'e2', participationType: 'ORGANIZER', title: 'Festival rock' }),
    ]);

    renderPage();
    await screen.findByText('Concert de jazz');

    fireEvent.click(screen.getByText('Organisés (1)'));

    expect(screen.queryByText('Concert de jazz')).not.toBeInTheDocument();
    expect(screen.getByText('Festival rock')).toBeInTheDocument();
  });

  it('shows a message when no event matches the active filter', async () => {
    vi.mocked(dashboardService.getMyUpcomingEvents).mockResolvedValue([
      makeEvent({ participationType: 'TICKET' }),
    ]);

    renderPage();
    await screen.findByText('Concert de jazz');
    fireEvent.click(screen.getByText('Staff (0)'));

    expect(screen.getByText('Aucun événement ne correspond à ce filtre.')).toBeInTheDocument();
  });

  it('navigates via the header action buttons', async () => {
    vi.mocked(dashboardService.getMyUpcomingEvents).mockResolvedValue([makeEvent()]);

    renderPage();
    await screen.findByText('Concert de jazz');

    fireEvent.click(screen.getByRole('button', { name: 'Mes participations' }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-participated-events');

    fireEvent.click(screen.getByRole('button', { name: 'Sorties de mes amis' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events?friendsOnly=true');
  });
});
