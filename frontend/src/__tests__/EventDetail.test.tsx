import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import EventDetail from '../components/events/EventDetail';
import type { Event } from '../types/event.types';
import type { ParticipationRequest } from '../types/participation.types';

vi.mock('../components/bookings/BookingModal', () => ({
  default: ({ category, onConfirm, onClose }: { category: { id: string }; onConfirm: (q: number) => void; onClose: () => void }) => (
    <div data-testid="booking-modal">
      <span>Catégorie {category.id}</span>
      <button onClick={() => onConfirm(2)}>Confirmer réservation</button>
      <button onClick={onClose}>Fermer réservation</button>
    </div>
  ),
}));

vi.mock('../components/participation/ParticipationRequestModal', () => ({
  ParticipationRequestModal: ({ isOpen, onSuccess, onClose }: { isOpen: boolean; onSuccess: () => void; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="participation-modal">
        <button onClick={onSuccess}>Confirmer participation</button>
        <button onClick={onClose}>Fermer participation</button>
      </div>
    ) : null,
}));

const baseEvent: Event = {
  id: 'e1',
  title: 'Concert de jazz',
  description: 'Une super soirée',
  location: 'Paris',
  eventDate: '2026-06-15T20:00:00.000Z',
  organizerId: 'org1',
  type: 'PROFESSIONAL',
  ticketCategories: [
    { id: 'c1', name: 'Standard', description: 'Place standard', price: 20, initialStock: 100, currentStock: 50 },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderDetail(props: Partial<React.ComponentProps<typeof EventDetail>> = {}) {
  return render(
    <MemoryRouter>
      <EventDetail event={baseEvent} {...props} />
    </MemoryRouter>,
  );
}

describe('EventDetail - general content', () => {
  it('renders the title, location and description', () => {
    renderDetail();

    expect(screen.getByRole('heading', { name: 'Concert de jazz' })).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Une super soirée')).toBeInTheDocument();
  });

  it('renders no image when imageUrl is absent', () => {
    renderDetail();

    expect(screen.queryByAltText('Image de Concert de jazz')).not.toBeInTheDocument();
  });

  it('renders the event image when imageUrl is present', () => {
    renderDetail({ event: { ...baseEvent, imageUrl: 'https://cdn.example.com/img.jpg' } });

    expect(screen.getByAltText('Image de Concert de jazz')).toBeInTheDocument();
  });

  it('renders the organizer info and links to their profile', () => {
    renderDetail({ event: { ...baseEvent, organizer: { id: 'org1', email: 'orga@example.com', username: 'orga' } } });

    expect(screen.getByText('orga')).toBeInTheDocument();
    expect(screen.getByText('orga@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /orga/ })).toHaveAttribute('href', '/user/org1/profile');
  });

  it('shows a cancelled banner with the reason and refund note for a ticketed event', () => {
    renderDetail({ event: { ...baseEvent, cancelledAt: '2026-01-05T00:00:00.000Z', cancelReason: 'Intempéries' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Cet événement a été annulé.');
    expect(screen.getByText('Intempéries')).toBeInTheDocument();
    expect(screen.getByText(/vous serez remboursé/)).toBeInTheDocument();
  });
});

describe('EventDetail - ticketed events', () => {
  it('shows a stock indicator per category', () => {
    renderDetail({
      event: {
        ...baseEvent,
        ticketCategories: [
          { id: 'c1', name: 'Épuisée', price: 10, initialStock: 10, currentStock: 0 },
          { id: 'c2', name: 'Presque pleine', price: 10, initialStock: 100, currentStock: 5 },
          { id: 'c3', name: 'Disponible', price: 10, initialStock: 100, currentStock: 80 },
        ],
      },
    });

    expect(screen.getAllByText('Épuisé').length).toBeGreaterThan(0);
    expect(screen.getByText('Plus que 5 places')).toBeInTheDocument();
    expect(screen.getByText('80 places disponibles')).toBeInTheDocument();
  });

  it('opens the booking modal for an authenticated user and confirms a booking', async () => {
    const onBooking = vi.fn().mockResolvedValue(undefined);
    renderDetail({ isAuthenticated: true, onBooking });

    fireEvent.click(screen.getByRole('button', { name: 'Réserver' }));
    expect(screen.getByTestId('booking-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirmer réservation'));

    expect(onBooking).toHaveBeenCalledWith('c1', 2);
  });

  it('calls onLoginRequired instead of opening the booking modal for a guest', () => {
    const onLoginRequired = vi.fn();
    renderDetail({ isAuthenticated: false, onLoginRequired });

    fireEvent.click(screen.getByRole('button', { name: 'Réserver' }));

    expect(onLoginRequired).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('booking-modal')).not.toBeInTheDocument();
  });

  it('shows a dash instead of a reserve button for the organizer', () => {
    renderDetail({ isOrganizer: true });

    expect(screen.queryByRole('button', { name: 'Réserver' })).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('disables the button and shows "Épuisé" when a category has no stock', () => {
    renderDetail({
      event: { ...baseEvent, ticketCategories: [{ id: 'c1', name: 'Standard', price: 10, initialStock: 10, currentStock: 0 }] },
    });

    expect(screen.getByRole('button', { name: 'Épuisé' })).toBeDisabled();
  });

  it('shows the sold-out message when every category is empty', () => {
    renderDetail({
      event: { ...baseEvent, ticketCategories: [{ id: 'c1', name: 'Standard', price: 10, initialStock: 10, currentStock: 0 }] },
    });

    expect(screen.getByText('Toutes les places pour cet événement sont épuisées')).toBeInTheDocument();
  });

  it('shows "Annulé" and hides the action column when the event is cancelled', () => {
    renderDetail({ event: { ...baseEvent, cancelledAt: '2026-01-05T00:00:00.000Z' } });

    expect(screen.getByText('Annulé')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réserver' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Action' })).not.toBeInTheDocument();
  });
});

describe('EventDetail - community events', () => {
  const communityEvent: Event = {
    ...baseEvent,
    type: 'COMMUNITY',
    ticketCategories: [
      { id: 'c1', name: 'Participation', price: 0, initialStock: 20, currentStock: 5 },
    ],
  };

  it('shows the available-places badge and a request button for a guest', () => {
    renderDetail({ event: communityEvent, isAuthenticated: false });

    expect(screen.getByText('5 places disponibles')).toBeInTheDocument();
    expect(screen.getByText('Se connecter pour demander à participer')).toBeInTheDocument();
  });

  it('requires login before opening the participation modal for a guest', () => {
    const onLoginRequired = vi.fn();
    renderDetail({ event: communityEvent, isAuthenticated: false, onLoginRequired });

    fireEvent.click(screen.getByText('Se connecter pour demander à participer'));

    expect(onLoginRequired).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('participation-modal')).not.toBeInTheDocument();
  });

  it('opens the participation modal for an authenticated user and reports success', () => {
    const onParticipationRequestSuccess = vi.fn();
    renderDetail({ event: communityEvent, isAuthenticated: true, onParticipationRequestSuccess });

    fireEvent.click(screen.getByText('Demander à participer'));
    expect(screen.getByTestId('participation-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirmer participation'));

    expect(onParticipationRequestSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows "Complet" and disables the request button when there are no places left', () => {
    renderDetail({
      event: { ...communityEvent, ticketCategories: [{ id: 'c1', name: 'Participation', price: 0, initialStock: 20, currentStock: 0 }] },
      isAuthenticated: true,
    });

    expect(screen.getByText('Complet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Demander à participer' })).toBeDisabled();
  });

  it.each([
    ['PENDING', 'Demande en attente'],
    ['ACCEPTED', 'Votre demande a été acceptée'],
    ['REFUSED', 'Votre demande a été refusée'],
  ] as const)('shows the status message for a %s participation request instead of the button', (status, message) => {
    const request = { status } as unknown as ParticipationRequest;
    renderDetail({ event: communityEvent, isAuthenticated: true, myParticipationRequest: request });

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Demander à participer' })).not.toBeInTheDocument();
  });

  it('hides the request button and existing-request status for the organizer', () => {
    renderDetail({ event: communityEvent, isOrganizer: true, isAuthenticated: true });

    expect(screen.queryByRole('button', { name: 'Demander à participer' })).not.toBeInTheDocument();
  });

  it('does not show the participation badge when the event is cancelled', () => {
    renderDetail({ event: { ...communityEvent, cancelledAt: '2026-01-05T00:00:00.000Z' } });

    expect(screen.queryByText('5 places disponibles')).not.toBeInTheDocument();
    expect(screen.queryByText('Demander à participer')).not.toBeInTheDocument();
  });
});
