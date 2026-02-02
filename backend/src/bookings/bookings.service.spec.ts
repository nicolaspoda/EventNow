import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

describe('BookingsService', () => {
  let service: BookingsService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ticketCategory: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockRedisService = {
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
    withLock: jest.fn(),
  };

  const mockCategory = {
    id: 'category-1',
    eventId: 'event-1',
    name: 'VIP',
    description: 'VIP access',
    price: 100,
    initialStock: 50,
    currentStock: 10,
    event: {
      id: 'event-1',
      title: 'Test Event',
      eventDate: new Date('2026-12-31'),
    },
  };

  const mockBooking = {
    id: 'booking-1',
    userId: 'user-1',
    ticketCategoryId: 'category-1',
    quantity: 2,
    status: BookingStatus.PENDING,
    expiresAt: new Date(Date.now() + 600000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ticketCategory: mockCategory,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    const createDto = {
      ticketCategoryId: 'category-1',
      quantity: 2,
    };

    it('should create a booking with lock and transaction', async () => {
      mockRedisService.withLock.mockImplementation((key, callback) =>
        callback(),
      );
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.ticketCategory.findUnique.mockResolvedValue(
        mockCategory,
      );
      mockPrismaService.ticketCategory.update.mockResolvedValue({
        ...mockCategory,
        currentStock: 8,
      });
      mockPrismaService.booking.create.mockResolvedValue(mockBooking);

      const result = await service.createBooking('user-1', createDto);

      expect(result).toEqual(mockBooking);
      expect(mockRedisService.withLock).toHaveBeenCalledWith(
        'booking:category:category-1',
        expect.any(Function),
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockRedisService.withLock.mockImplementation((key, callback) =>
        callback(),
      );
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.ticketCategory.findUnique.mockResolvedValue(null);

      await expect(service.createBooking('user-1', createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      mockRedisService.withLock.mockImplementation((key, callback) =>
        callback(),
      );
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.ticketCategory.findUnique.mockResolvedValue({
        ...mockCategory,
        currentStock: 1,
      });

      await expect(
        service.createBooking('user-1', { ...createDto, quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if stock depleted during transaction', async () => {
      mockRedisService.withLock.mockImplementation((key, callback) =>
        callback(),
      );
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.ticketCategory.findUnique.mockResolvedValue(
        mockCategory,
      );
      mockPrismaService.ticketCategory.update.mockResolvedValue(null);

      await expect(service.createBooking('user-1', createDto)).rejects.toThrow(
        'Stock épuisé pendant la réservation',
      );
    });
  });

  describe('confirmBooking', () => {
    it('should confirm a pending booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.confirmBooking('booking-1', 'user-1');

      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.CONFIRMED },
      });
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmBooking('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking already processed', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        service.confirmBooking('booking-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking expired', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.confirmBooking('booking-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking and restore stock', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.ticketCategory.update.mockResolvedValue({
        ...mockCategory,
        currentStock: 12,
      });
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancelBooking('booking-1', 'user-1');

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(mockPrismaService.ticketCategory.update).toHaveBeenCalledWith({
        where: { id: 'category-1' },
        data: { currentStock: { increment: 2 } },
      });
    });

    it('should throw BadRequestException if booking is confirmed', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        service.cancelBooking('booking-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if booking not found during cancel', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelBooking('booking-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if booking not owned by user during cancel', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        userId: 'other-user',
      });

      await expect(
        service.cancelBooking('booking-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('expireOldBookings', () => {
    it('should expire old pending bookings and restore stock', async () => {
      const expiredBooking = {
        ...mockBooking,
        expiresAt: new Date(Date.now() - 1000),
      };

      mockPrismaService.booking.findMany.mockResolvedValue([expiredBooking]);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.ticketCategory.update.mockResolvedValue(mockCategory);
      mockPrismaService.booking.update.mockResolvedValue({
        ...expiredBooking,
        status: BookingStatus.EXPIRED,
      });

      const result = await service.expireOldBookings();

      expect(result.expired).toBe(1);
      expect(mockPrismaService.ticketCategory.update).toHaveBeenCalledWith({
        where: { id: 'category-1' },
        data: { currentStock: { increment: 2 } },
      });
    });

    it('should return zero if no expired bookings', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      const result = await service.expireOldBookings();

      expect(result.expired).toBe(0);
    });
  });

  describe('getUserBookings', () => {
    it('should return all bookings for user', async () => {
      const bookings = [mockBooking, { ...mockBooking, id: 'booking-2' }];
      mockPrismaService.booking.findMany.mockResolvedValue(bookings);

      const result = await service.getUserBookings('user-1');

      expect(result).toEqual(bookings);
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
