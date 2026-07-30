import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import UpcomingEventCard from '../components/upcoming/UpcomingEventCard';
import type { UpcomingEvent } from '../types/dashboard.types';

function isoInDays(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours, 0, 0, 0);
  return d.toISOString();
}

function makeEvent(overrides: Partial<UpcomingEvent> = {}): UpcomingEvent {
  return {
    id: 'e1',
    title: 'Concert de jazz',
    eventDate: isoInDays(10),
    location: 'Paris',
    type: 'PROFESSIONAL',
    category: 'CONCERT' as never,
    participationType: 'TICKET',
    ticketCount: 2,
    categoryName: 'Standard',
    ...overrides,
  } as UpcomingEvent;
}

function renderCard(event: UpcomingEvent) {
  return render(
    <MemoryRouter>
      <UpcomingEventCard event={event} />
    </MemoryRouter>,
  );
}

describe('UpcomingEventCard - content', () => {
  it('shows the title, location and a link to the event', () => {
    renderCard(makeEvent());

    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Voir les détails de Concert de jazz/ })).toHaveAttribute(
      'href',
      '/events/e1',
    );
  });

  it('shows a placeholder when there is no image', () => {
    renderCard(makeEvent());

    expect(screen.getByLabelText('Aucune image disponible pour cet événement')).toBeInTheDocument();
  });

  it('shows the event image when imageUrl is present', () => {
    renderCard(makeEvent({ imageUrl: 'https://cdn.example.com/img.jpg' }));

    expect(screen.getByAltText("Affiche de l'événement Concert de jazz")).toBeInTheDocument();
  });

  it('shows the organizer when present', () => {
    renderCard(makeEvent({ organizer: { id: 'org1', email: 'bob@example.com', username: 'bob' } } as never));

    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('does not show an organizer line when absent', () => {
    renderCard(makeEvent());

    expect(screen.queryByText(/bob/)).not.toBeInTheDocument();
  });
});

describe('UpcomingEventCard - participation badge and footer', () => {
  it('shows the ticket badge and category for a TICKET participation', () => {
    renderCard(makeEvent({ participationType: 'TICKET', ticketCount: 3, categoryName: 'VIP' } as never));

    expect(screen.getByText('3 billets')).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('shows the "Inscrit" badge and confirmation for a PARTICIPATION participation', () => {
    renderCard(makeEvent({ participationType: 'PARTICIPATION' } as never));

    expect(screen.getByText('Inscrit')).toBeInTheDocument();
    expect(screen.getByText('Participation confirmée')).toBeInTheDocument();
  });

  it('shows the organizer badge and message for an ORGANIZER participation', () => {
    renderCard(makeEvent({ participationType: 'ORGANIZER' } as never));

    expect(screen.getByText('Organisateur')).toBeInTheDocument();
    expect(screen.getByText('Vous organisez cet événement')).toBeInTheDocument();
  });

  it('shows the staff badge and message for a STAFF participation', () => {
    renderCard(makeEvent({ participationType: 'STAFF' } as never));

    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('Vous êtes staff sur cet événement')).toBeInTheDocument();
  });
});

describe('UpcomingEventCard - countdown', () => {
  it('shows "Aujourd\'hui" for an event that started a few minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    renderCard(makeEvent({ eventDate: fiveMinutesAgo } as never));

    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
  });

  it('shows "Demain" for an event tomorrow', () => {
    renderCard(makeEvent({ eventDate: isoInDays(1) } as never));

    expect(screen.getByText('Demain')).toBeInTheDocument();
  });

  it('shows the day count for an event within a week', () => {
    renderCard(makeEvent({ eventDate: isoInDays(3) } as never));

    expect(screen.getByText('Dans 3 jours')).toBeInTheDocument();
  });

  it('shows the week count for an event within a month', () => {
    renderCard(makeEvent({ eventDate: isoInDays(14) } as never));

    expect(screen.getByText('Dans 2 semaines')).toBeInTheDocument();
  });

  it('shows the month count for an event further away', () => {
    renderCard(makeEvent({ eventDate: isoInDays(65) } as never));

    expect(screen.getByText('Dans 2 mois')).toBeInTheDocument();
  });

  it('shows "Terminé" for a past event', () => {
    renderCard(makeEvent({ eventDate: isoInDays(-5), isPast: true } as never));

    expect(screen.getByText('Terminé')).toBeInTheDocument();
  });

  it('shows a fallback message for an invalid date', () => {
    renderCard(makeEvent({ eventDate: 'not-a-date' } as never));

    expect(screen.getAllByText('Date non renseignée').length).toBeGreaterThan(0);
  });
});
