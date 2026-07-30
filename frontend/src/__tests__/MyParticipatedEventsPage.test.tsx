import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyParticipatedEventsPage from '../pages/MyParticipatedEventsPage';
import { dashboardService } from '../services/dashboardService';
import type { ParticipatedEvent } from '../types/dashboard.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getMyParticipatedEvents: vi.fn(),
  },
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
      <MyParticipatedEventsPage />
    </MemoryRouter>,
  );
}

describe('MyParticipatedEventsPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(dashboardService.getMyParticipatedEvents).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement de vos événements...')).toBeInTheDocument();
  });

  it('shows an error message and allows retrying', async () => {
    vi.mocked(dashboardService.getMyParticipatedEvents)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([]);

    renderPage();

    expect(
      await screen.findByText('Impossible de charger vos participations'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() =>
      expect(dashboardService.getMyParticipatedEvents).toHaveBeenCalledTimes(2),
    );
  });

  it('shows an empty state and navigates to events', async () => {
    vi.mocked(dashboardService.getMyParticipatedEvents).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucune participation')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Découvrir les événements' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  it('shows the counts and lists events', async () => {
    vi.mocked(dashboardService.getMyParticipatedEvents).mockResolvedValue([
      makeEvent({ id: 'e1', isPast: false }),
      makeEvent({ id: 'e2', title: 'Festival', isPast: true }),
    ]);

    renderPage();

    expect(
      await screen.findByText('2 événements au total · 1 à venir · 1 passé'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tous (2)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'À venir (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Passés (1)' })).toBeInTheDocument();
    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText('Festival')).toBeInTheDocument();
  });

  it('filters events by upcoming/past', async () => {
    vi.mocked(dashboardService.getMyParticipatedEvents).mockResolvedValue([
      makeEvent({ id: 'e1', title: 'Concert de jazz', isPast: false }),
      makeEvent({ id: 'e2', title: 'Festival', isPast: true }),
    ]);

    renderPage();
    await screen.findByText('Concert de jazz');

    fireEvent.click(screen.getByRole('button', { name: 'Passés (1)' }));

    expect(screen.queryByText('Concert de jazz')).not.toBeInTheDocument();
    expect(screen.getByText('Festival')).toBeInTheDocument();
  });

  it('shows a message when no event matches the active filter', async () => {
    vi.mocked(dashboardService.getMyParticipatedEvents).mockResolvedValue([
      makeEvent({ id: 'e1', isPast: false }),
    ]);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Passés (0)' }));

    expect(
      screen.getByText('Aucun événement ne correspond à ce filtre.'),
    ).toBeInTheDocument();
  });
});
