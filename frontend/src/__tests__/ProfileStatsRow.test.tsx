import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileStatsRow } from '../components/profile/ProfileStatsRow';
import { followService } from '../services/followService';

vi.mock('../services/followService', () => ({
  followService: {
    getFollowers: vi.fn().mockResolvedValue([]),
    getFollowing: vi.fn().mockResolvedValue([]),
    getFriends: vi.fn().mockResolvedValue([]),
    follow: vi.fn(),
    unfollow: vi.fn(),
  },
}));

describe('ProfileStatsRow', () => {
  it('renders the follower/following/friends counts with correct pluralization', () => {
    render(
      <ProfileStatsRow
        profileUserId="p1"
        currentUserId="me"
        followersCount={1}
        followingCount={2}
        friendsCount={0}
      />,
    );

    expect(screen.getByText(/1 abonné(?!s)/)).toBeInTheDocument();
    expect(screen.getByText(/2 abonnements/)).toBeInTheDocument();
    expect(screen.getByText(/0 amis/)).toBeInTheDocument();
  });

  it('renders plain text (no buttons) when there is no current user', () => {
    render(
      <ProfileStatsRow
        profileUserId="p1"
        currentUserId={undefined}
        followersCount={3}
        followingCount={4}
        friendsCount={5}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('opens the list modal on the requested tab when a stat is clicked', async () => {
    render(
      <ProfileStatsRow
        profileUserId="p1"
        currentUserId="me"
        followersCount={3}
        followingCount={4}
        friendsCount={5}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /4 abonnements/ }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abonnements \(4\)/ })).toHaveClass(
      'text-primary-600',
    );
    expect(followService.getFollowing).toHaveBeenCalledWith('p1');
  });
});
