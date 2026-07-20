import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizerDashboardPage } from '../pages/OrganizerDashboardPage';
import { dashboardService } from '../services/dashboardService';
import type { OrganizerOverview, DashboardEvent } from '../types/dashboard.types';

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getOrganizerOverview: vi.fn(),
    getOrganizerEvents: vi.fn(),
  },
}));

vi.mock('../components/dashboard/EventsTable', () => ({
  EventsTable: ({ events, type }: { events: DashboardEvent[]; type: string }) => (
    <div data-testid="events-table">
      {events.length} événement(s) ({type})
    </div>
  ),
}));

vi.mock('../components/dashboard/RevenueChart', () => ({
  RevenueChart: () => <div data-testid="revenue-chart" />,
}));

vi.mock('../components/dashboard/SalesChart', () => ({
  SalesChart: () => <div data-testid="sales-chart" />,
}));

function makeOverview(overrides: Partial<OrganizerOverview> = {}): OrganizerOverview {
  return {
    totalEvents: 5,
    upcomingEvents: 2,
    pastEvents: 3,
    totalRevenue: 1234.5,
    totalTicketsSold: 42,
    averageTicketPrice: 29.4,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(dashboardService.getOrganizerEvents).mockResolvedValue([]);
});

describe('OrganizerDashboardPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(dashboardService.getOrganizerOverview).mockReturnValue(new Promise(() => {}));

    render(<OrganizerDashboardPage />);

    expect(screen.getByRole('status', { name: 'Chargement en cours' })).toBeInTheDocument();
  });

  it('shows the backend error message on failure', async () => {
    const err = Object.assign(new Error('boom'), {
      response: { data: { message: 'Accès refusé' } },
    });
    vi.mocked(dashboardService.getOrganizerOverview).mockRejectedValue(err);

    render(<OrganizerDashboardPage />);

    expect(await screen.findByText('Accès refusé')).toBeInTheDocument();
  });

  it('shows a default error message on a plain error', async () => {
    vi.mocked(dashboardService.getOrganizerOverview).mockRejectedValue(new Error('boom'));

    render(<OrganizerDashboardPage />);

    expect(
      await screen.findByText('Erreur lors du chargement du tableau de bord'),
    ).toBeInTheDocument();
  });

  it('shows the key stats, charts and events table once loaded', async () => {
    vi.mocked(dashboardService.getOrganizerOverview).mockResolvedValue(makeOverview());
    vi.mocked(dashboardService.getOrganizerEvents).mockResolvedValue([
      { id: 'e1' } as DashboardEvent,
    ]);

    render(<OrganizerDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'Tableau de bord organisateur' })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('1234.50 €')).toBeInTheDocument();
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    expect(screen.getByTestId('sales-chart')).toBeInTheDocument();
    expect(screen.getByTestId('events-table')).toHaveTextContent('1 événement(s) (professional)');
  });
});
