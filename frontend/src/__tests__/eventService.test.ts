import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventService } from '../services/eventService';
import { api } from '../services/api';
import type { Event, CreateEventPayload, UpdateEventPayload } from '../types/event.types';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const event: Event = {
  id: 'e1',
  title: 'Event',
  location: 'Paris',
  eventDate: '2026-03-15T00:00:00Z',
  organizerId: 'org1',
  ticketCategories: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('eventService.getEvents', () => {
  it('calls /events with no query string when no filters are given', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [event] });

    const result = await eventService.getEvents();

    expect(api.get).toHaveBeenCalledWith('/events');
    expect(result).toEqual([event]);
  });

  it('builds a query string from the provided filters', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [event] });

    await eventService.getEvents({
      search: 'concert',
      location: 'Paris',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });

    expect(api.get).toHaveBeenCalledWith(
      '/events?search=concert&location=Paris&dateFrom=2026-01-01&dateTo=2026-12-31',
    );
  });

  it('omits empty filter fields from the query string', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await eventService.getEvents({ search: 'concert' });

    expect(api.get).toHaveBeenCalledWith('/events?search=concert');
  });
});

describe('eventService', () => {
  it('getEventById fetches a single event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: event });

    const result = await eventService.getEventById('e1');

    expect(api.get).toHaveBeenCalledWith('/events/e1');
    expect(result).toEqual(event);
  });

  it('createEvent posts the payload', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: event });
    const payload: CreateEventPayload = {
      title: 'Event',
      location: 'Paris',
      event_date: '2026-03-15T00:00:00Z',
      ticket_categories: [],
    };

    const result = await eventService.createEvent(payload);

    expect(api.post).toHaveBeenCalledWith('/events', payload);
    expect(result).toEqual(event);
  });

  it('updateEvent patches the given event id with the payload', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: event });
    const payload: UpdateEventPayload = { title: 'New title' };

    const result = await eventService.updateEvent('e1', payload);

    expect(api.patch).toHaveBeenCalledWith('/events/e1', payload);
    expect(result).toEqual(event);
  });

  it('deleteEvent deletes the event by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await eventService.deleteEvent('e1');

    expect(api.delete).toHaveBeenCalledWith('/events/e1');
  });

  it('cancelEvent patches the cancel endpoint with an optional reason', async () => {
    vi.mocked(api.patch).mockResolvedValue({
      data: { cancelledOrders: 2, failedRefunds: 0, totalRefunded: 40, notifiedUsers: 2 },
    });

    const result = await eventService.cancelEvent('e1', 'Weather');

    expect(api.patch).toHaveBeenCalledWith('/events/e1/cancel', { reason: 'Weather' });
    expect(result).toEqual({ cancelledOrders: 2, failedRefunds: 0, totalRefunded: 40, notifiedUsers: 2 });
  });

  it('searchEvents builds params from a filters record, joining arrays and skipping empty values', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await eventService.searchEvents({
      category: ['CONCERT', 'SPORT'],
      search: 'jazz',
      empty: '',
      missing: undefined,
      nullValue: null,
      emptyArray: [],
    });

    expect(api.get).toHaveBeenCalledWith('/events/search?category=CONCERT%2CSPORT&search=jazz');
  });

  it('getSuggestions fetches suggestions for a query', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await eventService.getSuggestions('jaz');

    expect(api.get).toHaveBeenCalledWith('/events/suggestions?q=jaz');
  });

  it('getCategories fetches the categories list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await eventService.getCategories();

    expect(api.get).toHaveBeenCalledWith('/events/categories');
  });

  it('getLocations fetches the locations list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await eventService.getLocations();

    expect(api.get).toHaveBeenCalledWith('/events/locations');
  });
});
