import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import BookingCard from '../components/bookings/BookingCard';
import type { Booking } from '../types/booking.types';

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b1',
    userId: 'u1',
    ticketCategoryId: 'c1',
    quantity: 2,
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
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
    ...overrides,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

function renderCard(props: Partial<React.ComponentProps<typeof BookingCard>> = {}) {
  return render(
    <MemoryRouter>
      <BookingCard booking={makeBooking()} {...props} />
    </MemoryRouter>,
  );
}

describe('BookingCard', () => {
  it('shows the event title as a link, category and total price', () => {
    renderCard();

    expect(screen.getByRole('link', { name: 'Concert de jazz' })).toHaveAttribute(
      'href',
      '/events/e1',
    );
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('40.00 €')).toBeInTheDocument();
  });

  it.each([
    ['PENDING', 'En attente'],
    ['CONFIRMED', 'Confirmée'],
    ['EXPIRED', 'Expirée'],
    ['CANCELLED', 'Annulée'],
  ] as const)('shows the %s status badge', (status, label) => {
    renderCard({ booking: makeBooking({ status }) });

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('shows the expiry notice for a pending booking', () => {
    renderCard({ booking: makeBooking({ status: 'PENDING' }) });

    expect(screen.getByText(/Expire le/)).toBeInTheDocument();
  });

  it('shows confirm/cancel actions for a pending booking when handlers are provided', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderCard({ onConfirm, onCancel });

    fireEvent.click(screen.getByRole('button', { name: 'Payer maintenant' }));
    expect(onConfirm).toHaveBeenCalledWith('b1');

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onCancel).toHaveBeenCalledWith('b1');
  });

  it('does not show actions when handlers are missing', () => {
    renderCard();

    expect(screen.queryByRole('button', { name: 'Payer maintenant' })).not.toBeInTheDocument();
  });

  it('shows a confirmation message for a confirmed booking', () => {
    renderCard({ booking: makeBooking({ status: 'CONFIRMED' }) });

    expect(screen.getByText(/Réservation confirmée/)).toBeInTheDocument();
  });
});
