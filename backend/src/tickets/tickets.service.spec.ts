import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TicketsService', () => {
  let service: TicketsService;

  const mockPrismaService = {
    ticket: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    eventStaff: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const futureDate = new Date(Date.now() + 86400000);
  const pastDate = new Date(Date.now() - 86400000);

  const mockTicket = {
    id: 'ticket-1',
    qrCode: 'TICKET-ABC123',
    validatedAt: null,
    createdAt: new Date(),
    ticketCategoryId: 'cat-1',
    ticketCategory: {
      id: 'cat-1',
      name: 'Standard',
      event: {
        id: 'event-1',
        title: 'Test Event',
        eventDate: futureDate,
        endDate: null,
        location: 'Paris',
        organizerId: 'org-1',
      },
    },
    order: {
      id: 'order-1',
      status: 'PAID',
      userId: 'user-1',
      user: { id: 'user-1', email: 'user@test.com' },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    jest.clearAllMocks();
  });

  describe('validateTicket', () => {
    it('should return invalid result when ticket not found', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      const result = await service.validateTicket('INVALID-QR', 'staff-1');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('QR_CODE_INVALID');
    });

    it('should throw ForbiddenException if staff not authorized for event', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      await expect(service.validateTicket('TICKET-ABC123', 'staff-1')).rejects.toThrow(ForbiddenException);
    });

    it('should return ALREADY_VALIDATED for already validated ticket', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        validatedAt: new Date(),
      });
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'staff-1' });
      const result = await service.validateTicket('TICKET-ABC123', 'staff-1');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('ALREADY_VALIDATED');
    });

    it('should return ORDER_CANCELLED for cancelled order', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        order: { ...mockTicket.order, status: 'CANCELLED' },
      });
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'staff-1' });
      const result = await service.validateTicket('TICKET-ABC123', 'staff-1');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('ORDER_CANCELLED');
      expect(result.message).toBe('Commande annulée');
    });

    it('should return ORDER_CANCELLED for refunded order', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        order: { ...mockTicket.order, status: 'REFUNDED' },
      });
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'staff-1' });
      const result = await service.validateTicket('TICKET-ABC123', 'staff-1');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('ORDER_CANCELLED');
      expect(result.message).toBe('Commande remboursée');
    });

    it('should return EVENT_NOT_STARTED when too early', async () => {
      const farFutureEvent = { ...mockTicket.ticketCategory.event, eventDate: new Date(Date.now() + 7200000) };
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        ticketCategory: { ...mockTicket.ticketCategory, event: farFutureEvent },
      });
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'staff-1' });
      const result = await service.validateTicket('TICKET-ABC123', 'staff-1');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('EVENT_NOT_STARTED');
    });

    it('should validate ticket successfully', async () => {
      const startedEvent = { ...mockTicket.ticketCategory.event, eventDate: new Date(Date.now() - 1800000) };
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        ticketCategory: { ...mockTicket.ticketCategory, event: startedEvent },
      });
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'staff-1' });
      mockPrismaService.ticket.update.mockResolvedValue({
        ...mockTicket,
        validatedAt: new Date(),
        ticketCategory: {
          ...mockTicket.ticketCategory,
          event: startedEvent,
        },
        order: { ...mockTicket.order, user: { email: 'user@test.com' } },
      });
      const result = await service.validateTicket('TICKET-ABC123', 'staff-1');
      expect(result.valid).toBe(true);
      expect(result.reason).toBe('SUCCESS');
    });

    it('should return EVENT_ENDED in production when event is over', async () => {
      const pastEndDate = new Date(Date.now() - 3600000);
      const startedEvent = {
        ...mockTicket.ticketCategory.event,
        eventDate: new Date(Date.now() - 7200000),
        endDate: pastEndDate,
      };
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        ticketCategory: { ...mockTicket.ticketCategory, event: startedEvent },
      });
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'staff-1' });
      const result = await service.validateTicket('TICKET-ABC123', 'staff-1');
      expect(result.reason).toBe('EVENT_ENDED');
      process.env.NODE_ENV = originalEnv;
    });

    it('should try original qrCode when normalized differs and first lookup fails', async () => {
      mockPrismaService.ticket.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      // Unicode dash causes normalization difference
      const result = await service.validateTicket('TICKET‐ABC', 'staff-1');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('QR_CODE_INVALID');
    });
  });

  describe('getStaffValidations', () => {
    it('should return empty array if staff has no events', async () => {
      mockPrismaService.eventStaff.findMany.mockResolvedValue([]);
      const result = await service.getStaffValidations('staff-1');
      expect(result).toEqual([]);
    });

    it('should throw ForbiddenException if eventId not in staff events', async () => {
      mockPrismaService.eventStaff.findMany.mockResolvedValue([{ eventId: 'event-1' }]);
      await expect(service.getStaffValidations('staff-1', 'event-2')).rejects.toThrow(ForbiddenException);
    });

    it('should return validated tickets for staff', async () => {
      mockPrismaService.eventStaff.findMany.mockResolvedValue([{ eventId: 'event-1' }]);
      mockPrismaService.ticket.findMany.mockResolvedValue([
        {
          ...mockTicket,
          validatedAt: new Date(),
          order: { user: { email: 'user@test.com' } },
        },
      ]);
      const result = await service.getStaffValidations('staff-1');
      expect(result).toHaveLength(1);
    });

    it('should filter by specific eventId when authorized', async () => {
      mockPrismaService.eventStaff.findMany.mockResolvedValue([{ eventId: 'event-1' }]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      await service.getStaffValidations('staff-1', 'event-1');
      expect(mockPrismaService.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ticketCategory: { eventId: 'event-1' } }),
        }),
      );
    });
  });

  describe('getValidationStats', () => {
    it('should throw ForbiddenException if not staff', async () => {
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      await expect(service.getValidationStats('event-1', 'staff-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1' });
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.getValidationStats('event-1', 'staff-1')).rejects.toThrow(NotFoundException);
    });

    it('should return validation stats', async () => {
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1' });
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        title: 'Test',
        eventDate: new Date(),
        ticketCategories: [{ id: 'cat-1', initialStock: 100, currentStock: 70 }],
      });
      mockPrismaService.ticket.count.mockResolvedValue(20);
      const result = await service.getValidationStats('event-1', 'staff-1');
      expect(result.stats.totalSold).toBe(30);
      expect(result.stats.validated).toBe(20);
      expect(result.stats.pending).toBe(10);
      expect(result.stats.validationRate).toBe(67);
    });

    it('should return 0 validationRate when totalSold is 0', async () => {
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1' });
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        title: 'Test',
        eventDate: new Date(),
        ticketCategories: [{ id: 'cat-1', initialStock: 100, currentStock: 100 }],
      });
      mockPrismaService.ticket.count.mockResolvedValue(0);
      const result = await service.getValidationStats('event-1', 'staff-1');
      expect(result.stats.validationRate).toBe(0);
    });
  });

  describe('removeStaffForEndedEvents', () => {
    it('should delete staff for ended events', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([{ id: 'event-old' }]);
      mockPrismaService.eventStaff.deleteMany.mockResolvedValue({ count: 1 });
      await service.removeStaffForEndedEvents();
      expect(mockPrismaService.eventStaff.deleteMany).toHaveBeenCalled();
    });

    it('should do nothing if no ended events', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      await service.removeStaffForEndedEvents();
      expect(mockPrismaService.eventStaff.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('getStaffEvents', () => {
    it('should return upcoming events and skip cleanup when throttled', async () => {
      (service as any).lastStaffCleanupAt = Date.now();
      mockPrismaService.eventStaff.findMany.mockResolvedValue([
        { event: { id: 'event-1', title: 'Future', eventDate: futureDate, endDate: null } },
        { event: { id: 'event-2', title: 'Past', eventDate: pastDate, endDate: null } },
      ]);
      const result = await service.getStaffEvents('staff-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('event-1');
      expect(mockPrismaService.event.findMany).not.toHaveBeenCalled();
    });

    it('should run cleanup when throttle expires', async () => {
      (service as any).lastStaffCleanupAt = 0;
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.eventStaff.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.eventStaff.findMany.mockResolvedValue([]);
      await service.getStaffEvents('staff-1');
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should include event with future endDate even if eventDate is past', async () => {
      (service as any).lastStaffCleanupAt = Date.now();
      mockPrismaService.eventStaff.findMany.mockResolvedValue([
        { event: { id: 'event-1', title: 'Test', eventDate: pastDate, endDate: new Date(Date.now() + 3600000) } },
      ]);
      const result = await service.getStaffEvents('staff-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getUserTickets', () => {
    it('should return user tickets with serialized dates', async () => {
      const ticketWithDates = {
        ...mockTicket,
        ticketCategory: {
          ...mockTicket.ticketCategory,
          event: {
            ...mockTicket.ticketCategory.event,
            eventDate: new Date('2025-06-01'),
            endDate: new Date('2025-06-01T06:00:00.000Z'),
          },
        },
        order: { status: 'PAID' },
      };
      mockPrismaService.ticket.findMany.mockResolvedValue([ticketWithDates]);
      const result = await service.getUserTickets('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].ticketCategory.event.eventDate).toBe('2025-06-01T00:00:00.000Z');
      expect(typeof result[0].ticketCategory.event.endDate).toBe('string');
    });

    it('should return ticket as-is if no ticketCategory', async () => {
      const ticketNoCat = { id: 'ticket-1', ticketCategory: null, order: { status: 'PAID' } };
      mockPrismaService.ticket.findMany.mockResolvedValue([ticketNoCat]);
      const result = await service.getUserTickets('user-1');
      expect(result[0]).toEqual(ticketNoCat);
    });
  });

  describe('getTicketByQRCode', () => {
    it('should throw NotFoundException if ticket not found', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);
      await expect(service.getTicketByQRCode('BAD-QR')).rejects.toThrow(NotFoundException);
    });

    it('should return ticket when found', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      const result = await service.getTicketByQRCode('TICKET-ABC123');
      expect(result).toEqual(mockTicket);
    });
  });

  describe('getTicketById', () => {
    it('should throw NotFoundException if ticket not found', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);
      await expect(service.getTicketById('ticket-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if ticket belongs to different user', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        order: { ...mockTicket.order, userId: 'user-2', status: 'PAID' },
      });
      await expect(service.getTicketById('ticket-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if order not PAID', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        order: { ...mockTicket.order, userId: 'user-1', status: 'REFUNDED' },
      });
      await expect(service.getTicketById('ticket-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should return ticket when valid', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        order: { ...mockTicket.order, userId: 'user-1', status: 'PAID' },
      });
      const result = await service.getTicketById('ticket-1', 'user-1');
      expect(result.id).toBe('ticket-1');
    });
  });
});
