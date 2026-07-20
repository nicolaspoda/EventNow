import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FriendsActivitySection } from '../components/dashboard/FriendsActivitySection';
import { eventService } from '../services/eventService';
import type { Event } from '../types/event.types';

vi.mock('../services/eventService', () => ({
  eventService: {
    searchEvents: vi.fn(),
  },
}));

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'e1',
    title: 'Concert de jazz',
    location: 'Paris',
    eventDate: '2026-06-15T20:00:00.000Z',
    organizerId: 'org1',
    organizer: { id: 'org1', email: 'bob@example.com', username: 'bob' },
    ticketCategories: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderSection() {
  return render(
    <MemoryRouter>
      <FriendsActivitySection />
    </MemoryRouter>,
  );
}

describe('FriendsActivitySection', () => {
  it('requests friends-only, date-ascending events limited to 4', async () => {
    vi.mocked(eventService.searchEvents).mockResolvedValue({ events: [] });

    renderSection();

    await waitFor(() =>
      expect(eventService.searchEvents).toHaveBeenCalledWith({
        friendsOnly: true,
        sortBy: 'DATE_ASC',
        limit: 4,
      }),
    );
  });

  it('renders nothing once loaded when there are no friends events', async () => {
    vi.mocked(eventService.searchEvents).mockResolvedValue({ events: [] });

    const { container } = renderSection();

    await waitFor(() => expect(eventService.searchEvents).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the request fails', async () => {
    vi.mocked(eventService.searchEvents).mockRejectedValue(new Error('boom'));

    const { container } = renderSection();

    await waitFor(() => expect(eventService.searchEvents).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('lists friends events with organizer and date once loaded', async () => {
    vi.mocked(eventService.searchEvents).mockResolvedValue({ events: [makeEvent()] });

    renderSection();

    expect(await screen.findByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Concert de jazz/ })).toHaveAttribute(
      'href',
      '/events/e1',
    );
  });

  it('falls back to the organizer email prefix when there is no username', async () => {
    vi.mocked(eventService.searchEvents).mockResolvedValue({
      events: [makeEvent({ organizer: { id: 'org1', email: 'carol@example.com', username: undefined } })],
    });

    renderSection();

    expect(await screen.findByText('carol')).toBeInTheDocument();
  });

  it('links "Voir tout" to the friends-filtered events page', async () => {
    vi.mocked(eventService.searchEvents).mockResolvedValue({ events: [makeEvent()] });

    renderSection();

    expect(await screen.findByText('Voir tout')).toHaveAttribute(
      'href',
      '/events?friendsOnly=true',
    );
  });
});
