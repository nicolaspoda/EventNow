import type { Event, TicketCategory } from './event.types';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';

export interface Booking {
  id: string;
  userId: string;
  ticketCategoryId: string;
  quantity: number;
  status: BookingStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  ticketCategory?: TicketCategory & {
    event?: Event;
  };
}

export interface CreateBookingDto {
  ticketCategoryId: string;
  quantity: number;
}
