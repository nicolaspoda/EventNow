import { api } from './api';
import type { ParticipationRequest, CreateParticipationRequestDto } from '../types/participation.types';

export const participationService = {
  create: async (dto: CreateParticipationRequestDto): Promise<ParticipationRequest> => {
    const response = await api.post<ParticipationRequest>('/participation-requests', dto);
    return response.data;
  },

  getByEvent: async (eventId: string): Promise<ParticipationRequest[]> => {
    const response = await api.get<ParticipationRequest[]>(
      `/participation-requests/event/${eventId}`,
    );
    return response.data;
  },

  getMyRequests: async (): Promise<ParticipationRequest[]> => {
    const response = await api.get<ParticipationRequest[]>('/participation-requests/my');
    return response.data;
  },

  getMyRequestForEvent: async (
    eventId: string,
  ): Promise<ParticipationRequest | null> => {
    const response = await api.get<ParticipationRequest | null>(
      `/participation-requests/my/event/${eventId}`,
    );
    return response.data;
  },

  getPendingForOrganizer: async (): Promise<ParticipationRequest[]> => {
    const response = await api.get<ParticipationRequest[]>(
      '/participation-requests/pending-for-organizer',
    );
    return response.data;
  },

  respond: async (
    requestId: string,
    action: 'ACCEPT' | 'REFUSE',
  ): Promise<ParticipationRequest> => {
    const response = await api.patch<ParticipationRequest>(
      `/participation-requests/${requestId}/respond`,
      { action },
    );
    return response.data;
  },
};
