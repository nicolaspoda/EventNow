import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import EventCard from '../components/events/EventCard';
import type { Event } from '../types/event.types';

const baseEvent: Event = {
  id: '123',
  title: 'Concert Test',
  description: 'Description test',
  location: 'Paris',
  eventDate: '2099-12-31T20:00:00Z',
  imageUrl: undefined,
  organizerId: 'org-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ticketCategories: [
    { id: '1', name: 'Standard', price: '25.00', initialStock: 100, currentStock: 50 },
  ],
};

function renderCard(event: Event, currentUserId?: string) {
  return render(
    <BrowserRouter>
      <EventCard event={event} currentUserId={currentUserId} />
    </BrowserRouter>,
  );
}

describe('EventCard', () => {
  it('shows "Gratuit" when the minimum price is 0', () => {
    renderCard({
      ...baseEvent,
      ticketCategories: [
        { id: '1', name: 'Free', price: '0', initialStock: 10, currentStock: 10 },
      ],
    });
    expect(screen.getByText('Gratuit')).toBeInTheDocument();
  });

  it('shows the formatted price when it is not free', () => {
    renderCard(baseEvent);
    expect(screen.getByText('25.00 €')).toBeInTheDocument();
  });

  it('hides the price for a COMMUNITY event', () => {
    renderCard({ ...baseEvent, type: 'COMMUNITY' });
    expect(screen.queryByText('25.00 €')).not.toBeInTheDocument();
    expect(screen.queryByText('Gratuit')).not.toBeInTheDocument();
  });

  it('shows the cancelled state with the cancellation reason', () => {
    renderCard({
      ...baseEvent,
      cancelledAt: '2026-01-05T00:00:00Z',
      cancelReason: 'Intempéries',
    });
    expect(screen.getByText('ANNULÉ')).toBeInTheDocument();
    expect(screen.getByText(/a été annulé/)).toBeInTheDocument();
    expect(screen.getByText('Intempéries')).toBeInTheDocument();
  });

  it('shows a "Terminé" badge for a past event', () => {
    renderCard({ ...baseEvent, eventDate: '2020-01-01T00:00:00Z' });
    expect(screen.getByText('Terminé')).toBeInTheDocument();
  });

  it('shows "Complet" when there is no remaining stock', () => {
    renderCard({
      ...baseEvent,
      ticketCategories: [
        { id: '1', name: 'Standard', price: '10', initialStock: 10, currentStock: 0 },
      ],
    });
    expect(screen.getByText('Complet')).toBeInTheDocument();
  });

  it('shows the remaining places when stock is low', () => {
    renderCard({
      ...baseEvent,
      ticketCategories: [
        { id: '1', name: 'Standard', price: '10', initialStock: 10, currentStock: 10 },
      ],
    });
    expect(screen.getByText('10 places')).toBeInTheDocument();
  });

  it('shows the "Mon événement" badge when the current user is the organizer', () => {
    renderCard(baseEvent, 'org-1');
    expect(screen.getByText('Mon événement')).toBeInTheDocument();
  });

  it('does not show the "Mon événement" badge for another user', () => {
    renderCard(baseEvent, 'someone-else');
    expect(screen.queryByText('Mon événement')).not.toBeInTheDocument();
  });

  it('shows the singular wording for a single attending friend', () => {
    renderCard({
      ...baseEvent,
      friendsAttendingCount: 1,
      friendsAttending: [{ id: 'f1', username: 'Alice' }],
    });
    expect(screen.getByText('1 ami participe')).toBeInTheDocument();
  });

  it('shows the plural wording for multiple attending friends', () => {
    renderCard({
      ...baseEvent,
      friendsAttendingCount: 2,
      friendsAttending: [{ id: 'f1', username: 'Alice' }, { id: 'f2' }],
    });
    expect(screen.getByText('2 amis participent')).toBeInTheDocument();
  });

  it('shows the distance when provided', () => {
    renderCard({ ...baseEvent, distance: 3.5 } as Event & { distance: number });
    expect(screen.getByText('À 3.5 km')).toBeInTheDocument();
  });

  it('shows the organizer username when available', () => {
    renderCard({
      ...baseEvent,
      organizer: { id: 'org-1', email: 'jane@example.com', username: 'Jane' },
    });
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('falls back to the email prefix when the organizer has no username', () => {
    renderCard({
      ...baseEvent,
      organizer: { id: 'org-1', email: 'jane@example.com' },
    });
    expect(screen.getByText('jane')).toBeInTheDocument();
  });

  it('stops click propagation on the organizer link', () => {
    const onArticleClick = vi.fn();
    render(
      <BrowserRouter>
        <div onClick={onArticleClick}>
          <EventCard
            event={{
              ...baseEvent,
              organizer: { id: 'org-1', email: 'jane@example.com', username: 'Jane' },
            }}
          />
        </div>
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByText('Jane'));
    expect(onArticleClick).not.toHaveBeenCalled();
  });

  it('renders the average rating when reviews are present', () => {
    renderCard({
      ...baseEvent,
      averageRating: 4.5,
      totalReviews: 3,
    } as Event & { averageRating: number; totalReviews: number });
    expect(screen.getByText('(3 avis)')).toBeInTheDocument();
  });

  it('does not render the average rating when there are no reviews', () => {
    renderCard({
      ...baseEvent,
      averageRating: 4.5,
      totalReviews: 0,
    } as Event & { averageRating: number; totalReviews: number });
    expect(screen.queryByText(/avis\)/)).not.toBeInTheDocument();
  });

  it('renders the placeholder image when no imageUrl is set', () => {
    renderCard(baseEvent);
    expect(
      screen.getByLabelText('Aucune image disponible pour cet événement'),
    ).toBeInTheDocument();
  });

  it('falls back to the snake_case event_date when eventDate is absent', () => {
    const event = { ...baseEvent } as unknown as Record<string, unknown>;
    delete event.eventDate;
    event.event_date = '2099-06-15T00:00:00Z';
    renderCard(event as unknown as Event);
    expect(screen.getByText('15')).toBeInTheDocument();
  });
});
