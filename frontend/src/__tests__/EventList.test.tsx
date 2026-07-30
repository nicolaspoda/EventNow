import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import EventList from '../components/events/EventList';
import type { Event } from '../types/event.types';

const event: Event = {
  id: 'e1',
  title: 'Concert de jazz',
  location: 'Paris',
  eventDate: '2026-01-01T20:00:00.000Z',
  organizerId: 'org1',
  ticketCategories: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderList(props: Partial<React.ComponentProps<typeof EventList>>) {
  return render(
    <MemoryRouter>
      <EventList events={[]} loading={false} error={null} {...props} />
    </MemoryRouter>,
  );
}

describe('EventList', () => {
  it('shows a loading indicator when loading is true', () => {
    renderList({ loading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Chargement des événements...');
  });

  it('shows the error message when error is set', () => {
    renderList({ error: 'Erreur réseau' });

    expect(screen.getByRole('alert')).toHaveTextContent('Erreur réseau');
  });

  it('shows an empty state when there are no events', () => {
    renderList({ events: [] });

    expect(screen.getByText('Aucun événement trouvé')).toBeInTheDocument();
  });

  it('renders one list item per event', () => {
    renderList({ events: [event, { ...event, id: 'e2', title: 'Autre événement' }] });

    expect(screen.getByRole('list', { name: 'Liste des événements' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText('Autre événement')).toBeInTheDocument();
  });

  it('prioritizes the loading state over an error or events', () => {
    renderList({ loading: true, error: 'Erreur réseau', events: [event] });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Concert de jazz')).not.toBeInTheDocument();
  });
});
