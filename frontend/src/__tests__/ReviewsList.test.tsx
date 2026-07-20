import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewsList } from '../components/reviews/ReviewsList';
import { reviewService } from '../services/reviewService';
import { socketService } from '../services/socketService';

vi.mock('../services/reviewService', () => ({
  reviewService: {
    getEventReviews: vi.fn(),
  },
}));

vi.mock('../services/socketService', () => ({
  socketService: {
    isConnected: vi.fn(),
    connect: vi.fn(),
    joinEventRoom: vi.fn(),
    leaveEventRoom: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

const review = {
  id: 'r1',
  rating: 5,
  comment: 'Génial',
  createdAt: '2026-01-01T00:00:00.000Z',
  user: { email: 'alice@example.com' },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(socketService.isConnected).mockReturnValue(true);
  vi.mocked(socketService.joinEventRoom).mockResolvedValue(undefined);
});

describe('ReviewsList', () => {
  it('shows a loading state before the reviews arrive', () => {
    vi.mocked(reviewService.getEventReviews).mockReturnValue(new Promise(() => {}));

    render(<ReviewsList eventId="e1" />);

    expect(screen.getByText('Chargement des avis...')).toBeInTheDocument();
  });

  it('renders the review list, average rating and total count once loaded', async () => {
    vi.mocked(reviewService.getEventReviews).mockResolvedValue({
      reviews: [review],
      stats: { averageRating: 5, totalReviews: 1 },
    });

    render(<ReviewsList eventId="e1" />);

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('1 avis')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no reviews', async () => {
    vi.mocked(reviewService.getEventReviews).mockResolvedValue({
      reviews: [],
      stats: { averageRating: null, totalReviews: 0 },
    });

    render(<ReviewsList eventId="e1" />);

    expect(
      await screen.findByText('Aucun avis pour le moment. Soyez le premier à donner votre avis !'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('notifies onReviewsLoaded with the fetched stats', async () => {
    vi.mocked(reviewService.getEventReviews).mockResolvedValue({
      reviews: [review],
      stats: { averageRating: 5, totalReviews: 1 },
    });
    const onReviewsLoaded = vi.fn();

    render(<ReviewsList eventId="e1" onReviewsLoaded={onReviewsLoaded} />);

    await waitFor(() =>
      expect(onReviewsLoaded).toHaveBeenCalledWith({ averageRating: 5, totalReviews: 1 }),
    );
  });

  it('refetches with the new sort order when the sort select changes', async () => {
    vi.mocked(reviewService.getEventReviews).mockResolvedValue({
      reviews: [review],
      stats: { averageRating: 5, totalReviews: 1 },
    });

    render(<ReviewsList eventId="e1" />);
    await screen.findByText('alice@example.com');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'lowest' } });

    await waitFor(() =>
      expect(reviewService.getEventReviews).toHaveBeenLastCalledWith('e1', 1, 10, 'lowest'),
    );
  });

  it('refetches when refreshTrigger changes', async () => {
    vi.mocked(reviewService.getEventReviews).mockResolvedValue({
      reviews: [],
      stats: { averageRating: null, totalReviews: 0 },
    });

    const { rerender } = render(<ReviewsList eventId="e1" refreshTrigger={1} />);
    await waitFor(() => expect(reviewService.getEventReviews).toHaveBeenCalledTimes(1));

    rerender(<ReviewsList eventId="e1" refreshTrigger={2} />);
    await waitFor(() => expect(reviewService.getEventReviews).toHaveBeenCalledTimes(2));
  });

  it('joins the socket event room and connects when not already connected', async () => {
    vi.mocked(socketService.isConnected).mockReturnValue(false);
    sessionStorage.setItem('accessToken', 'token-123');
    vi.mocked(socketService.connect).mockResolvedValue(undefined);
    vi.mocked(reviewService.getEventReviews).mockResolvedValue({
      reviews: [],
      stats: { averageRating: null, totalReviews: 0 },
    });

    render(<ReviewsList eventId="e1" />);

    await waitFor(() => expect(socketService.connect).toHaveBeenCalledWith('token-123'));
    expect(socketService.joinEventRoom).toHaveBeenCalledWith('e1');

    sessionStorage.clear();
  });

  it('leaves the event room and unsubscribes on unmount', async () => {
    vi.mocked(reviewService.getEventReviews).mockResolvedValue({
      reviews: [],
      stats: { averageRating: null, totalReviews: 0 },
    });

    const { unmount } = render(<ReviewsList eventId="e1" />);
    await waitFor(() => expect(socketService.joinEventRoom).toHaveBeenCalledWith('e1'));

    unmount();

    expect(socketService.off).toHaveBeenCalledWith('reviewsChanged', expect.any(Function));
    expect(socketService.leaveEventRoom).toHaveBeenCalledWith('e1');
  });
});
