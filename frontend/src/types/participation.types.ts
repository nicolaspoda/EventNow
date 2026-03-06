export type ParticipationRequestStatus = 'PENDING' | 'ACCEPTED' | 'REFUSED';

export interface ParticipationRequest {
  id: string;
  eventId: string;
  userId: string;
  status: ParticipationRequestStatus;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  event?: { id: string; title: string; eventDate?: string; location?: string; type?: string };
  user?: { id: string; email: string; firstName?: string; lastName?: string };
}

export interface CreateParticipationRequestDto {
  eventId: string;
}
