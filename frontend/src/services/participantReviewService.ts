import axios from 'axios';

// Par défaut on utilise le proxy Vite (same-origin) en dev.
const API_URL = import.meta.env.VITE_API_URL ?? '';
const API_BASE = `${API_URL}/api/v1`;

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

const participantReviewService = {
  async createReview(token: string, data: CreateParticipantReviewDto): Promise<ParticipantReview> {
    const response = await axios.post(`${API_BASE}/participant-reviews`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getReviewsByParticipant(token: string, participantId: string): Promise<ParticipantReviewsResponse> {
    const response = await axios.get(`${API_BASE}/participant-reviews/participant/${participantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getReviewsByEvent(token: string, eventId: string): Promise<ParticipantReview[]> {
    const response = await axios.get(`${API_BASE}/participant-reviews/event/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getParticipantsForEvent(token: string, eventId: string): Promise<ParticipantForReview[]> {
    const response = await axios.get(`${API_BASE}/participant-reviews/event/${eventId}/participants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updateReview(token: string, reviewId: string, data: UpdateParticipantReviewDto): Promise<ParticipantReview> {
    const response = await axios.patch(`${API_BASE}/participant-reviews/${reviewId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async deleteReview(token: string, reviewId: string): Promise<void> {
    await axios.delete(`${API_BASE}/participant-reviews/${reviewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default participantReviewService;
