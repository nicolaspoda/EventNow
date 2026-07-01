import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingStatus } from '@prisma/client';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBookingsService = {
    createBooking: jest.fn(),
    getUserBookings: jest.fn(),
    confirmBooking: jest.fn(),
    cancelBooking: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    role: 'USER',
  };

  const mockBooking = {
    id: 'booking-1',
    userId: 'user-1',
    ticketCategoryId: 'category-1',
    quantity: 2,
    status: BookingStatus.PENDING,
    expiresAt: new Date(Date.now() + 600000),
    ticketCategory: {
      id: 'category-1',
      name: 'VIP',
      price: 100,
      event: {
        id: 'event-1',
        title: 'Test Event',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      ticketCategoryId: 'category-1',
      quantity: 2,
    };

    it('should create a booking', async () => {
      mockBookingsService.createBooking.mockResolvedValue(mockBooking);

      const result = await controller.create(mockUser, createDto);

      expect(result).toEqual(mockBooking);
      expect(service.createBooking).toHaveBeenCalledWith(
        mockUser.id,
        createDto,
      );
    });
  });

  describe('getUserBookings', () => {
    it('should return user bookings', async () => {
      mockBookingsService.getUserBookings.mockResolvedValue([mockBooking]);

      const result = await controller.getUserBookings(mockUser);

      expect(result).toEqual([mockBooking]);
      expect(service.getUserBookings).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('confirm', () => {
    it('should confirm a booking', async () => {
      const confirmedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      };
      mockBookingsService.confirmBooking.mockResolvedValue(confirmedBooking);

      const result = await controller.confirm('booking-1', mockUser);

      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(service.confirmBooking).toHaveBeenCalledWith(
        'booking-1',
        mockUser.id,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a booking', async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };
      mockBookingsService.cancelBooking.mockResolvedValue(cancelledBooking);

      const result = await controller.cancel('booking-1', mockUser);

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(service.cancelBooking).toHaveBeenCalledWith(
        'booking-1',
        mockUser.id,
      );
    });
  });
});
