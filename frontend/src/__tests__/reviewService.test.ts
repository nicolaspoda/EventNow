import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewService } from '../services/reviewService';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const review = {
  id: 'r1',
  eventId: 'e1',
  userId: 'u1',
  rating: 5,
  comment: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  user: { email: 'u1@example.com' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reviewService', () => {
  it('createReview posts the review data for an event', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: review });

    const result = await reviewService.createReview('e1', { rating: 5 });

    expect(api.post).toHaveBeenCalledWith('/reviews/events/e1', { rating: 5 });
    expect(result).toEqual(review);
  });

  it('getEventReviews uses default pagination and sort', async () => {
    const response = { reviews: [review], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }, stats: { averageRating: 5, totalReviews: 1 } };
    vi.mocked(api.get).mockResolvedValue({ data: response });

    const result = await reviewService.getEventReviews('e1');

    expect(api.get).toHaveBeenCalledWith('/reviews/events/e1?page=1&limit=10&sortBy=recent');
    expect(result).toEqual(response);
  });

  it('getEventReviews passes custom pagination and sort through', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: {} });

    await reviewService.getEventReviews('e1', 2, 5, 'highest');

    expect(api.get).toHaveBeenCalledWith('/reviews/events/e1?page=2&limit=5&sortBy=highest');
  });

  it('canUserReview fetches whether the current user can review the event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { canReview: true } });

    const result = await reviewService.canUserReview('e1');

    expect(api.get).toHaveBeenCalledWith('/reviews/events/e1/can-review');
    expect(result).toEqual({ canReview: true });
  });

  it('getMyReviews fetches the current user reviews', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [review] });

    const result = await reviewService.getMyReviews();

    expect(api.get).toHaveBeenCalledWith('/reviews/my-reviews');
    expect(result).toEqual([review]);
  });

  it('updateReview patches the review with the given data', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: review });

    const result = await reviewService.updateReview('r1', { rating: 4 });

    expect(api.patch).toHaveBeenCalledWith('/reviews/r1', { rating: 4 });
    expect(result).toEqual(review);
  });

  it('deleteReview deletes the review by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await reviewService.deleteReview('r1');

    expect(api.delete).toHaveBeenCalledWith('/reviews/r1');
  });
});
