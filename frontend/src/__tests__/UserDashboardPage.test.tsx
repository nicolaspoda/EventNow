import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserDashboardPage } from '../pages/UserDashboardPage';
import { dashboardService } from '../services/dashboardService';
import { participationService } from '../services/participationService';
import type { UserOverview, DashboardEvent } from '../types/dashboard.types';
import type { ParticipationRequest } from '../types/participation.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getUserOverview: vi.fn(),
    getUserEvents: vi.fn(),
  },
}));

vi.mock('../services/participationService', () => ({
  participationService: {
    getPendingForOrganizer: vi.fn(),
  },
}));

vi.mock('../components/dashboard/EventsTable', () => ({
  EventsTable: ({ events, type }: { events: DashboardEvent[]; type: string }) => (
    <div data-testid="events-table">
      {events.length} événement(s) ({type})
    </div>
  ),
}));

vi.mock('../components/dashboard/ParticipantsChart', () => ({
  ParticipantsChart: () => <div data-testid="participants-chart" />,
}));

vi.mock('../components/dashboard/PendingRequestsList', () => ({
  PendingRequestsList: ({ requests }: { requests: ParticipationRequest[] }) => (
    <div data-testid="pending-requests-list">{requests.length} demande(s)</div>
  ),
}));

vi.mock('../components/dashboard/FriendsActivitySection', () => ({
  FriendsActivitySection: () => <div data-testid="friends-activity-section" />,
}));

function makeOverview(overrides: Partial<UserOverview> = {}): UserOverview {
  return {
    totalEvents: 4,
    upcomingEvents: 1,
    totalParticipants: 20,
    averageParticipants: 5,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(dashboardService.getUserEvents).mockResolvedValue([]);
  vi.mocked(participationService.getPendingForOrganizer).mockResolvedValue([]);
});

function renderPage() {
  return render(
    <MemoryRouter>
      <UserDashboardPage />
    </MemoryRouter>,
  );
}

describe('UserDashboardPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(dashboardService.getUserOverview).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status', { name: 'Chargement en cours' })).toBeInTheDocument();
  });

  it('shows an error message on failure', async () => {
    vi.mocked(dashboardService.getUserOverview).mockRejectedValue({
      response: { data: { message: 'Accès refusé' } },
    });

    renderPage();

    expect(await screen.findByText('Accès refusé')).toBeInTheDocument();
  });

  it('shows the key stats and the friends activity section', async () => {
    vi.mocked(dashboardService.getUserOverview).mockResolvedValue(makeOverview());

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Mes événements communautaires' }),
    ).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByTestId('friends-activity-section')).toBeInTheDocument();
  });

  it('shows the participants chart and create-event button when there are events', async () => {
    vi.mocked(dashboardService.getUserOverview).mockResolvedValue(makeOverview());
    vi.mocked(dashboardService.getUserEvents).mockResolvedValue([{ id: 'e1' } as DashboardEvent]);
    vi.mocked(participationService.getPendingForOrganizer).mockResolvedValue([
      { id: 'p1' } as ParticipationRequest,
    ]);

    renderPage();

    expect(await screen.findByTestId('participants-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pending-requests-list')).toHaveTextContent('1 demande(s)');
    expect(screen.getByTestId('events-table')).toHaveTextContent('1 événement(s) (community)');

    fireEvent.click(screen.getByRole('button', { name: '+ Créer un événement' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events/create');
  });

  it('does not show the participants chart or create-event button when there are no events', async () => {
    vi.mocked(dashboardService.getUserOverview).mockResolvedValue(makeOverview());

    renderPage();

    await screen.findByTestId('events-table');
    expect(screen.queryByTestId('participants-chart')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Créer un événement' })).not.toBeInTheDocument();
  });

  it('treats a failed pending-requests fetch as an empty list', async () => {
    vi.mocked(dashboardService.getUserOverview).mockResolvedValue(makeOverview());
    vi.mocked(participationService.getPendingForOrganizer).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(await screen.findByTestId('pending-requests-list')).toHaveTextContent('0 demande(s)');
  });
});
