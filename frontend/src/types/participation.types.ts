export type ParticipationRequestStatus = 'PENDING' | 'ACCEPTED' | 'REFUSED';

export interface ParticipationRequest {
  id: string;
  eventId: string;
  userId: string;
  message?: string;
  status: ParticipationRequestStatus;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  event?: { id: string; title: string; eventDate?: string; location?: string; type?: string };
  user?: { id: string; email: string; username?: string | null; avatarUrl?: string };
}

export interface CreateParticipationRequestDto {
  eventId: string;
  message?: string;
}
