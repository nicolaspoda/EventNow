import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventParticipantsPage } from '../pages/EventParticipantsPage';
import { dashboardService } from '../services/dashboardService';
import type { EventParticipantsResponse } from '../types/dashboard.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getEventParticipants: vi.fn(),
  },
}));

function makeData(overrides: Partial<EventParticipantsResponse> = {}): EventParticipantsResponse {
  return {
    event: { id: 'e1', title: 'Concert de jazz', eventDate: '2026-06-15T20:00:00.000Z' },
    participants: [
      {
        userId: 'u1',
        email: 'bob@example.com',
        username: 'bob',
        quantity: 2,
        status: 'CONFIRMED',
        bookedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    totalParticipants: 2,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/events/e1/participants']}>
      <Routes>
        <Route path="/dashboard/events/:id/participants" element={<EventParticipantsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventParticipantsPage - loading and errors', () => {
  it('shows a loading state initially', () => {
    vi.mocked(dashboardService.getEventParticipants).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status', { name: 'Chargement' })).toBeInTheDocument();
  });

  it('shows the backend error message on failure', async () => {
    vi.mocked(dashboardService.getEventParticipants).mockRejectedValue({
      response: { data: { message: 'Accès refusé' } },
    });

    renderPage();

    expect(await screen.findByText('Accès refusé')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour au tableau de bord' })).toHaveAttribute(
      'href',
      '/dashboard/user',
    );
  });

  it('falls back to a default error message', async () => {
    vi.mocked(dashboardService.getEventParticipants).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText('Erreur lors du chargement des participants'),
    ).toBeInTheDocument();
  });
});

describe('EventParticipantsPage - content', () => {
  it('shows the event title, date and participant count', async () => {
    vi.mocked(dashboardService.getEventParticipants).mockResolvedValue(makeData());

    renderPage();

    expect(await screen.findByText('Participants – Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText(/participants inscrits/)).toBeInTheDocument();
    expect(screen.getByText('2', { selector: 'strong' })).toBeInTheDocument();
  });

  it('lists participants with a link to their profile', async () => {
    vi.mocked(dashboardService.getEventParticipants).mockResolvedValue(makeData());

    renderPage();

    expect(await screen.findByRole('link', { name: 'bob' })).toHaveAttribute(
      'href',
      '/user/u1/profile',
    );
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('Confirmé')).toBeInTheDocument();
  });

  it('falls back to the email prefix when there is no username', async () => {
    vi.mocked(dashboardService.getEventParticipants).mockResolvedValue(
      makeData({
        participants: [
          {
            userId: 'u2',
            email: 'carol@example.com',
            username: null,
            quantity: 1,
            status: 'PENDING',
            bookedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    );

    renderPage();

    expect(await screen.findByRole('link', { name: 'carol' })).toBeInTheDocument();
    expect(screen.getByText('En attente')).toBeInTheDocument();
  });

  it('shows an empty state when there are no participants', async () => {
    vi.mocked(dashboardService.getEventParticipants).mockResolvedValue(
      makeData({ participants: [], totalParticipants: 0 }),
    );

    renderPage();

    expect(
      await screen.findByText('Aucun participant inscrit pour le moment.'),
    ).toBeInTheDocument();
  });

  it('navigates back when the back button is clicked', async () => {
    vi.mocked(dashboardService.getEventParticipants).mockResolvedValue(makeData());

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Retour à la page précédente' }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('links to the event detail page', async () => {
    vi.mocked(dashboardService.getEventParticipants).mockResolvedValue(makeData());

    renderPage();

    expect(
      await screen.findByRole('link', { name: "Voir la fiche de l'événement" }),
    ).toHaveAttribute('href', '/events/e1');
  });
});
