import { api } from './api';
import type { Booking, CreateBookingDto } from '../types/booking.types';

export const bookingService = {
  createBooking: async (dto: CreateBookingDto): Promise<Booking> => {
    const response = await api.post<Booking>('/bookings', dto);
    return response.data;
  },

  getUserBookings: async (): Promise<Booking[]> => {
    const response = await api.get<Booking[]>('/bookings');
    return response.data;
  },

  confirmBooking: async (bookingId: string): Promise<Booking> => {
    const response = await api.patch<Booking>(`/bookings/${bookingId}/confirm`);
    return response.data;
  },

  cancelBooking: async (bookingId: string): Promise<Booking> => {
    const response = await api.delete<Booking>(`/bookings/${bookingId}`);
    return response.data;
  },
};
