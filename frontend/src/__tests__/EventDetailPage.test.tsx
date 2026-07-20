import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventDetailPage from '../pages/EventDetailPage';
import { eventService } from '../services/eventService';
import { bookingService } from '../services/bookingService';
import { participationService } from '../services/participationService';
import { reviewService } from '../services/reviewService';
import messageService from '../services/messageService';
import { useAuth } from '../utils/useAuth';
import type { Event } from '../types/event.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/eventService', () => ({
  eventService: {
    getEventById: vi.fn(),
    cancelEvent: vi.fn(),
  },
}));

vi.mock('../services/bookingService', () => ({
  bookingService: {
    createBooking: vi.fn(),
  },
}));

vi.mock('../services/participationService', () => ({
  participationService: {
    getMyRequestForEvent: vi.fn(),
  },
}));

vi.mock('../services/reviewService', () => ({
  reviewService: {
    canUserReview: vi.fn(),
  },
}));

vi.mock('../services/messageService', () => ({
  default: {
    getEventConversation: vi.fn(),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/events/EventDetail', () => ({
  default: ({
    event,
    onBooking,
    onParticipationRequestSuccess,
    onLoginRequired,
  }: {
    event: { id: string; title: string };
    onBooking?: (categoryId: string, quantity: number) => void;
    onParticipationRequestSuccess?: () => void;
    onLoginRequired?: () => void;
  }) => (
    <div data-testid="event-detail">
      <span>{event.title}</span>
      {onBooking && (
        <button type="button" onClick={() => onBooking('cat1', 2)}>
          Réserver
        </button>
      )}
      {onParticipationRequestSuccess && (
        <button type="button" onClick={() => onParticipationRequestSuccess()}>
          Demander à participer
        </button>
      )}
      {onLoginRequired && (
        <button type="button" onClick={() => onLoginRequired()}>
          Connexion requise
        </button>
      )}
    </div>
  ),
}));

vi.mock('../components/events/EventParticipantReviewsSection', () => ({
  EventParticipantReviewsSection: () => <div data-testid="participants-section" />,
}));

vi.mock('../components/reviews/ReviewForm', () => ({
  ReviewForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="review-form">
      <button type="button" onClick={() => onSuccess()}>
        Envoyer l&apos;avis
      </button>
    </div>
  ),
}));

vi.mock('../components/reviews/ReviewsList', () => ({
  ReviewsList: () => <div data-testid="reviews-list" />,
}));

vi.mock('../components/ReportModal', () => ({
  default: ({
    isOpen,
    onSuccess,
    onAlreadyReported,
  }: {
    isOpen: boolean;
    onSuccess: (msg: string) => void;
    onAlreadyReported: () => void;
  }) =>
    isOpen ? (
      <div data-testid="report-modal">
        <button type="button" onClick={() => onSuccess('Signalement envoyé.')}>
          Confirmer signalement
        </button>
        <button type="button" onClick={onAlreadyReported}>
          Déjà signalé
        </button>
      </div>
    ) : null,
}));

vi.mock('../components/events/EventItemListTab', () => ({
  default: () => <div data-testid="items-tab" />,
}));

vi.mock('../components/events/EventPollsTab', () => ({
  default: () => <div data-testid="polls-tab" />,
}));

vi.mock('../components/events/ShareButton', () => ({
  default: () => <button type="button">Partager</button>,
}));

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'e1',
    title: 'Concert de jazz',
    location: 'Paris',
    eventDate: '2099-06-01T20:00:00.000Z',
    organizerId: 'organizer-1',
    type: 'PROFESSIONAL',
    ticketCategories: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function mockAuthUser(id: string | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: id ? { id, username: 'me', email: 'me@example.com', role: 'USER' } : null,
    isAuthenticated: !!id,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(participationService.getMyRequestForEvent).mockResolvedValue(null);
  vi.mocked(reviewService.canUserReview).mockResolvedValue({ canReview: false });
});

