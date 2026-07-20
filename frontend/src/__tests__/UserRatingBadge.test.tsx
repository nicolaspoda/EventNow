import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRatingBadge } from '../components/participation/UserRatingBadge';
import { participantReviewService } from '../services/participantReviewService';
import { useAuth } from '../utils/useAuth';

vi.mock('../services/participantReviewService', () => ({
  participantReviewService: {
    getReviewsByParticipant: vi.fn(),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function mockAuthUser(id: string | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: id ? { id, username: 'me', email: 'me@example.com', role: 'USER' } : null,
    isAuthenticated: !!id,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

describe('UserRatingBadge', () => {
  it('does not fetch and shows "Aucun avis" when there is no authenticated user', () => {
    mockAuthUser(null);

    render(<UserRatingBadge userId="u1" />);

    expect(participantReviewService.getReviewsByParticipant).not.toHaveBeenCalled();
    expect(screen.getByText('Aucun avis')).toBeInTheDocument();
  });

  it('shows "Aucun avis" when the user has no reviews', async () => {
    mockAuthUser('me');
    vi.mocked(participantReviewService.getReviewsByParticipant).mockResolvedValue({
      reviews: [],
      stats: { averageRating: null, totalReviews: 0 },
    });

    render(<UserRatingBadge userId="u1" />);

    expect(await screen.findByText('Aucun avis')).toBeInTheDocument();
  });

  it('shows the average rating and review count', async () => {
    mockAuthUser('me');
    vi.mocked(participantReviewService.getReviewsByParticipant).mockResolvedValue({
      reviews: [],
      stats: { averageRating: 4.6, totalReviews: 5 },
    });

    render(<UserRatingBadge userId="u1" />);

    expect(await screen.findByText('4.6')).toBeInTheDocument();
    expect(screen.getByText('(5 avis)')).toBeInTheDocument();
  });

  it('falls back to no reviews when the request fails', async () => {
    mockAuthUser('me');
    vi.mocked(participantReviewService.getReviewsByParticipant).mockRejectedValue(new Error('boom'));

    render(<UserRatingBadge userId="u1" />);

    await waitFor(() => expect(screen.getByText('Aucun avis')).toBeInTheDocument());
  });
});
