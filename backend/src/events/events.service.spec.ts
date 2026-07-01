import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { FollowsService } from '../follows/follows.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentService } from '../payment/payment.service';
import { MailService } from '../mail/mail.service';
import { CustomLoggerService } from '../logger/logger.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SortBy, PriceRange } from './dto/search-events.dto';
import { EventType } from './dto/create-event.dto';

describe('EventsService', () => {
  let service: EventsService;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    ticket: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      updateMany: jest.fn(),
    },
    ticketCategory: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    staffInvitation: {
      findMany: jest.fn(),
    },
    participationRequest: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockUploadService = { deleteImage: jest.fn() };
  const mockFollowsService = {
    getFollowerIds: jest.fn(),
    getFriendIds: jest.fn(),
    getFollowingIds: jest.fn(),
  };
  const mockNotificationsService = {
    createForManyUsers: jest.fn(),
    deleteByTypeAndRelatedIds: jest.fn(),
  };
  const mockPaymentService = { refundPayment: jest.fn() };
  const mockMailService = { sendEventCancellation: jest.fn() };
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockOrganizer = { id: 'user-1', email: 'org@test.com', username: 'organizer' };

  const futureDate = new Date(Date.now() + 86400000 * 30);
  const futureEndDate = new Date(Date.now() + 86400000 * 30 + 3600000);

  const mockCreateDto = {
    title: 'Test Event',
    description: 'A great event',
    location: 'Paris',
    address: '1 rue de la Paix',
    city: 'Paris',
    postal_code: '75001',
    country: 'France',
    latitude: 48.87,
    longitude: 2.33,
    image_url: null,
    image_public_id: null,
    event_date: futureDate.toISOString(),
    end_date: futureEndDate.toISOString(),
    type: EventType.PROFESSIONAL,
    category: 'MUSIC',
    ticket_categories: [
      { name: 'Standard', description: '', price: 20, initial_stock: 100 },
    ],
  };

  const mockEvent = {
    id: 'event-1',
    title: 'Test Event',
    description: 'A great event',
    location: 'Paris',
    address: '1 rue de la Paix',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    latitude: 48.87,
    longitude: 2.33,
    imageUrl: null,
    imagePublicId: null,
    eventDate: futureDate,
    endDate: futureEndDate,
    cancelledAt: null,
    cancelReason: null,
    organizerId: 'user-1',
    type: 'PROFESSIONAL',
    category: 'MUSIC',
    createdAt: new Date(),
    updatedAt: new Date(),
    organizer: mockOrganizer,
    ticketCategories: [
      { id: 'cat-1', name: 'Standard', description: '', price: 20, initialStock: 100, currentStock: 100 },
    ],
    reviews: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UploadService, useValue: mockUploadService },
        { provide: FollowsService, useValue: mockFollowsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: MailService, useValue: mockMailService },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ForbiddenException for CLIENT creating PROFESSIONAL event', async () => {
      await expect(
        service.create('user-1', mockCreateDto, 'CLIENT'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for PROFESSIONAL event without end_date', async () => {
      await expect(
        service.create('user-1', { ...mockCreateDto, end_date: undefined }, 'ORGANIZER'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when end_date <= event_date', async () => {
      await expect(
        service.create('user-1', {
          ...mockCreateDto,
          event_date: futureDate.toISOString(),
          end_date: new Date(futureDate.getTime() - 1000).toISOString(),
        }, 'ORGANIZER'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create event and notify followers/friends', async () => {
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.event.create.mockResolvedValue(mockEvent);
      mockFollowsService.getFollowerIds.mockResolvedValue(['follower-1']);
      mockFollowsService.getFriendIds.mockResolvedValue(['friend-1']);
      mockNotificationsService.createForManyUsers.mockResolvedValue({});

      const result = await service.create('user-1', mockCreateDto, 'ORGANIZER');
      expect(result.id).toBe('event-1');
      expect(mockNotificationsService.createForManyUsers).toHaveBeenCalled();
    });

    it('should create COMMUNITY event for CLIENT', async () => {
      const communityDto = { ...mockCreateDto, type: EventType.COMMUNITY, end_date: undefined };
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.event.create.mockResolvedValue({ ...mockEvent, type: 'COMMUNITY' });
      mockFollowsService.getFollowerIds.mockResolvedValue([]);
      mockFollowsService.getFriendIds.mockResolvedValue([]);

      const result = await service.create('user-1', communityDto, 'CLIENT');
      expect(result.type).toBe('COMMUNITY');
    });

    it('should notify friends differently from followers', async () => {
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.event.create.mockResolvedValue(mockEvent);
      mockFollowsService.getFollowerIds.mockResolvedValue(['user-2', 'user-3']);
      mockFollowsService.getFriendIds.mockResolvedValue(['user-2']);
      mockNotificationsService.createForManyUsers.mockResolvedValue({});

      await service.create('user-1', mockCreateDto, 'ORGANIZER');
      expect(mockNotificationsService.createForManyUsers).toHaveBeenCalledTimes(2);
    });

    it('should not notify if no followers or friends', async () => {
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.event.create.mockResolvedValue(mockEvent);
      mockFollowsService.getFollowerIds.mockResolvedValue([]);
      mockFollowsService.getFriendIds.mockResolvedValue([]);

      await service.create('user-1', mockCreateDto, 'ORGANIZER');
      expect(mockNotificationsService.createForManyUsers).not.toHaveBeenCalled();
    });

    it('should use email split as organizer name fallback', async () => {
      const eventNoUsername = {
        ...mockEvent,
        organizer: { id: 'user-1', email: 'org@test.com', username: null },
      };
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.event.create.mockResolvedValue(eventNoUsername);
      mockFollowsService.getFollowerIds.mockResolvedValue(['follower-1']);
      mockFollowsService.getFriendIds.mockResolvedValue([]);
      mockNotificationsService.createForManyUsers.mockResolvedValue({});

      await service.create('user-1', mockCreateDto, 'ORGANIZER');
      expect(mockNotificationsService.createForManyUsers).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ body: expect.stringContaining('org') }),
      );
    });
  });

  describe('findAll', () => {
    it('should return events with average ratings', async () => {
      const eventWithReviews = {
        ...mockEvent,
        reviews: [{ rating: 4 }, { rating: 5 }],
      };
      mockPrismaService.event.findMany.mockResolvedValue([eventWithReviews]);
      const result = await service.findAll();
      expect(result[0].averageRating).toBe(4.5);
      expect(result[0].totalReviews).toBe(2);
    });

    it('should return null averageRating when no reviews', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);
      const result = await service.findAll();
      expect(result[0].averageRating).toBeNull();
    });

    it('should apply search filter', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      await service.findAll({ search: 'concert' });
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should apply location filter', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      await service.findAll({ location: 'Paris' });
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should apply dateFrom filter', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      await service.findAll({ dateFrom: new Date().toISOString() });
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should apply dateTo filter', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      await service.findAll({ dateTo: new Date(Date.now() + 86400000).toISOString() });
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should ignore invalid date strings', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      await service.findAll({ dateFrom: 'not-a-date', dateTo: 'not-a-date' });
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return event with details', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      const result = await service.findOne('event-1');
      expect(result.id).toBe('event-1');
      expect(result.averageRating).toBeNull();
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should format eventDate as ISO string when it is a Date', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      const result = await service.findOne('event-1');
      expect(typeof result.eventDate).toBe('string');
    });

    it('should return eventDate as-is when it is a string', async () => {
      const eventWithStringDate = {
        ...mockEvent,
        eventDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-01T02:00:00.000Z',
      };
      mockPrismaService.event.findUnique.mockResolvedValue(eventWithStringDate);
      const result = await service.findOne('event-1');
      expect(result.eventDate).toBe('2026-01-01T00:00:00.000Z');
    });

    it('should compute averageRating with reviews', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        reviews: [{ rating: 3 }, { rating: 5 }],
      });
      const result = await service.findOne('event-1');
      expect(result.averageRating).toBe(4);
    });

    it('should handle null endDate', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockEvent, endDate: null });
      const result = await service.findOne('event-1');
      expect(result.endDate).toBeUndefined();
    });

    it('should handle non-Date cancelledAt', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        cancelledAt: '2025-01-01T00:00:00.000Z',
      });
      const result = await service.findOne('event-1');
      expect(result.cancelledAt).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.update('nonexistent', 'user-1', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      await expect(service.update('event-1', 'other-user', {})).rejects.toThrow(ForbiddenException);
    });

    it('should update event successfully', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.ticket.count.mockResolvedValue(0);
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        title: 'Updated Title',
        ticketCategories: mockEvent.ticketCategories,
      });
      mockPrismaService.ticket.findMany.mockResolvedValue([]);

      const result = await service.update('event-1', 'user-1', { title: 'Updated Title' });
      expect(result.title).toBe('Updated Title');
    });

    it('should delete old image when imageUrl changes', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        imageUrl: 'old-url',
        imagePublicId: 'old-public-id',
      });
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.ticket.count.mockResolvedValue(0);
      mockPrismaService.event.update.mockResolvedValue({ ...mockEvent, ticketCategories: [] });
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockUploadService.deleteImage.mockResolvedValue({});

      await service.update('event-1', 'user-1', { image_url: 'new-url' });
      expect(mockUploadService.deleteImage).toHaveBeenCalledWith('old-public-id');
    });

    it('should not fail if deleteImage throws', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        imageUrl: 'old-url',
        imagePublicId: 'old-public-id',
      });
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.ticket.count.mockResolvedValue(0);
      mockPrismaService.event.update.mockResolvedValue({ ...mockEvent, ticketCategories: [] });
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockUploadService.deleteImage.mockRejectedValue(new Error('CDN error'));

      await expect(service.update('event-1', 'user-1', { image_url: 'new-url' })).resolves.toBeDefined();
    });

    it('should throw BadRequestException for PROFESSIONAL event with end_date <= event_date', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        type: 'PROFESSIONAL',
      });

      await expect(
        service.update('event-1', 'user-1', {
          event_date: futureDate.toISOString(),
          end_date: new Date(futureDate.getTime() - 1000).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when PROFESSIONAL event has no end_date after update', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        type: 'PROFESSIONAL',
        endDate: null,
      });

      await expect(
        service.update('event-1', 'user-1', {
          event_date: new Date(Date.now() + 86400000 * 30).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update ticket categories when no paid tickets', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.ticket.count.mockResolvedValue(0);
      mockPrismaService.ticketCategory.findMany.mockResolvedValue([{ id: 'cat-1' }]);
      mockPrismaService.ticket.groupBy.mockResolvedValue([]);
      mockPrismaService.ticketCategory.deleteMany.mockResolvedValue({});
      mockPrismaService.event.update.mockResolvedValue({ ...mockEvent, ticketCategories: [] });
      mockPrismaService.ticket.findMany.mockResolvedValue([]);

      await service.update('event-1', 'user-1', {
        ticket_categories: [{ name: 'VIP', price: 50, initial_stock: 20 }],
      });
      expect(mockPrismaService.ticketCategory.deleteMany).toHaveBeenCalled();
    });

    it('should not touch ticket categories when paid tickets exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.ticket.count.mockResolvedValue(5);
      mockPrismaService.event.update.mockResolvedValue({ ...mockEvent, ticketCategories: mockEvent.ticketCategories });
      mockPrismaService.ticket.findMany.mockResolvedValue([]);

      await service.update('event-1', 'user-1', {
        ticket_categories: [{ name: 'VIP', price: 50, initial_stock: 20 }],
      });
      expect(mockPrismaService.ticketCategory.deleteMany).not.toHaveBeenCalled();
    });

    it('should notify participants when significant changes occur', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.ticket.count.mockResolvedValue(0);
      mockPrismaService.event.update.mockResolvedValue({ ...mockEvent, title: 'New Title', ticketCategories: [] });
      mockPrismaService.ticket.findMany.mockResolvedValue([
        { order: { userId: 'user-2' } },
      ]);
      mockNotificationsService.createForManyUsers.mockResolvedValue({});

      await service.update('event-1', 'user-1', { title: 'New Title' });
      expect(mockNotificationsService.createForManyUsers).toHaveBeenCalled();
    });

    it('should apply sold count to initial stock for categories', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) => fn(mockPrismaService));
      mockPrismaService.ticket.count.mockResolvedValue(0);
      mockPrismaService.ticketCategory.findMany.mockResolvedValue([{ id: 'cat-1' }]);
      mockPrismaService.ticket.groupBy.mockResolvedValue([
        { ticketCategoryId: 'cat-1', _count: { id: 5 } },
      ]);
      mockPrismaService.ticketCategory.deleteMany.mockResolvedValue({});
      mockPrismaService.event.update.mockResolvedValue({ ...mockEvent, ticketCategories: [] });
      mockPrismaService.ticket.findMany.mockResolvedValue([]);

      await service.update('event-1', 'user-1', {
        ticket_categories: [{ name: 'Standard', price: 20, initial_stock: 100 }],
      });
      expect(mockPrismaService.ticketCategory.deleteMany).toHaveBeenCalled();
    });
  });

  describe('cancelEvent', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.cancelEvent('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      await expect(service.cancelEvent('other-user', 'event-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already cancelled', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        cancelledAt: new Date(),
      });
      await expect(service.cancelEvent('user-1', 'event-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event already started', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        eventDate: new Date(Date.now() - 1000),
      });
      await expect(service.cancelEvent('user-1', 'event-1')).rejects.toThrow(BadRequestException);
    });

    it('should cancel event with refunds and notifications', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          userId: 'user-2',
          paymentIntentId: 'pi_test',
          user: { id: 'user-2', email: 'user@test.com', username: 'user2' },
        },
      ]);
      mockPaymentService.refundPayment.mockResolvedValue({ amount: 20 });
      mockPrismaService.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaService) => Promise<unknown>) => {
        mockPrismaService.order.update.mockResolvedValue({});
        mockPrismaService.ticket.updateMany.mockResolvedValue({});
        mockPrismaService.booking.findMany.mockResolvedValue([]);
        mockPrismaService.event.update.mockResolvedValue({});
        return fn(mockPrismaService);
      });
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockNotificationsService.createForManyUsers.mockResolvedValue({});
      mockMailService.sendEventCancellation.mockResolvedValue({});
      mockPrismaService.staffInvitation.findMany.mockResolvedValue([]);
      mockPrismaService.event.delete.mockResolvedValue({});

      const result = await service.cancelEvent('user-1', 'event-1', 'Test reason');
      expect(result.cancelledOrders).toBe(1);
      expect(result.totalRefunded).toBe(20);
    });

    it('should handle free orders without paymentIntentId', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          userId: 'user-2',
          paymentIntentId: null,
          user: { id: 'user-2', email: 'user@test.com', username: 'user2' },
        },
      ]);
      mockPrismaService.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaService) => Promise<unknown>) => {
        mockPrismaService.order.update.mockResolvedValue({});
        mockPrismaService.ticket.updateMany.mockResolvedValue({});
        mockPrismaService.booking.findMany.mockResolvedValue([]);
        mockPrismaService.event.update.mockResolvedValue({});
        return fn(mockPrismaService);
      });
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockNotificationsService.createForManyUsers.mockResolvedValue({});
      mockMailService.sendEventCancellation.mockResolvedValue({});
      mockPrismaService.staffInvitation.findMany.mockResolvedValue([]);
      mockPrismaService.event.delete.mockResolvedValue({});

      const result = await service.cancelEvent('user-1', 'event-1');
      expect(result.cancelledOrders).toBe(1);
      expect(result.totalRefunded).toBe(0);
    });

    it('should handle failed refunds gracefully', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          userId: 'user-2',
          paymentIntentId: 'pi_test',
          user: { id: 'user-2', email: 'user@test.com', username: 'user2' },
        },
      ]);
      mockPaymentService.refundPayment.mockRejectedValue(new Error('Stripe error'));
      mockPrismaService.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaService) => Promise<unknown>) => {
        mockPrismaService.booking.findMany.mockResolvedValue([]);
        mockPrismaService.event.update.mockResolvedValue({});
        return fn(mockPrismaService);
      });
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockNotificationsService.createForManyUsers.mockResolvedValue({});
      mockMailService.sendEventCancellation.mockResolvedValue({});
      mockPrismaService.staffInvitation.findMany.mockResolvedValue([]);
      mockPrismaService.event.delete.mockResolvedValue({});

      const result = await service.cancelEvent('user-1', 'event-1');
      expect(result.failedRefunds).toBe(1);
      expect(result.failedOrderIds).toContain('order-1');
    });

    it('should cancel pending bookings and restore stock', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaService) => Promise<unknown>) => {
        mockPrismaService.booking.findMany.mockResolvedValue([
          { id: 'booking-1', ticketCategoryId: 'cat-1', quantity: 2 },
        ]);
        mockPrismaService.booking.update.mockResolvedValue({});
        mockPrismaService.ticketCategory.update.mockResolvedValue({});
        mockPrismaService.event.update.mockResolvedValue({});
        return fn(mockPrismaService);
      });
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockNotificationsService.createForManyUsers.mockResolvedValue({});
      mockPrismaService.staffInvitation.findMany.mockResolvedValue([{ token: 'token-1' }]);
      mockNotificationsService.deleteByTypeAndRelatedIds.mockResolvedValue({});
      mockPrismaService.event.delete.mockResolvedValue({});

      await service.cancelEvent('user-1', 'event-1');
      expect(mockNotificationsService.deleteByTypeAndRelatedIds).toHaveBeenCalledWith(
        'STAFF_INVITATION',
        ['token-1'],
      );
    });

    it('should notify accepted participants of COMMUNITY event', async () => {
      const communityEvent = { ...mockEvent, type: 'COMMUNITY' };
      mockPrismaService.event.findUnique.mockResolvedValue(communityEvent);
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaService) => Promise<unknown>) => {
        mockPrismaService.booking.findMany.mockResolvedValue([]);
        mockPrismaService.event.update.mockResolvedValue({});
        return fn(mockPrismaService);
      });
      mockPrismaService.participationRequest.findMany.mockResolvedValue([
        { user: { id: 'user-3', email: 'user3@test.com', username: 'user3' } },
      ]);
      mockNotificationsService.createForManyUsers.mockResolvedValue({});
      mockMailService.sendEventCancellation.mockResolvedValue({});
      mockPrismaService.staffInvitation.findMany.mockResolvedValue([]);
      mockPrismaService.event.delete.mockResolvedValue({});

      const result = await service.cancelEvent('user-1', 'event-1');
      expect(result.notifiedUsers).toBeGreaterThan(0);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      await expect(service.remove('event-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });

    it('should delete event and clean up staff invitations', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.staffInvitation.findMany.mockResolvedValue([{ token: 'tok-1' }]);
      mockNotificationsService.deleteByTypeAndRelatedIds.mockResolvedValue({});
      mockPrismaService.event.delete.mockResolvedValue({});

      const result = await service.remove('event-1', 'user-1');
      expect(result.message).toContain('supprimé');
      expect(mockNotificationsService.deleteByTypeAndRelatedIds).toHaveBeenCalledWith(
        'STAFF_INVITATION',
        ['tok-1'],
      );
    });

    it('should skip deleteByTypeAndRelatedIds if no staff invitations', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.staffInvitation.findMany.mockResolvedValue([]);
      mockPrismaService.event.delete.mockResolvedValue({});

      await service.remove('event-1', 'user-1');
      expect(mockNotificationsService.deleteByTypeAndRelatedIds).not.toHaveBeenCalled();
    });
  });

  describe('searchEvents', () => {
    const mockSearchResult = {
      ...mockEvent,
      reviews: [],
      ticketCategories: [
        { name: 'Standard', price: 20, currentStock: 50, initialStock: 100 },
      ],
    };

    it('should return empty for myEvents without userId', async () => {
      const result = await service.searchEvents({ myEvents: true } as any);
      expect(result.events).toHaveLength(0);
    });

    it('should return empty for followedOnly without userId', async () => {
      const result = await service.searchEvents({ followedOnly: true } as any);
      expect(result.events).toHaveLength(0);
    });

    it('should return empty for friendsOnly without userId', async () => {
      const result = await service.searchEvents({ friendsOnly: true } as any);
      expect(result.events).toHaveLength(0);
    });

    it('should return empty for followedOnly when no following', async () => {
      mockFollowsService.getFollowingIds.mockResolvedValue([]);
      const result = await service.searchEvents({ followedOnly: true } as any, 'user-1');
      expect(result.events).toHaveLength(0);
    });

    it('should return empty for friendsOnly when no friends', async () => {
      mockFollowsService.getFriendIds.mockResolvedValue([]);
      const result = await service.searchEvents({ friendsOnly: true } as any, 'user-1');
      expect(result.events).toHaveLength(0);
    });

    it('should search events with pagination', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockSearchResult]);
      mockPrismaService.event.count.mockResolvedValue(1);
      const result = await service.searchEvents({ page: 1, limit: 10 } as any);
      expect(result.events).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by myEvents with userId', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockSearchResult]);
      mockPrismaService.event.count.mockResolvedValue(1);
      const result = await service.searchEvents({ myEvents: true } as any, 'user-1');
      expect(result.events).toHaveLength(1);
    });

    it('should filter by followedOnly with userId', async () => {
      mockFollowsService.getFollowingIds.mockResolvedValue(['organizer-1']);
      mockPrismaService.event.findMany.mockResolvedValue([mockSearchResult]);
      mockPrismaService.event.count.mockResolvedValue(1);
      const result = await service.searchEvents({ followedOnly: true } as any, 'user-1');
      expect(result.events).toHaveLength(1);
    });

    it('should filter by friendsOnly with userId', async () => {
      mockFollowsService.getFriendIds.mockResolvedValue(['friend-1']);
      mockPrismaService.event.findMany.mockResolvedValue([mockSearchResult]);
      mockPrismaService.event.count.mockResolvedValue(1);
      const result = await service.searchEvents({ friendsOnly: true } as any, 'user-1');
      expect(result.events).toHaveLength(1);
    });

    it('should use distance path when lat/lon + DISTANCE_ASC', async () => {
      const eventsRaw = [{
        ...mockSearchResult,
        latitude: 48.87,
        longitude: 2.33,
        endDate: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];
      mockPrismaService.event.findMany.mockResolvedValue(eventsRaw);

      const result = await service.searchEvents({
        latitude: 48.87,
        longitude: 2.33,
        sortBy: SortBy.DISTANCE_ASC,
      } as any);
      expect(result.events[0]).toHaveProperty('distance');
    });

    it('should filter by radiusKm in distance path', async () => {
      const nearEvent = {
        ...mockSearchResult,
        latitude: 48.87,
        longitude: 2.33,
        endDate: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const farEvent = {
        ...mockSearchResult,
        id: 'event-far',
        latitude: 51.5,
        longitude: -0.12,
        endDate: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.event.findMany.mockResolvedValue([nearEvent, farEvent]);

      const result = await service.searchEvents({
        latitude: 48.87,
        longitude: 2.33,
        radiusKm: 10,
        sortBy: SortBy.DATE_ASC,
      } as any);
      expect(result.events.length).toBeLessThan(2);
    });

    it('should include distance in non-distance search when user coords provided', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([{
        ...mockSearchResult,
        latitude: 48.87,
        longitude: 2.33,
        endDate: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
      mockPrismaService.event.count.mockResolvedValue(1);

      const result = await service.searchEvents({
        latitude: 48.87,
        longitude: 2.33,
        sortBy: SortBy.DATE_ASC,
      } as any);
      expect(result.events[0]).toHaveProperty('distance');
    });

    it('should apply all priceRange conditions', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);
      await service.searchEvents({
        priceRanges: [PriceRange.FREE, PriceRange.LOW, PriceRange.MEDIUM, PriceRange.HIGH, PriceRange.PREMIUM],
      } as any);
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should handle DATE_DESC sort', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);
      await service.searchEvents({ sortBy: SortBy.DATE_DESC } as any);
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should handle PRICE_ASC and PRICE_DESC sort', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);
      await service.searchEvents({ sortBy: SortBy.PRICE_ASC } as any);
      await service.searchEvents({ sortBy: SortBy.PRICE_DESC } as any);
      expect(mockPrismaService.event.findMany).toHaveBeenCalledTimes(2);
    });

    it('should handle POPULARITY sort', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);
      await service.searchEvents({ sortBy: SortBy.POPULARITY } as any);
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should clamp page and limit values', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);
      const result = await service.searchEvents({ page: -1, limit: 200 } as any);
      expect(result.pagination.limit).toBe(100);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter events without coordinates in distance path', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([{
        ...mockSearchResult,
        latitude: null,
        longitude: null,
        endDate: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);

      const result = await service.searchEvents({
        latitude: 48.87,
        longitude: 2.33,
        sortBy: SortBy.DISTANCE_ASC,
      } as any);
      expect(result.events).toHaveLength(0);
    });

    it('should handle query filter', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);
      await service.searchEvents({ query: 'concert' } as any);
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should handle city filter', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);
      await service.searchEvents({ city: 'Paris' } as any);
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should handle dateFrom and dateTo in searchEvents', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);
      await service.searchEvents({
        dateFrom: new Date().toISOString(),
        dateTo: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should handle empty AND conditions', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);
      await service.searchEvents({} as any);
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return empty array for short query', async () => {
      const result = await service.getSearchSuggestions('a');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty query', async () => {
      const result = await service.getSearchSuggestions('');
      expect(result).toEqual([]);
    });

    it('should return empty array for null query', async () => {
      const result = await service.getSearchSuggestions(null as any);
      expect(result).toEqual([]);
    });

    it('should return suggestions for valid query', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Concert', location: 'Paris' },
      ]);
      const result = await service.getSearchSuggestions('conc');
      expect(result[0].label).toBe('Concert');
      expect(result[0].sublabel).toBe('Paris');
    });
  });

  describe('getAvailableLocations', () => {
    it('should return locations with counts', async () => {
      mockPrismaService.event.groupBy.mockResolvedValue([
        { location: 'Paris', _count: { location: 5 } },
      ]);
      const result = await service.getAvailableLocations();
      expect(result[0].name).toBe('Paris');
      expect(result[0].count).toBe(5);
    });
  });

  describe('getAvailableCities', () => {
    it('should return cities with counts excluding nulls', async () => {
      mockPrismaService.event.groupBy.mockResolvedValue([
        { city: 'Paris', _count: { city: 3 } },
        { city: null, _count: { city: 1 } },
      ]);
      const result = await service.getAvailableCities();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Paris');
    });
  });
});
