import type { TicketCategory } from './event.types';

export type OrderStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'REFUND_REQUESTED';

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: OrderStatus;
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  ticketCategory?: TicketCategory;
  tickets?: Ticket[];
  quantity?: number;
  ticketCategoryId?: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  ticketCategoryId?: string;
  ticketCategory?: TicketCategory;
  qrCode: string;
  isValidated?: boolean;
  validatedAt?: string | null;
  createdAt: string;
  order?: Order;
}

export interface ConfirmPaymentResponse {
  order: Order;
  tickets: Ticket[];
  event?: { id: string; title: string; eventDate: string; location: string };
}

export interface OrderWithUser extends Order {
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface ValidateTicketDto {
  qrCode: string;
}

export interface ValidateTicketResponse {
  ticket: Ticket;
  message: string;
}
