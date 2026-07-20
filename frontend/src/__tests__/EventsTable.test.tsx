import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventsTable } from '../components/dashboard/EventsTable';
import type { DashboardEvent } from '../types/dashboard.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeEvent(overrides: Partial<DashboardEvent> = {}): DashboardEvent {
  return {
    id: 'e1',
    title: 'Concert de jazz',
    location: 'Paris',
    eventDate: '2026-06-15T20:00:00.000Z',
    organizerId: 'org1',
    type: 'PROFESSIONAL',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ticketCategories: [],
    stats: {
      totalCapacity: 100,
      totalSold: 60,
      totalParticipants: 0,
      revenue: 1200,
      fillRate: 60,
      status: 'PUBLISHED',
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderTable(props: Partial<React.ComponentProps<typeof EventsTable>> = {}) {
  return render(
    <MemoryRouter>
      <EventsTable events={[]} onRefresh={vi.fn()} {...props} />
    </MemoryRouter>,
  );
}

describe('EventsTable - empty state', () => {
  it('shows an empty state message and create-event button', () => {
    renderTable();

    expect(screen.getByText('Aucun événement créé')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon premier événement' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events/create');
  });
});

describe('EventsTable - professional events', () => {
  it('shows a revenue column and the sold/capacity ratio', () => {
    renderTable({ events: [makeEvent()] });

    expect(screen.getByRole('columnheader', { name: 'Revenus' })).toBeInTheDocument();
    expect(screen.getByText('1200.00 €')).toBeInTheDocument();
    expect(screen.getByText('60 / 100')).toBeInTheDocument();
  });

  it('shows the fill rate percentage and progress bar', () => {
    renderTable({ events: [makeEvent({ stats: { totalCapacity: 100, totalSold: 60, fillRate: 60, status: 'PUBLISHED' } })] });

    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  });

  it('navigates to the event detail page when the row is clicked', () => {
    renderTable({ events: [makeEvent()] });

    fireEvent.click(screen.getByText('Concert de jazz'));

    expect(mockNavigate).toHaveBeenCalledWith('/events/e1');
  });

  it('does not navigate when the actions cell is clicked', () => {
    renderTable({ events: [makeEvent()] });

    fireEvent.click(screen.getByRole('button', { name: "Voir les statistiques de l'événement" }));

    expect(mockNavigate).not.toHaveBeenCalledWith('/events/e1');
  });
});

describe('EventsTable - community events', () => {
  it('hides the revenue column and shows participants instead of sold tickets', () => {
    renderTable({
      type: 'community',
      events: [
        makeEvent({
          type: 'COMMUNITY',
          stats: { totalCapacity: 50, totalParticipants: 20, fillRate: 40, status: 'PUBLISHED' },
        }),
      ],
    });

    expect(screen.queryByRole('columnheader', { name: 'Revenus' })).not.toBeInTheDocument();
    expect(screen.getByText('20 / 50')).toBeInTheDocument();
  });
});
