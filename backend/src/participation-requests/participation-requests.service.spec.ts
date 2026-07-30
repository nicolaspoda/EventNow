import { Test, TestingModule } from '@nestjs/testing';
import { ParticipationRequestsService } from './participation-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventType, ParticipationRequestStatus } from '@prisma/client';

describe('ParticipationRequestsService', () => {
  let service: ParticipationRequestsService;

  const mockTx = {
    ticketCategory: { update: jest.fn() },
    participationRequest: { update: jest.fn() },
    notification: { create: jest.fn() },
  };

  const mockPrismaService = {
    event: { findUnique: jest.fn(), findMany: jest.fn() },
    participationRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    notification: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  const mockMessagesGateway = {
    emitNewNotificationToUser: jest.fn(),
  };

  const mockCommunityEvent = {
    id: 'event-1',
    type: EventType.COMMUNITY,
    organizerId: 'organizer-1',
    ticketCategories: [],
  };

  const mockRequest = {
    id: 'req-1',
    eventId: 'event-1',
    userId: 'user-1',
    message: 'Hello',
    status: ParticipationRequestStatus.PENDING,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    respondedAt: null,
    event: { title: 'Test Event', organizerId: 'organizer-1', ticketCategories: [] },
    user: { id: 'user-1', email: 'user@example.com', username: 'user1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipationRequestsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: MessagesGateway, useValue: mockMessagesGateway },
      ],
    }).compile();

    service = module.get<ParticipationRequestsService>(ParticipationRequestsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.create('user-1', { eventId: 'event-1', message: 'Hi' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if event is not COMMUNITY type', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, type: EventType.PROFESSIONAL });
      await expect(service.create('user-1', { eventId: 'event-1', message: 'Hi' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is the organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      await expect(service.create('organizer-1', { eventId: 'event-1', message: 'Hi' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if PENDING request already exists', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: ParticipationRequestStatus.PENDING,
      });
      await expect(service.create('user-1', { eventId: 'event-1', message: 'Hi' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if ACCEPTED request already exists', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: ParticipationRequestStatus.ACCEPTED,
      });
      await expect(service.create('user-1', { eventId: 'event-1', message: 'Hi' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if REFUSED request already exists', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: ParticipationRequestStatus.REFUSED,
      });
      await expect(service.create('user-1', { eventId: 'event-1', message: 'Hi' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no more spots available', async () => {
      const eventWithCategory = {
        ...mockCommunityEvent,
        ticketCategories: [{ name: 'Participation', currentStock: 2 }],
      };
      mockPrismaService.event.findUnique.mockResolvedValue(eventWithCategory);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      mockPrismaService.participationRequest.count.mockResolvedValue(2);
      await expect(service.create('user-1', { eventId: 'event-1', message: 'Hi' })).rejects.toThrow(BadRequestException);
    });

    it('should create request successfully with username notification', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      mockPrismaService.participationRequest.count.mockResolvedValue(0);
      mockPrismaService.participationRequest.create.mockResolvedValue({
        ...mockRequest,
        user: { email: 'user@example.com', username: 'user1' },
        event: { title: 'Test Event' },
      });
      mockNotificationsService.create.mockResolvedValue({});
      await service.create('user-1', { eventId: 'event-1', message: 'Hi' });
      expect(mockPrismaService.participationRequest.create).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });

    it('should use email as requester label when username is null', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      mockPrismaService.participationRequest.count.mockResolvedValue(0);
      mockPrismaService.participationRequest.create.mockResolvedValue({
        ...mockRequest,
        user: { email: 'user@example.com', username: null },
        event: { title: 'Test Event' },
      });
      mockNotificationsService.create.mockResolvedValue({});
      await service.create('user-1', { eventId: 'event-1', message: 'Hi' });
      const notifCall = mockNotificationsService.create.mock.calls[0][0];
      expect(notifCall.body).toContain('user@example.com');
    });

    it('should allow request when no Participation category exists', async () => {
      const eventWithOtherCategory = {
        ...mockCommunityEvent,
        ticketCategories: [{ name: 'VIP', currentStock: 10 }],
      };
      mockPrismaService.event.findUnique.mockResolvedValue(eventWithOtherCategory);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      mockPrismaService.participationRequest.count.mockResolvedValue(100);
      mockPrismaService.participationRequest.create.mockResolvedValue({
        ...mockRequest,
        user: { email: 'user@example.com', username: 'user1' },
        event: { title: 'Test Event' },
      });
      mockNotificationsService.create.mockResolvedValue({});
      await service.create('user-1', { eventId: 'event-1', message: 'Hi' });
      expect(mockPrismaService.participationRequest.create).toHaveBeenCalled();
    });
  });

  describe('getByEvent', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.getByEvent('event-1', 'organizer-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, organizerId: 'organizer-1' });
      await expect(service.getByEvent('event-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });

    it('should return requests with ISO dates', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([
        { ...mockRequest, respondedAt: new Date('2024-01-02') },
      ]);
      const result = await service.getByEvent('event-1', 'organizer-1');
      expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result[0].respondedAt).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should return null respondedAt when not set', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([mockRequest]);
      const result = await service.getByEvent('event-1', 'organizer-1');
      expect(result[0].respondedAt).toBeNull();
    });
  });

  describe('resolveEventIdForNotification', () => {
    it('should return eventId if relatedId is a valid event for this organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event-1', organizerId: 'organizer-1' });
      const result = await service.resolveEventIdForNotification('event-1', 'organizer-1');
      expect(result).toEqual({ eventId: 'event-1' });
    });

    it('should fall through to request lookup if event not found or not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        eventId: 'event-1',
        event: { organizerId: 'organizer-1' },
      });
      const result = await service.resolveEventIdForNotification('req-1', 'organizer-1');
      expect(result).toEqual({ eventId: 'event-1' });
    });

    it('should throw NotFoundException if neither event nor request found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      await expect(service.resolveEventIdForNotification('bad-id', 'organizer-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if request found but wrong organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        eventId: 'event-1',
        event: { organizerId: 'other-organizer' },
      });
      await expect(service.resolveEventIdForNotification('req-1', 'organizer-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyRequests', () => {
    it('should return requests for user', async () => {
      mockPrismaService.participationRequest.findMany.mockResolvedValue([mockRequest]);
      const result = await service.getMyRequests('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getMyRequestForEvent', () => {
    it('should return request for specific event', async () => {
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(mockRequest);
      const result = await service.getMyRequestForEvent('event-1', 'user-1');
      expect(result).toBeDefined();
    });

    it('should return null if no request', async () => {
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      const result = await service.getMyRequestForEvent('event-1', 'user-1');
      expect(result).toBeNull();
    });
  });

  describe('getPendingRequestsForOrganizer', () => {
    it('should return empty array if organizer has no events', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      const result = await service.getPendingRequestsForOrganizer('organizer-1');
      expect(result).toEqual([]);
    });

    it('should return pending requests with ISO dates', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([{ id: 'event-1', title: 'T', eventDate: pastDate }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([mockRequest]);
      const result = await service.getPendingRequestsForOrganizer('organizer-1');
      expect(result).toHaveLength(1);
      expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    const pastDate = new Date('2024-01-01');
  });

  describe('respond', () => {
    it('should throw NotFoundException if request not found', async () => {
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      await expect(service.respond('req-1', 'organizer-1', { action: 'ACCEPT' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer', async () => {
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(mockRequest);
      await expect(service.respond('req-1', 'other-user', { action: 'ACCEPT' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if request already processed', async () => {
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: ParticipationRequestStatus.ACCEPTED,
      });
      await expect(service.respond('req-1', 'organizer-1', { action: 'ACCEPT' })).rejects.toThrow(BadRequestException);
    });

    it('should accept request via transaction', async () => {
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        return fn(mockTx);
      });
      mockTx.participationRequest.update.mockResolvedValue({
        ...mockRequest,
        status: ParticipationRequestStatus.ACCEPTED,
        event: { title: 'Test Event' },
        user: { id: 'user-1', email: 'u@test.com', username: 'user1' },
      });
      mockTx.notification.create.mockResolvedValue({});
      await service.respond('req-1', 'organizer-1', { action: 'ACCEPT' });
      expect(mockTx.participationRequest.update).toHaveBeenCalled();
    });

    it('should refuse request via transaction', async () => {
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        return fn(mockTx);
      });
      mockTx.participationRequest.update.mockResolvedValue({
        ...mockRequest,
        status: ParticipationRequestStatus.REFUSED,
        event: { title: 'Test Event' },
        user: { id: 'user-1', email: 'u@test.com', username: 'user1' },
      });
      mockTx.notification.create.mockResolvedValue({});
      await service.respond('req-1', 'organizer-1', { action: 'REFUSE' });
      expect(mockTx.participationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ParticipationRequestStatus.REFUSED }),
        }),
      );
    });

    it('should decrement stock when accepting with participation category', async () => {
      const requestWithCategory = {
        ...mockRequest,
        event: {
          organizerId: 'organizer-1',
          ticketCategories: [{ id: 'cat-1', name: 'Participation', currentStock: 2 }],
        },
      };
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(requestWithCategory);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.ticketCategory.update.mockResolvedValue({});
      mockTx.participationRequest.update.mockResolvedValue({
        ...requestWithCategory,
        event: { title: 'Test Event' },
        user: { id: 'user-1', email: 'u@test.com', username: 'user1' },
      });
      mockTx.notification.create.mockResolvedValue({});
      await service.respond('req-1', 'organizer-1', { action: 'ACCEPT' });
      expect(mockTx.ticketCategory.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { currentStock: { decrement: 1 } } }),
      );
    });

    it('should throw BadRequestException if no stock left when accepting', async () => {
      const requestWithCategory = {
        ...mockRequest,
        event: {
          organizerId: 'organizer-1',
          ticketCategories: [{ id: 'cat-1', name: 'Participation', currentStock: 0 }],
        },
      };
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(requestWithCategory);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      await expect(service.respond('req-1', 'organizer-1', { action: 'ACCEPT' })).rejects.toThrow(BadRequestException);
    });
  });
});
