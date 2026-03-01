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

  /**
   * Télécharger un billet en PDF
   */
  async downloadTicketPDF(ticketId: string): Promise<void> {
    const response = await api.get(`/tickets/download/${ticketId}`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ticket-${ticketId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
