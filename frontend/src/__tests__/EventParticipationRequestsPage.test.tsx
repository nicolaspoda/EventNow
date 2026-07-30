import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventParticipationRequestsPage from '../pages/EventParticipationRequestsPage';
import { participationService } from '../services/participationService';
import { socketService } from '../services/socketService';
import type { ParticipationRequest } from '../types/participation.types';

vi.mock('../services/participationService', () => ({
  participationService: {
    getByEvent: vi.fn(),
  },
}));

vi.mock('../services/socketService', () => ({
  socketService: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('../components/participation/ParticipationRequestCard', () => ({
  ParticipationRequestCard: ({ request }: { request: ParticipationRequest }) => (
    <div data-testid="participation-request-card">{request.user?.username} - {request.status}</div>
  ),
}));

function makeRequest(overrides: Partial<ParticipationRequest> = {}): ParticipationRequest {
  return {
    id: 'r1',
    eventId: 'e1',
    userId: 'u1',
    status: 'PENDING',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    user: { id: 'u1', email: 'alice@example.com', username: 'alice' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/events/e1/participation-requests']}>
      <Routes>
        <Route
          path="/events/:eventId/participation-requests"
          element={<EventParticipationRequestsPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventParticipationRequestsPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(participationService.getByEvent).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an error message on failure', async () => {
    vi.mocked(participationService.getByEvent).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText('Erreur lors du chargement des demandes'),
    ).toBeInTheDocument();
  });

  it('shows an empty state when there are no requests', async () => {
    vi.mocked(participationService.getByEvent).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucune demande')).toBeInTheDocument();
  });

  it('shows the stats and lists requests', async () => {
    vi.mocked(participationService.getByEvent).mockResolvedValue([
      makeRequest({ id: 'r1', status: 'PENDING' }),
      makeRequest({ id: 'r2', status: 'ACCEPTED' }),
      makeRequest({ id: 'r3', status: 'REFUSED' }),
    ]);

    renderPage();

    expect(await screen.findByRole('button', { name: 'Toutes (3)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'En attente (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acceptées (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refusées (1)' })).toBeInTheDocument();
    expect(screen.getAllByTestId('participation-request-card')).toHaveLength(3);
  });

  it('filters requests by status', async () => {
    vi.mocked(participationService.getByEvent).mockResolvedValue([
      makeRequest({ id: 'r1', status: 'PENDING' }),
      makeRequest({ id: 'r2', status: 'ACCEPTED' }),
    ]);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Acceptées (1)' }));

    const cards = screen.getAllByTestId('participation-request-card');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent('ACCEPTED');
  });

  it('refreshes requests when a newNotification socket event fires', async () => {
    vi.mocked(participationService.getByEvent).mockResolvedValue([]);

    renderPage();
    await screen.findByText('Aucune demande');

    const handler = vi
      .mocked(socketService.on)
      .mock.calls.find(([event]) => event === 'newNotification')?.[1] as () => void;
    expect(handler).toBeInstanceOf(Function);

    handler();

    await waitFor(() => expect(participationService.getByEvent).toHaveBeenCalledTimes(2));
  });
});
