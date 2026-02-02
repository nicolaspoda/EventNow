import { api } from './api';
import type {
  Ticket,
  ValidateTicketDto,
  ValidateTicketResponse,
} from '../types/order.types';

export const ticketService = {
  /**
   * Récupérer tous les tickets de l'utilisateur
   */
  async getMyTickets(): Promise<Ticket[]> {
    const response = await api.get<Ticket[]>('/tickets/my-tickets');
    return response.data;
  },

  /**
   * Valider un ticket avec son QR code (pour le staff)
   */
  async validateTicket(data: ValidateTicketDto): Promise<ValidateTicketResponse> {
    const response = await api.post<ValidateTicketResponse>('/tickets/validate', data);
    return response.data;
  },
};
