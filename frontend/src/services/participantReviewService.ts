import { api } from './api';

export interface CreateParticipantReviewDto {
  eventId: string;
  participantId: string;
  rating: number;
  comment?: string;
}

export interface UpdateParticipantReviewDto {
  rating?: number;
  comment?: string;
}

export interface ParticipantReview {
  id: string;
  eventId: string;
  reviewerId: string;
  participantId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    email: string;
    username?: string | null;
  };
  participant?: {
    id: string;
    email: string;
    username?: string | null;
  };
}

export interface ParticipantReviewsResponse {
  reviews: ParticipantReview[];
  stats: {
    averageRating: number | null;
    totalReviews: number;
  };
}

export interface ParticipantForReview {
  id: string;
  email: string;
  username?: string | null;
  avatarUrl?: string;
  hasReview: boolean;
  review?: ParticipantReview;
}

/** Aligné sur le backend : participants consultables une fois la date d'événement passée. */
export function isEventDatePastForParticipantReviews(
  eventDate: string | null | undefined,
): boolean {
  if (eventDate == null || String(eventDate).trim() === '') return true;
  const d = new Date(eventDate);
  if (Number.isNaN(d.getTime())) return true;
  return d <= new Date();
}

export const participantReviewService = {
  async createReview(data: CreateParticipantReviewDto): Promise<ParticipantReview> {
    const response = await api.post<ParticipantReview>('/participant-reviews', data);
    return response.data;
  },

  async getReviewsByParticipant(participantId: string): Promise<ParticipantReviewsResponse> {
    const response = await api.get<ParticipantReviewsResponse>(`/participant-reviews/participant/${participantId}`);
    return response.data;
  },

  async getReviewsByEvent(eventId: string): Promise<ParticipantReview[]> {
    const response = await api.get<ParticipantReview[]>(`/participant-reviews/event/${eventId}`);
    return response.data;
  },

  async getParticipantsForEvent(eventId: string): Promise<ParticipantForReview[]> {
    const response = await api.get<ParticipantForReview[]>(`/participant-reviews/event/${eventId}/participants`);
    return response.data;
  },

  async updateReview(reviewId: string, data: UpdateParticipantReviewDto): Promise<ParticipantReview> {
    const response = await api.patch<ParticipantReview>(`/participant-reviews/${reviewId}`, data);
    return response.data;
  },

  async deleteReview(reviewId: string): Promise<void> {
    await api.delete(`/participant-reviews/${reviewId}`);
  },
};