function renderPage(eventId = 'e1') {
  return render(
    <MemoryRouter initialEntries={[`/events/${eventId}`]}>
      <Routes>
        <Route path="/events/:id" element={<EventDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventDetailPage - loading and errors', () => {
  it('shows a loading state initially', () => {
    mockAuthUser(null);
    vi.mocked(eventService.getEventById).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows the backend error message on failure', async () => {
    mockAuthUser(null);
    vi.mocked(eventService.getEventById).mockRejectedValue({
      response: { data: { message: 'Événement supprimé' } },
    });

    renderPage();

    expect(await screen.findByText('Événement supprimé')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Événement introuvable' })).toBeInTheDocument();
  });

  it('shows a generic not-found message on a plain error', async () => {
    mockAuthUser(null);
    vi.mocked(eventService.getEventById).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText("L'événement que vous recherchez n'existe pas ou a été supprimé."),
    ).toBeInTheDocument();
  });

  it('navigates back to /events from the error state', async () => {
    mockAuthUser(null);
    vi.mocked(eventService.getEventById).mockRejectedValue(new Error('boom'));

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Retour aux événements' }));

    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });
});

describe('EventDetailPage - content', () => {
  it('renders the event title and the details tab by default', async () => {
    mockAuthUser(null);
    vi.mocked(eventService.getEventById).mockResolvedValue(makeEvent());

    renderPage();

    expect(await screen.findByTestId('event-detail')).toBeInTheDocument();
    expect(screen.getAllByText('Concert de jazz').length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: 'Détails' })).toHaveAttribute('aria-selected', 'true');
  });

  it('books a ticket for a professional event', async () => {
    mockAuthUser('user-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(makeEvent());
    vi.mocked(bookingService.createBooking).mockResolvedValue({ id: 'booking-1' } as never);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Réserver' }));

    await waitFor(() =>
      expect(bookingService.createBooking).toHaveBeenCalledWith({
        ticketCategoryId: 'cat1',
        quantity: 2,
      }),
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/checkout?bookingId=booking-1'),
    );
  });

  it('redirects to login when booking while unauthenticated', async () => {
    mockAuthUser(null);
    vi.mocked(eventService.getEventById).mockResolvedValue(makeEvent());

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Réserver' }));

    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: '/events/e1' } });
    expect(bookingService.createBooking).not.toHaveBeenCalled();
  });

  it('shows an alert with the backend error message when booking fails', async () => {
    mockAuthUser('user-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(makeEvent());
    vi.mocked(bookingService.createBooking).mockRejectedValue({
      response: { status: 409, data: { message: 'Plus de places disponibles' } },
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Réserver' }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Plus de places disponibles'),
    );
  });

  it('redirects to login with a session-expired message on a 401 booking error', async () => {
    mockAuthUser('user-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(makeEvent());
    vi.mocked(bookingService.createBooking).mockRejectedValue({
      response: { status: 401 },
    });

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Réserver' }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { from: '/events/e1', message: 'Session expirée, veuillez vous reconnecter.' },
      }),
    );
  });

  it('shows the participants and messaging tabs for the organizer of a community event with an accepted request', async () => {
    mockAuthUser('organizer-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(
      makeEvent({ type: 'COMMUNITY', organizerId: 'organizer-1' }),
    );

    renderPage();

    expect(await screen.findByRole('tab', { name: 'Participants' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Accéder à la messagerie de groupe' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Participants' }));
    expect(await screen.findByTestId('participants-section')).toBeInTheDocument();
  });

  it('shows the items/polls tabs for an accepted community participant', async () => {
    mockAuthUser('member-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(
      makeEvent({ type: 'COMMUNITY', organizerId: 'organizer-1' }),
    );
    vi.mocked(participationService.getMyRequestForEvent).mockResolvedValue({
      id: 'req1',
      eventId: 'e1',
      userId: 'member-1',
      status: 'ACCEPTED',
      createdAt: '',
      updatedAt: '',
    });

    renderPage();

    expect(await screen.findByRole('tab', { name: 'Liste de courses' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sondages' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Liste de courses' }));
    expect(await screen.findByTestId('items-tab')).toBeInTheDocument();
  });

  it('opens the group conversation from the details tab', async () => {
    mockAuthUser('organizer-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(
      makeEvent({ type: 'COMMUNITY', organizerId: 'organizer-1' }),
    );
    vi.mocked(messageService.getEventConversation).mockResolvedValue({ id: 'conv1' } as never);

    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Accéder à la messagerie de groupe' }),
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/messages/conv1'));
  });

  it('shows the review form when the user can review and lets them submit', async () => {
    mockAuthUser('user-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(makeEvent());
    vi.mocked(reviewService.canUserReview).mockResolvedValue({ canReview: true });

    renderPage();
    fireEvent.click(await screen.findByRole('tab', { name: 'Avis' }));

    expect(await screen.findByTestId('review-form')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "Envoyer l'avis" }));

    await waitFor(() => expect(screen.queryByTestId('review-form')).not.toBeInTheDocument());
    expect(screen.getByTestId('reviews-list')).toBeInTheDocument();
  });

  it('shows the cancel button for the organizer of a future non-cancelled event, and cancels it', async () => {
    mockAuthUser('organizer-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(
      makeEvent({ organizerId: 'organizer-1' }),
    );
    vi.mocked(eventService.cancelEvent).mockResolvedValue(undefined as never);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Annuler l'événement" }));

    fireEvent.change(screen.getByLabelText("Raison de l'annulation (optionnel)"), {
      target: { value: 'Intempéries' },
    });
    fireEvent.click(screen.getByRole('button', { name: "Confirmer l'annulation" }));

    await waitFor(() =>
      expect(eventService.cancelEvent).toHaveBeenCalledWith('e1', 'Intempéries'),
    );
    expect(
      await screen.findByText('Événement annulé. Les remboursements ont été initiés.'),
    ).toBeInTheDocument();
  });

  it('shows an error in the cancel modal when cancellation fails', async () => {
    mockAuthUser('organizer-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(
      makeEvent({ organizerId: 'organizer-1' }),
    );
    vi.mocked(eventService.cancelEvent).mockRejectedValue({
      response: { data: { message: 'Trop tard pour annuler' } },
    });

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Annuler l'événement" }));
    fireEvent.click(screen.getByRole('button', { name: "Confirmer l'annulation" }));

    expect(await screen.findByText('Trop tard pour annuler')).toBeInTheDocument();
  });

  it('closes the cancel modal without cancelling', async () => {
    mockAuthUser('organizer-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(
      makeEvent({ organizerId: 'organizer-1' }),
    );

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Annuler l'événement" }));
    fireEvent.click(screen.getByRole('button', { name: 'Retour' }));

    expect(screen.queryByText("Raison de l'annulation (optionnel)")).not.toBeInTheDocument();
    expect(eventService.cancelEvent).not.toHaveBeenCalled();
  });

  it('does not show the cancel button for a non-organizer', async () => {
    mockAuthUser('someone-else');
    vi.mocked(eventService.getEventById).mockResolvedValue(
      makeEvent({ organizerId: 'organizer-1' }),
    );

    renderPage();

    await screen.findByTestId('event-detail');
    expect(screen.queryByRole('button', { name: "Annuler l'événement" })).not.toBeInTheDocument();
  });

  it('reports the event and persists the reported state in localStorage', async () => {
    mockAuthUser('user-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(
      makeEvent({ organizerId: 'organizer-1' }),
    );

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Signaler' }));
    fireEvent.click(screen.getByText('Confirmer signalement'));

    expect(await screen.findByText('Signalement envoyé.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Signalé' })).toBeInTheDocument();
    expect(localStorage.getItem('reported:event:e1')).toBe('true');
  });

  it('does not show the report button for the event organizer', async () => {
    mockAuthUser('organizer-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(
      makeEvent({ organizerId: 'organizer-1' }),
    );

    renderPage();

    await screen.findByTestId('event-detail');
    expect(screen.queryByRole('button', { name: 'Signaler' })).not.toBeInTheDocument();
  });

  it('refreshes the participation request after a successful participation request', async () => {
    mockAuthUser('user-1');
    vi.mocked(eventService.getEventById).mockResolvedValue(
      makeEvent({ type: 'COMMUNITY', organizerId: 'organizer-1' }),
    );
    vi.mocked(participationService.getMyRequestForEvent).mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'req1',
      eventId: 'e1',
      userId: 'user-1',
      status: 'PENDING',
      createdAt: '',
      updatedAt: '',
    });

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Demander à participer' }));

    await waitFor(() =>
      expect(participationService.getMyRequestForEvent).toHaveBeenCalledTimes(2),
    );
  });
});
