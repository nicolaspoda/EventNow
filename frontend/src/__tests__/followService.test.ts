import { describe, it, expect, vi, beforeEach } from 'vitest';
import { followService } from '../services/followService';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('followService', () => {
  it('follow posts to the user follow endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    const result = await followService.follow('u1');

    expect(api.post).toHaveBeenCalledWith('/follows/user/u1');
    expect(result).toEqual({ success: true });
  });

  it('unfollow deletes the follow relationship', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { success: true } });

    const result = await followService.unfollow('u1');

    expect(api.delete).toHaveBeenCalledWith('/follows/user/u1');
    expect(result).toEqual({ success: true });
  });

  it('isFollowing fetches the follow check endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { following: true } });

    const result = await followService.isFollowing('u1');

    expect(api.get).toHaveBeenCalledWith('/follows/user/u1/check');
    expect(result).toEqual({ following: true });
  });

  it('getFollowers fetches the followers list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const result = await followService.getFollowers('u1');

    expect(api.get).toHaveBeenCalledWith('/follows/user/u1/followers');
    expect(result).toEqual([]);
  });

  it('getFollowing fetches the following list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const result = await followService.getFollowing('u1');

    expect(api.get).toHaveBeenCalledWith('/follows/user/u1/following');
    expect(result).toEqual([]);
  });

  it('getFriends fetches the friends list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const result = await followService.getFriends('u1');

    expect(api.get).toHaveBeenCalledWith('/follows/user/u1/friends');
    expect(result).toEqual([]);
  });

  it('setNotifications patches the notifications flag', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { success: true } });

    const result = await followService.setNotifications('u1', false);

    expect(api.patch).toHaveBeenCalledWith('/follows/user/u1/notifications', { enabled: false });
    expect(result).toEqual({ success: true });
  });
});
