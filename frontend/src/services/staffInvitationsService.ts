import { api } from './api';

const BASE = '/staff-invitations';

export type StaffInvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface InvitationUser {
  id: string;
  username: string | null;
  email: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  token: string;
  status: StaffInvitationStatus;
  expiresAt: string;
  createdAt: string;
  event?: { id: string; title: string; eventDate: string };
  invitedBy?: InvitationUser;
  acceptedBy?: InvitationUser | null;
}

export const staffInvitationsService = {
  /** Créer une invitation (ORGANIZER uniquement) pour un événement. */
  async create(email: string, eventId: string): Promise<StaffInvitation> {
    const { data } = await api.post<StaffInvitation>(BASE, {
      email: email.trim(),
      eventId,
    });
    return data;
  },

  /** Liste des invitations envoyées par l'organisateur connecté. */
  async getMyInvitations(): Promise<StaffInvitation[]> {
    const { data } = await api.get<StaffInvitation[]>(`${BASE}/my-invitations`);
    return data;
  },

  /** Invitations en attente pour l'email de l'utilisateur connecté. */
  async getPendingForMe(): Promise<StaffInvitation[]> {
    const { data } = await api.get<StaffInvitation[]>(`${BASE}/pending`);
    return data;
  },

  /** Détail d'une invitation par token (public, pas d'auth requise). */
  async getByToken(token: string): Promise<StaffInvitation> {
    const { data } = await api.get<StaffInvitation>(`${BASE}/token/${token}`);
    return data;
  },

  /** Accepter une invitation (utilisateur connecté dont l'email correspond). Retourne les tokens si succès. */
  async accept(token: string): Promise<{ message: string; user?: import('../types/auth').User; accessToken?: string; refreshToken?: string }> {
    const { data } = await api.post<{ message: string; user?: import('../types/auth').User; accessToken?: string; refreshToken?: string }>(
      `${BASE}/accept`,
      { token },
    );
    return data;
  },

  /** Refuser une invitation. */
  async decline(token: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`${BASE}/decline`, { token });
    return data;
  },

  /** Annuler une invitation en attente (ORGANIZER uniquement). */
  async cancel(invitationId: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`${BASE}/${invitationId}`);
    return data;
  },
};
