import { api } from './api';

interface CreateReviewDto {
  rating: number;
  comment?: string;
}

interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

interface Review {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
  };
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    averageRating: number | null;
    totalReviews: number;
  };
}

interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
}

export const reviewService = {
  async createReview(eventId: string, data: CreateReviewDto): Promise<Review> {
    const response = await api.post<Review>(`/reviews/events/${eventId}`, data);
    return response.data;
  },

  async getEventReviews(
    eventId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: 'recent' | 'highest' | 'lowest' = 'recent',
  ): Promise<ReviewsResponse> {
    const response = await api.get<ReviewsResponse>(
      `/reviews/events/${eventId}?page=${page}&limit=${limit}&sortBy=${sortBy}`,
    );
    return response.data;
  },

  async canUserReview(eventId: string): Promise<CanReviewResponse> {
    const response = await api.get<CanReviewResponse>(
      `/reviews/events/${eventId}/can-review`,
    );
    return response.data;
  },

  async getMyReviews(): Promise<Review[]> {
    const response = await api.get<Review[]>('/reviews/my-reviews');
    return response.data;
  },

  async updateReview(reviewId: string, data: UpdateReviewDto): Promise<Review> {
    const response = await api.patch<Review>(`/reviews/${reviewId}`, data);
    return response.data;
  },

  async deleteReview(reviewId: string): Promise<void> {
    await api.delete(`/reviews/${reviewId}`);
  },
};
