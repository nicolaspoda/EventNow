import { api } from './api';
import type { Order, OrderWithUser, ConfirmPaymentResponse } from '../types/order.types';

export interface InitiatePaymentResponse {
  paymentId: string;
  clientSecret: string;
  bookingId: string;
  amount: number;
  currency?: string;
  status?: string;
}

export const orderService = {
  /**
   * Initier le paiement à partir d'une réservation (booking)
   */
  async initiatePayment(bookingId: string): Promise<InitiatePaymentResponse> {
    const response = await api.post<InitiatePaymentResponse>(
      '/orders/payment/initiate',
      { bookingId },
    );
    return response.data;
  },

  /**
   * Confirmer le paiement (crée la commande et les billets)
   */
  async confirmPayment(
    bookingId: string,
    paymentId: string,
  ): Promise<ConfirmPaymentResponse> {
    const response = await api.post<ConfirmPaymentResponse>(
      '/orders/payment/confirm',
      { bookingId, paymentId },
    );
    return response.data;
  },

  /**
   * Récupérer toutes les commandes de l'utilisateur
   */
  async getMyOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders');
    return response.data;
  },

  /**
   * Récupérer une commande par son ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Demander un remboursement (passe la commande en "Remboursement demandé").
   */
  async requestRefund(orderId: string): Promise<Order> {
    const response = await api.patch<Order>(`/orders/${orderId}/refund`);
    return response.data;
  },

  async getRefundRequests(): Promise<OrderWithUser[]> {
    const response = await api.get<OrderWithUser[]>('/orders/refund-requests');
    return response.data;
  },

  async approveRefund(orderId: string): Promise<Order> {
    const response = await api.patch<Order>(`/orders/${orderId}/refund/approve`);
    return response.data;
  },

  async rejectRefund(orderId: string): Promise<Order> {
    const response = await api.patch<Order>(`/orders/${orderId}/refund/reject`);
    return response.data;
  },
};
