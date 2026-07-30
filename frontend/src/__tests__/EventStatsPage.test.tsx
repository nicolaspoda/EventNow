import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventStatsPage } from '../pages/EventStatsPage';
import { dashboardService } from '../services/dashboardService';
import type { EventStatsDetail } from '../types/dashboard.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getEventStats: vi.fn(),
  },
}));

function makeStats(overrides: Partial<EventStatsDetail> = {}): EventStatsDetail {
  return {
    event: { id: 'e1', title: 'Concert de jazz', eventDate: '2026-06-15T20:00:00.000Z' },
    categoriesStats: [
      { id: 'c1', name: 'Standard', price: 20, initialStock: 100, currentStock: 40, sold: 60, revenue: 1200, fillRate: 60 },
    ],
    salesByDay: { '2026-01-01': 5, '2026-01-02': 3 },
    totalRevenue: 1200,
    totalSold: 60,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/events/e1/stats']}>
      <Routes>
        <Route path="/dashboard/events/:id/stats" element={<EventStatsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventStatsPage - loading and errors', () => {
  it('shows a loading state initially', () => {
    vi.mocked(dashboardService.getEventStats).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status', { name: 'Chargement' })).toBeInTheDocument();
  });

  it('shows an error and a link back to the dashboard on failure', async () => {
    vi.mocked(dashboardService.getEventStats).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText('Erreur lors du chargement des statistiques'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour au tableau de bord' })).toHaveAttribute(
      'href',
      '/dashboard/organizer',
    );
  });
});

describe('EventStatsPage - content', () => {
  it('shows the event title, total revenue and tickets sold', async () => {
    vi.mocked(dashboardService.getEventStats).mockResolvedValue(makeStats());

    renderPage();

    expect(await screen.findByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getAllByText('1200.00 €').length).toBeGreaterThan(0);
    expect(screen.getByText('60', { selector: 'p' })).toBeInTheDocument();
  });

  it('lists per-category stats', async () => {
    vi.mocked(dashboardService.getEventStats).mockResolvedValue(makeStats());

    renderPage();

    expect(await screen.findByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('60 / 100')).toBeInTheDocument();
    expect(screen.getByText('60.0 %')).toBeInTheDocument();
  });

  it('shows the daily sales table sorted by date, in chronological order', async () => {
    vi.mocked(dashboardService.getEventStats).mockResolvedValue(makeStats());

    renderPage();
    await screen.findByText('Ventes par jour (30 derniers jours)');

    expect(screen.getByText('1 janvier 2026')).toBeInTheDocument();
    expect(screen.getByText('2 janvier 2026')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show the daily sales section when there is no data', async () => {
    vi.mocked(dashboardService.getEventStats).mockResolvedValue(makeStats({ salesByDay: {} }));

    renderPage();
    await screen.findByText('Concert de jazz');

    expect(screen.queryByText('Ventes par jour (30 derniers jours)')).not.toBeInTheDocument();
  });

  it('links to the promo codes page and the event detail page', async () => {
    vi.mocked(dashboardService.getEventStats).mockResolvedValue(makeStats());

    renderPage();

    expect(await screen.findByRole('link', { name: /Codes promo/ })).toHaveAttribute(
      'href',
      '/dashboard/events/e1/promo-codes',
    );
    expect(screen.getByRole('link', { name: "Voir la fiche de l'événement" })).toHaveAttribute(
      'href',
      '/events/e1',
    );
  });

  it('navigates back when the back button is clicked', async () => {
    vi.mocked(dashboardService.getEventStats).mockResolvedValue(makeStats());

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Retour à la page précédente' }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
