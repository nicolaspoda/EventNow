import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookingService } from '../services/bookingService';
import { api } from '../services/api';
import type { Booking, CreateBookingDto } from '../types/booking.types';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const booking: Booking = {
  id: 'b1',
  userId: 'u1',
  ticketCategoryId: 'tc1',
  quantity: 2,
  status: 'PENDING',
  expiresAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('bookingService', () => {
  it('createBooking posts the dto and returns the created booking', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: booking });
    const dto: CreateBookingDto = { ticketCategoryId: 'tc1', quantity: 2 };

    const result = await bookingService.createBooking(dto);

    expect(api.post).toHaveBeenCalledWith('/bookings', dto);
    expect(result).toEqual(booking);
  });

  it('getUserBookings fetches the user bookings list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [booking] });

    const result = await bookingService.getUserBookings();

    expect(api.get).toHaveBeenCalledWith('/bookings');
    expect(result).toEqual([booking]);
  });

  it('confirmBooking patches the confirm endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: booking });

    const result = await bookingService.confirmBooking('b1');

    expect(api.patch).toHaveBeenCalledWith('/bookings/b1/confirm');
    expect(result).toEqual(booking);
  });

  it('cancelBooking deletes the booking by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: booking });

    const result = await bookingService.cancelBooking('b1');

    expect(api.delete).toHaveBeenCalledWith('/bookings/b1');
    expect(result).toEqual(booking);
  });
});
