import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventParticipantReviewsPage from '../pages/EventParticipantReviewsPage';
import { eventService } from '../services/eventService';
import { participantReviewService } from '../services/participantReviewService';
import { useAuth } from '../utils/useAuth';
import type { ParticipantForReview } from '../services/participantReviewService';
import type { Event } from '../types/event.types';

vi.mock('../services/eventService', () => ({
  eventService: {
    getEventById: vi.fn(),
  },
}));

vi.mock('../services/participantReviewService', async () => {
  const actual = await vi.importActual<typeof import('../services/participantReviewService')>(
    '../services/participantReviewService',
  );
  return {
    ...actual,
    participantReviewService: {
      getParticipantsForEvent: vi.fn(),
      createReview: vi.fn(),
    },
  };
});

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

const pastEvent: Event = {
  id: 'e1',
  title: 'Concert de jazz',
  location: 'Paris',
  eventDate: '2020-01-01T00:00:00.000Z',
  organizerId: 'org1',
  ticketCategories: [],
  createdAt: '',
  updatedAt: '',
};

function makeParticipant(overrides: Partial<ParticipantForReview> = {}): ParticipantForReview {
  return {
    id: 'p1',
    email: 'bob@example.com',
    username: 'bob',
    hasReview: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'me', username: 'me', email: 'me@example.com', role: 'ORGANIZER' },
    isAuthenticated: true,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/events/e1/participant-reviews']}>
      <Routes>
        <Route
          path="/dashboard/events/:eventId/participant-reviews"
          element={<EventParticipantReviewsPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventParticipantReviewsPage - loading and errors', () => {
  it('shows a loading state initially', () => {
    vi.mocked(eventService.getEventById).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('shows an error state when the event cannot be loaded', async () => {
    vi.mocked(eventService.getEventById).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText('Erreur lors du chargement des participants'),
    ).toBeInTheDocument();
  });
});

describe('EventParticipantReviewsPage - before the event date', () => {
  it('shows a message instead of participants when the event has not happened yet', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue({
      ...pastEvent,
      eventDate: '2999-01-01T00:00:00.000Z',
    });

    renderPage();

    expect(
      await screen.findByText(/seront disponibles après la date de l'événement/),
    ).toBeInTheDocument();
    expect(participantReviewService.getParticipantsForEvent).not.toHaveBeenCalled();
  });
});

describe('EventParticipantReviewsPage - after the event date', () => {
  it('shows an empty state when there are no participants', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(pastEvent);
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText('Aucun participant à évaluer pour le moment'),
    ).toBeInTheDocument();
  });

  it('lists participants and lets the organizer open the review form', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(pastEvent);
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([
      makeParticipant(),
    ]);

    renderPage();
    expect(await screen.findByText('bob')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Laisser un avis' }));

    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Soumettre l'avis" })).toBeInTheDocument();
  });

  it('shows an existing review instead of the "leave a review" button', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(pastEvent);
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([
      makeParticipant({
        hasReview: true,
        review: { id: 'r1', rating: 4, comment: 'Sympa' } as never,
      }),
    ]);

    renderPage();

    expect(await screen.findByText('Avis déjà laissé')).toBeInTheDocument();
    expect(screen.getByText('Sympa')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Laisser un avis' })).not.toBeInTheDocument();
  });

  it('submits a review and refreshes the participant list', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(pastEvent);
    vi.mocked(participantReviewService.getParticipantsForEvent)
      .mockResolvedValueOnce([makeParticipant()])
      .mockResolvedValueOnce([makeParticipant({ hasReview: true, review: { id: 'r1', rating: 4 } as never })]);
    vi.mocked(participantReviewService.createReview).mockResolvedValue({} as never);

    renderPage();
    await screen.findByText('bob');
    fireEvent.click(screen.getByRole('button', { name: 'Laisser un avis' }));
    fireEvent.change(screen.getByPlaceholderText("Partagez votre expérience avec ce participant..."), {
      target: { value: 'Très sympa' },
    });
    fireEvent.click(screen.getByRole('button', { name: "Soumettre l'avis" }));

    await waitFor(() =>
      expect(participantReviewService.createReview).toHaveBeenCalledWith({
        eventId: 'e1',
        participantId: 'p1',
        rating: 5,
        comment: 'Très sympa',
      }),
    );
    await waitFor(() => expect(participantReviewService.getParticipantsForEvent).toHaveBeenCalledTimes(2));
  });

  it('shows an alert when submitting a review fails', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(pastEvent);
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([
      makeParticipant(),
    ]);
    vi.mocked(participantReviewService.createReview).mockRejectedValue(new Error('boom'));
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderPage();
    await screen.findByText('bob');
    fireEvent.click(screen.getByRole('button', { name: 'Laisser un avis' }));
    fireEvent.click(screen.getByRole('button', { name: "Soumettre l'avis" }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Erreur lors de la soumission de l'avis"),
    );
  });

  it('cancels the review form without submitting', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(pastEvent);
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([
      makeParticipant(),
    ]);

    renderPage();
    await screen.findByText('bob');
    fireEvent.click(screen.getByRole('button', { name: 'Laisser un avis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(participantReviewService.createReview).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Laisser un avis' })).toBeInTheDocument();
  });
});
