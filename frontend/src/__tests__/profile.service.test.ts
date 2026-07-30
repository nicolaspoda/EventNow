import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileService } from '../services/profile.service';
import { api } from '../services/api';
import type { User, UserProfile } from '../types/auth';
import type { PublicUserProfile } from '../services/profile.service';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const profile: UserProfile = {
  id: 'u1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'USER',
  stats: { ordersCount: 0, reviewsCount: 0, eventsOrganized: 0 },
};

const user: User = {
  id: 'u1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'USER',
};

const publicProfile: PublicUserProfile = {
  id: 'u2',
  email: 'bob@example.com',
  createdAt: '2026-01-01T00:00:00Z',
  participatedEvents: [],
  participantReviews: [],
  stats: { averageRating: null, totalReviews: 0, participatedEventsCount: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('profileService', () => {
  it('getProfile fetches the current user profile', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: profile });

    const result = await profileService.getProfile();

    expect(api.get).toHaveBeenCalledWith('/auth/profile');
    expect(result).toEqual(profile);
  });

  it('updateProfile puts the profile update payload', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: user });

    const result = await profileService.updateProfile({ avatarUrl: 'https://example.com/a.png' });

    expect(api.put).toHaveBeenCalledWith('/auth/profile', { avatarUrl: 'https://example.com/a.png' });
    expect(result).toEqual(user);
  });

  it('getUserPublicProfile fetches the public profile for a user id', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: publicProfile });

    const result = await profileService.getUserPublicProfile('u2');

    expect(api.get).toHaveBeenCalledWith('/auth/user/u2/public-profile');
    expect(result).toEqual(publicProfile);
  });
});
