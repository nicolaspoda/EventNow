import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../services/dashboardService';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dashboardService', () => {
  it('getOrganizerOverview fetches the organizer overview', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { totalEvents: 3 } });

    const result = await dashboardService.getOrganizerOverview();

    expect(api.get).toHaveBeenCalledWith('/dashboard/organizer/overview');
    expect(result).toEqual({ totalEvents: 3 });
  });

  it('getOrganizerEvents fetches the organizer events list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 'e1' }] });

    const result = await dashboardService.getOrganizerEvents();

    expect(api.get).toHaveBeenCalledWith('/dashboard/organizer/events');
    expect(result).toEqual([{ id: 'e1' }]);
  });

  it('getEventStats fetches stats for the given event id', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { totalRevenue: 100 } });

    const result = await dashboardService.getEventStats('e1');

    expect(api.get).toHaveBeenCalledWith('/dashboard/organizer/events/e1/stats');
    expect(result).toEqual({ totalRevenue: 100 });
  });

  it('getUserOverview fetches the user overview', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { totalEvents: 1 } });

    const result = await dashboardService.getUserOverview();

    expect(api.get).toHaveBeenCalledWith('/dashboard/user/overview');
    expect(result).toEqual({ totalEvents: 1 });
  });

  it('getUserEvents fetches the user events list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 'e2' }] });

    const result = await dashboardService.getUserEvents();

    expect(api.get).toHaveBeenCalledWith('/dashboard/user/events');
    expect(result).toEqual([{ id: 'e2' }]);
  });

  it('getEventParticipants fetches participants for the given event id', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { participants: [] } });

    const result = await dashboardService.getEventParticipants('e1');

    expect(api.get).toHaveBeenCalledWith('/dashboard/user/events/e1/participants');
    expect(result).toEqual({ participants: [] });
  });

  it('getMyUpcomingEvents fetches the upcoming events list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const result = await dashboardService.getMyUpcomingEvents();

    expect(api.get).toHaveBeenCalledWith('/dashboard/my-upcoming-events');
    expect(result).toEqual([]);
  });

  it('getMyParticipatedEvents fetches the participated events list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const result = await dashboardService.getMyParticipatedEvents();

    expect(api.get).toHaveBeenCalledWith('/dashboard/my-participated-events');
    expect(result).toEqual([]);
  });

  it('getMyCalendarEvents fetches the calendar events list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const result = await dashboardService.getMyCalendarEvents();

    expect(api.get).toHaveBeenCalledWith('/dashboard/my-calendar-events');
    expect(result).toEqual([]);
  });
});
