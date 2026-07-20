import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  participantReviewService,
  isEventDatePastForParticipantReviews,
} from '../services/participantReviewService';
import { api } from '../services/api';
import type { ParticipantReview } from '../services/participantReviewService';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const review: ParticipantReview = {
  id: 'r1',
  eventId: 'e1',
  reviewerId: 'u1',
  participantId: 'u2',
  rating: 5,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isEventDatePastForParticipantReviews', () => {
  it('returns true for null, undefined or blank input', () => {
    expect(isEventDatePastForParticipantReviews(null)).toBe(true);
    expect(isEventDatePastForParticipantReviews(undefined)).toBe(true);
    expect(isEventDatePastForParticipantReviews('   ')).toBe(true);
  });

  it('returns true for an unparsable date', () => {
    expect(isEventDatePastForParticipantReviews('not-a-date')).toBe(true);
  });

  it('returns true for a date in the past', () => {
    expect(isEventDatePastForParticipantReviews('2020-01-01T00:00:00Z')).toBe(true);
  });

  it('returns false for a date in the future', () => {
    expect(isEventDatePastForParticipantReviews('2099-01-01T00:00:00Z')).toBe(false);
  });
});

describe('participantReviewService', () => {
  it('createReview posts the review data', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: review });
    const dto = { eventId: 'e1', participantId: 'u2', rating: 5 };

    const result = await participantReviewService.createReview(dto);

    expect(api.post).toHaveBeenCalledWith('/participant-reviews', dto);
    expect(result).toEqual(review);
  });

  it('getReviewsByParticipant fetches reviews for a participant', async () => {
    const response = { reviews: [review], stats: { averageRating: 5, totalReviews: 1 } };
    vi.mocked(api.get).mockResolvedValue({ data: response });

    const result = await participantReviewService.getReviewsByParticipant('u2');

    expect(api.get).toHaveBeenCalledWith('/participant-reviews/participant/u2');
    expect(result).toEqual(response);
  });

  it('getReviewsByEvent fetches reviews for an event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [review] });

    const result = await participantReviewService.getReviewsByEvent('e1');

    expect(api.get).toHaveBeenCalledWith('/participant-reviews/event/e1');
    expect(result).toEqual([review]);
  });

  it('getParticipantsForEvent fetches reviewable participants for an event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const result = await participantReviewService.getParticipantsForEvent('e1');

    expect(api.get).toHaveBeenCalledWith('/participant-reviews/event/e1/participants');
    expect(result).toEqual([]);
  });

  it('updateReview patches the review with the given data', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: review });

    const result = await participantReviewService.updateReview('r1', { rating: 4 });

    expect(api.patch).toHaveBeenCalledWith('/participant-reviews/r1', { rating: 4 });
    expect(result).toEqual(review);
  });

  it('deleteReview deletes the review by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await participantReviewService.deleteReview('r1');

    expect(api.delete).toHaveBeenCalledWith('/participant-reviews/r1');
  });
});
