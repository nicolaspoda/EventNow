import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportsService } from '../services/reportsService';
import { api } from '../services/api';
import type { Report, BannedUser, CreateReportDto } from '../services/reportsService';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const report: Report = {
  id: 'r1',
  reporterId: 'u1',
  type: 'EVENT',
  reason: 'SPAM',
  description: null,
  status: 'PENDING',
  targetUserId: null,
  targetEventId: 'e1',
  targetEvent: { id: 'e1', title: 'Event' },
  targetUser: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const bannedUser: BannedUser = {
  id: 'u1',
  username: 'bob',
  email: 'bob@example.com',
  bannedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reportsService', () => {
  it('createReport posts the report dto', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: report });
    const dto: CreateReportDto = { type: 'EVENT', reason: 'SPAM', targetEventId: 'e1' };

    const result = await reportsService.createReport(dto);

    expect(api.post).toHaveBeenCalledWith('/reports', dto);
    expect(result).toEqual(report);
  });

  it('getMyReports fetches the current user reports', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [report] });

    const result = await reportsService.getMyReports();

    expect(api.get).toHaveBeenCalledWith('/reports/my');
    expect(result).toEqual([report]);
  });

  it('getAllReports fetches without a status filter by default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [report] });

    const result = await reportsService.getAllReports();

    expect(api.get).toHaveBeenCalledWith('/reports', { params: {} });
    expect(result).toEqual([report]);
  });

  it('getAllReports passes a status filter through the params', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await reportsService.getAllReports('RESOLVED');

    expect(api.get).toHaveBeenCalledWith('/reports', { params: { status: 'RESOLVED' } });
  });

  it('updateReportStatus patches the report status', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: report });

    const result = await reportsService.updateReportStatus('r1', 'RESOLVED');

    expect(api.patch).toHaveBeenCalledWith('/reports/r1/status', { status: 'RESOLVED' });
    expect(result).toEqual(report);
  });

  it('suspendEvent patches the suspend endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { id: 'e1', title: 'Event', status: 'SUSPENDED' } });

    const result = await reportsService.suspendEvent('e1');

    expect(api.patch).toHaveBeenCalledWith('/events/e1/suspend');
    expect(result).toEqual({ id: 'e1', title: 'Event', status: 'SUSPENDED' });
  });

  it('banUser patches the ban endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValue({
      data: { id: 'u1', username: 'bob', email: 'bob@example.com', isBanned: true },
    });

    const result = await reportsService.banUser('u1');

    expect(api.patch).toHaveBeenCalledWith('/users/u1/ban');
    expect(result).toEqual({ id: 'u1', username: 'bob', email: 'bob@example.com', isBanned: true });
  });

  it('getBannedUsers fetches the banned users list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [bannedUser] });

    const result = await reportsService.getBannedUsers();

    expect(api.get).toHaveBeenCalledWith('/users/banned');
    expect(result).toEqual([bannedUser]);
  });
});
