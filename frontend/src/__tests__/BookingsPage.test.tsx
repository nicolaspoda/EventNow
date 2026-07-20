import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BookingsPage from '../pages/BookingsPage';
import { bookingService } from '../services/bookingService';
import type { Booking } from '../types/booking.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/bookingService', () => ({
  bookingService: {
    getUserBookings: vi.fn(),
    confirmBooking: vi.fn(),
    cancelBooking: vi.fn(),
  },
}));

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b1',
    userId: 'u1',
    ticketCategoryId: 'c1',
    quantity: 1,
    status: 'PENDING',
    expiresAt: '2026-01-01T01:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ticketCategory: {
      id: 'c1',
      name: 'Standard',
      price: 20,
      initialStock: 100,
      currentStock: 50,
      event: {
        id: 'e1',
        title: 'Concert de jazz',
        location: 'Paris',
        eventDate: '2026-06-15T20:00:00.000Z',
        organizerId: 'org1',
        ticketCategories: [],
        createdAt: '',
        updatedAt: '',
      },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <BookingsPage />
    </MemoryRouter>,
  );
}

describe('BookingsPage - loading and empty state', () => {
  it('shows a loading state initially', () => {
    vi.mocked(bookingService.getUserBookings).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement de vos réservations...')).toBeInTheDocument();
  });

  it('shows an empty state when there are no bookings', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucune réservation')).toBeInTheDocument();
    expect(screen.getByText("Vous n'avez pas encore réservé de billets.")).toBeInTheDocument();
  });

  it('shows an error message when loading fails', async () => {
    vi.mocked(bookingService.getUserBookings).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText('Erreur lors du chargement des réservations'),
    ).toBeInTheDocument();
  });
});

describe('BookingsPage - listing and filters', () => {
  it('lists bookings and shows the total count', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      makeBooking({ id: 'b1', status: 'PENDING' }),
      makeBooking({ id: 'b2', status: 'CONFIRMED' }),
    ]);

    renderPage();

    expect(await screen.findByText('Toutes (2)')).toBeInTheDocument();
    expect(screen.getByText('En attente (1)')).toBeInTheDocument();
    expect(screen.getByText('Confirmées (1)')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('filters bookings by status', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      makeBooking({ id: 'b1', status: 'PENDING' }),
      makeBooking({ id: 'b2', status: 'CONFIRMED' }),
    ]);

    renderPage();
    await screen.findByText('Toutes (2)');

    fireEvent.click(screen.getByText('Confirmées (1)'));

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows a filtered empty state message', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      makeBooking({ id: 'b1', status: 'PENDING' }),
    ]);

    renderPage();
    await screen.findByText('Toutes (1)');
    fireEvent.click(screen.getByText('Annulées (0)'));

    expect(screen.getByText('Aucune réservation annulée')).toBeInTheDocument();
  });

  it('navigates to /events from the header button and the empty state', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([]);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: '← Retour au catalogue' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');

    fireEvent.click(screen.getByRole('button', { name: 'Découvrir les événements' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });
});

describe('BookingsPage - actions', () => {
  it('confirms a pending booking and refreshes the list', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      makeBooking({ id: 'b1', status: 'PENDING' }),
    ]);
    vi.mocked(bookingService.confirmBooking).mockResolvedValue(makeBooking({ id: 'b1', status: 'CONFIRMED' }));

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Payer maintenant' }));

    await waitFor(() => expect(bookingService.confirmBooking).toHaveBeenCalledWith('b1'));
    await waitFor(() => expect(bookingService.getUserBookings).toHaveBeenCalledTimes(2));
  });

  it('shows an alert when confirming fails', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      makeBooking({ id: 'b1', status: 'PENDING' }),
    ]);
    vi.mocked(bookingService.confirmBooking).mockRejectedValue(new Error('boom'));
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Payer maintenant' }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Erreur lors de la confirmation'),
    );
  });

  it('cancels a booking after confirmation and refreshes the list', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      makeBooking({ id: 'b1', status: 'PENDING' }),
    ]);
    vi.mocked(bookingService.cancelBooking).mockResolvedValue(makeBooking({ id: 'b1', status: 'CANCELLED' }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Annuler' }));

    await waitFor(() => expect(bookingService.cancelBooking).toHaveBeenCalledWith('b1'));
  });

  it('does not cancel when the confirmation dialog is dismissed', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      makeBooking({ id: 'b1', status: 'PENDING' }),
    ]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Annuler' }));

    expect(bookingService.cancelBooking).not.toHaveBeenCalled();
  });
});
