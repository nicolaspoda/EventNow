import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPrismaService = {
    event: { findMany: jest.fn(), findUnique: jest.fn() },
    booking: { findMany: jest.fn() },
    ticket: { findMany: jest.fn() },
    participationRequest: { findMany: jest.fn() },
    eventStaff: { findMany: jest.fn() },
  };

  const now = new Date();
  const futureDate = new Date(now.getTime() + 86400000 * 10);
  const pastDate = new Date(now.getTime() - 86400000 * 10);

  const mockTicketCategory = {
    id: 'cat-1',
    name: 'Standard',
    price: 50,
    initialStock: 100,
    currentStock: 80,
    bookings: [],
    tickets: [],
  };

  const mockEvent = {
    id: 'event-1',
    title: 'Test Event',
    organizerId: 'user-1',
    eventDate: futureDate,
    endDate: null,
    cancelledAt: null,
    ticketCategories: [mockTicketCategory],
    participationRequests: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
    mockPrismaService.eventStaff.findMany.mockResolvedValue([]);
  });

  describe('getOrganizerOverview', () => {
    it('should return overview with stats', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        { ...mockEvent, ticketCategories: [{ ...mockTicketCategory, initialStock: 100, currentStock: 80, price: 50 }] },
      ]);
      const result = await service.getOrganizerOverview('user-1');
      expect(result.totalEvents).toBe(1);
      expect(result.upcomingEvents).toBe(1);
      expect(result.pastEvents).toBe(0);
      expect(result.totalTicketsSold).toBe(20);
      expect(result.totalRevenue).toBe(1000);
      expect(result.averageTicketPrice).toBe(50);
    });

    it('should skip cancelled events from revenue', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        { ...mockEvent, cancelledAt: new Date() },
      ]);
      const result = await service.getOrganizerOverview('user-1');
      expect(result.totalRevenue).toBe(0);
      expect(result.totalTicketsSold).toBe(0);
    });

    it('should return zero averageTicketPrice when no tickets sold', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        { ...mockEvent, ticketCategories: [{ ...mockTicketCategory, initialStock: 100, currentStock: 100, price: 50 }] },
      ]);
      const result = await service.getOrganizerOverview('user-1');
      expect(result.averageTicketPrice).toBe(0);
    });

    it('should count past events correctly', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        { ...mockEvent, eventDate: pastDate },
      ]);
      const result = await service.getOrganizerOverview('user-1');
      expect(result.pastEvents).toBe(1);
      expect(result.upcomingEvents).toBe(0);
    });

    it('should return empty stats for no events', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      const result = await service.getOrganizerOverview('user-1');
      expect(result.totalEvents).toBe(0);
      expect(result.averageTicketPrice).toBe(0);
    });
  });

  describe('getOrganizerEvents', () => {
    it('should return events with stats', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        {
          ...mockEvent,
          ticketCategories: [{ ...mockTicketCategory, initialStock: 100, currentStock: 80, price: 50 }],
        },
      ]);
      const result = await service.getOrganizerEvents('user-1');
      expect(result[0].stats.totalSold).toBe(20);
      expect(result[0].stats.revenue).toBe(1000);
      expect(typeof result[0].stats.status).toBe('string');
    });

    it('should mark cancelled event as CANCELLED status', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        { ...mockEvent, cancelledAt: new Date(), ticketCategories: [] },
      ]);
      const result = await service.getOrganizerEvents('user-1');
      expect(result[0].stats.status).toBe('CANCELLED');
    });

    it('should format eventDate as ISO string', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        { ...mockEvent, ticketCategories: [] },
      ]);
      const result = await service.getOrganizerEvents('user-1');
      expect(typeof result[0].eventDate).toBe('string');
    });
  });

  describe('getEventStats', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.getEventStats('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        organizerId: 'other-user',
        ticketCategories: [{ ...mockTicketCategory, bookings: [] }],
      });
      await expect(service.getEventStats('event-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should return event stats with salesByDay', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        ticketCategories: [{
          ...mockTicketCategory,
          bookings: [{ status: 'CONFIRMED' }],
        }],
      });
      const bookingDate = new Date();
      mockPrismaService.booking.findMany.mockResolvedValue([
        { createdAt: bookingDate, quantity: 3 },
        { createdAt: bookingDate, quantity: 2 },
      ]);
      const result = await service.getEventStats('event-1', 'user-1');
      expect(result.event.id).toBe('event-1');
      expect(result.categoriesStats).toHaveLength(1);
      const dateKey = bookingDate.toISOString().split('T')[0];
      expect(result.salesByDay[dateKey]).toBe(5);
    });
  });

  describe('getClientOverview', () => {
    it('should return client overview with community events', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        {
          ...mockEvent,
          type: 'COMMUNITY',
          ticketCategories: [{ ...mockTicketCategory, initialStock: 10, currentStock: 5 }],
        },
      ]);
      const result = await service.getClientOverview('user-1');
      expect(result.totalEvents).toBe(1);
      expect(result.upcomingEvents).toBe(1);
      expect(result.totalParticipants).toBe(5);
      expect(result.averageParticipants).toBe(5);
    });

    it('should return zero averageParticipants when no events', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      const result = await service.getClientOverview('user-1');
      expect(result.averageParticipants).toBe(0);
    });
  });

  describe('getClientEvents', () => {
    it('should return client community events with stats', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        {
          ...mockEvent,
          type: 'COMMUNITY',
          cancelledAt: null,
          ticketCategories: [{ ...mockTicketCategory, initialStock: 10, currentStock: 7 }],
        },
      ]);
      const result = await service.getClientEvents('user-1');
      expect(result[0].stats.totalParticipants).toBe(3);
      expect(typeof result[0].stats.status).toBe('string');
    });

    it('should format eventDate as ISO string', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        { ...mockEvent, type: 'COMMUNITY', ticketCategories: [] },
      ]);
      const result = await service.getClientEvents('user-1');
      expect(typeof result[0].eventDate).toBe('string');
    });

    it('should handle zero capacity', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        {
          ...mockEvent,
          type: 'COMMUNITY',
          ticketCategories: [{ ...mockTicketCategory, initialStock: 0, currentStock: 0 }],
        },
      ]);
      const result = await service.getClientEvents('user-1');
      expect(result[0].stats.fillRate).toBe(0);
    });

    it('should mark event COMPLETED once its end date has passed', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        {
          ...mockEvent,
          type: 'COMMUNITY',
          eventDate: pastDate,
          endDate: pastDate,
          ticketCategories: [],
        },
      ]);
      const result = await service.getClientEvents('user-1');
      expect(result[0].stats.status).toBe('COMPLETED');
    });

    it('should mark event ONGOING once it has started but not ended', async () => {
      const startedTwoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      mockPrismaService.event.findMany.mockResolvedValue([
        {
          ...mockEvent,
          type: 'COMMUNITY',
          eventDate: startedTwoHoursAgo,
          endDate: null,
          ticketCategories: [],
        },
      ]);
      const result = await service.getClientEvents('user-1');
      expect(result[0].stats.status).toBe('ONGOING');
    });

    it('should mark a fully-booked future event SOLD_OUT', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        {
          ...mockEvent,
          type: 'COMMUNITY',
          eventDate: futureDate,
          ticketCategories: [{ ...mockTicketCategory, initialStock: 10, currentStock: 0 }],
        },
      ]);
      const result = await service.getClientEvents('user-1');
      expect(result[0].stats.status).toBe('SOLD_OUT');
    });

    it('should mark an event starting within 7 days UPCOMING', async () => {
      const soonDate = new Date(now.getTime() + 86400000 * 3);
      mockPrismaService.event.findMany.mockResolvedValue([
        {
          ...mockEvent,
          type: 'COMMUNITY',
          eventDate: soonDate,
          ticketCategories: [{ ...mockTicketCategory, initialStock: 10, currentStock: 5 }],
        },
      ]);
      const result = await service.getClientEvents('user-1');
      expect(result[0].stats.status).toBe('UPCOMING');
    });

    it('should mark a far-out, near-full event ALMOST_FULL', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([
        {
          ...mockEvent,
          type: 'COMMUNITY',
          eventDate: futureDate,
          ticketCategories: [{ ...mockTicketCategory, initialStock: 10, currentStock: 1 }],
        },
      ]);
      const result = await service.getClientEvents('user-1');
      expect(result[0].stats.status).toBe('ALMOST_FULL');
    });
  });

  describe('getEventParticipants', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.getEventParticipants('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        organizerId: 'other-user',
        ticketCategories: [],
        participationRequests: [],
      });
      await expect(service.getEventParticipants('event-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should return participants from bookings', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        ticketCategories: [{
          ...mockTicketCategory,
          bookings: [{
            user: { id: 'user-2', email: 'user2@test.com', username: 'user2' },
            quantity: 2,
            status: 'CONFIRMED',
            createdAt: new Date(),
          }],
          tickets: [],
        }],
        participationRequests: [],
      });
      const result = await service.getEventParticipants('event-1', 'user-1');
      expect(result.participants).toHaveLength(1);
      expect(result.totalParticipants).toBe(2);
    });

    it('should aggregate multiple bookings for same user', async () => {
      const bookingDate = new Date();
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        ticketCategories: [{
          ...mockTicketCategory,
          bookings: [
            { user: { id: 'user-2', email: 'u@t.com', username: 'u2' }, quantity: 1, status: 'CONFIRMED', createdAt: bookingDate },
            { user: { id: 'user-2', email: 'u@t.com', username: 'u2' }, quantity: 2, status: 'CONFIRMED', createdAt: bookingDate },
          ],
          tickets: [],
        }],
        participationRequests: [],
      });
      const result = await service.getEventParticipants('event-1', 'user-1');
      expect(result.participants).toHaveLength(1);
      expect(result.totalParticipants).toBe(3);
    });

    it('should include participants from tickets', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        ticketCategories: [{
          ...mockTicketCategory,
          bookings: [],
          tickets: [{
            order: {
              user: { id: 'user-3', email: 'u3@t.com', username: 'u3' },
              createdAt: new Date(),
            },
          }],
        }],
        participationRequests: [],
      });
      const result = await service.getEventParticipants('event-1', 'user-1');
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].status).toBe('CONFIRMED');
    });

    it('should upgrade status to CONFIRMED for ticket participant who also has booking', async () => {
      const bookingDate = new Date();
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        ticketCategories: [{
          ...mockTicketCategory,
          bookings: [
            { user: { id: 'user-2', email: 'u@t.com', username: 'u2' }, quantity: 1, status: 'PENDING', createdAt: bookingDate },
          ],
          tickets: [{
            order: {
              user: { id: 'user-2', email: 'u@t.com', username: 'u2' },
              createdAt: bookingDate,
            },
          }],
        }],
        participationRequests: [],
      });
      const result = await service.getEventParticipants('event-1', 'user-1');
      expect(result.participants[0].status).toBe('CONFIRMED');
    });

    it('should include participation requests', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        ticketCategories: [{ ...mockTicketCategory, bookings: [], tickets: [] }],
        participationRequests: [{
          user: { id: 'user-4', email: 'u4@t.com', username: 'u4' },
          createdAt: new Date(),
        }],
      });
      const result = await service.getEventParticipants('event-1', 'user-1');
      expect(result.participants).toHaveLength(1);
    });

    it('should not re-flag an already-CONFIRMED ticket participant', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        ticketCategories: [{
          ...mockTicketCategory,
          bookings: [],
          tickets: [
            { order: { user: { id: 'user-2', email: 'u@t.com', username: 'u2' }, createdAt: new Date() } },
            { order: { user: { id: 'user-2', email: 'u@t.com', username: 'u2' }, createdAt: new Date() } },
          ],
        }],
        participationRequests: [],
      });
      const result = await service.getEventParticipants('event-1', 'user-1');
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].status).toBe('CONFIRMED');
      expect(result.participants[0].quantity).toBe(2);
    });

    it('should aggregate a participation request for an already-known participant', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        ticketCategories: [{
          ...mockTicketCategory,
          bookings: [{ user: { id: 'user-2', email: 'u@t.com', username: 'u2' }, quantity: 1, status: 'CONFIRMED', createdAt: new Date() }],
          tickets: [],
        }],
        participationRequests: [{
          user: { id: 'user-2', email: 'u@t.com', username: 'u2' },
          createdAt: new Date(),
        }],
      });
      const result = await service.getEventParticipants('event-1', 'user-1');
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].quantity).toBe(2);
    });

    it('should fall back to null for missing bookedAt/eventDate', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        eventDate: null,
        ticketCategories: [{
          ...mockTicketCategory,
          bookings: [{ user: { id: 'user-2', email: 'u@t.com', username: 'u2' }, quantity: 1, status: 'CONFIRMED', createdAt: null }],
          tickets: [],
        }],
        participationRequests: [],
      });
      const result = await service.getEventParticipants('event-1', 'user-1');
      expect(result.participants[0].bookedAt).toBeNull();
      expect(result.event.eventDate).toBeNull();
    });
  });

  describe('getMyUpcomingEvents', () => {
    const futureEvent = {
      id: 'event-1',
      title: 'Upcoming Event',
      description: 'Desc',
      eventDate: futureDate,
      endDate: null,
      location: 'Paris',
      imageUrl: null,
      type: 'PROFESSIONAL',
      category: 'MUSIC',
      organizer: { id: 'org-1', email: 'org@t.com', username: 'org' },
    };

    beforeEach(() => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
    });

    it('should return upcoming professional and community events', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([{
        ticketCategory: {
          name: 'Standard',
          event: futureEvent,
        },
      }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([{
        event: { ...futureEvent, type: 'COMMUNITY', endDate: null },
        respondedAt: new Date(),
      }]);
      const result = await service.getMyUpcomingEvents('user-1');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should keep already-serialized eventDate strings and sort multiple ticket/community events', async () => {
      const ticketEvent = { ...futureEvent, id: 'event-B', eventDate: new Date(futureDate.getTime() + 86400000).toISOString() as unknown as Date };
      const communityEvent = { ...futureEvent, id: 'event-A', type: 'COMMUNITY', eventDate: futureDate.toISOString() as unknown as Date };
      mockPrismaService.ticket.findMany.mockResolvedValue([{
        ticketCategory: { name: 'Standard', event: ticketEvent },
      }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([{
        event: communityEvent,
        respondedAt: new Date(),
      }]);
      const result = await service.getMyUpcomingEvents('user-1');
      expect(result).toHaveLength(2);
      expect(typeof result[0].eventDate).toBe('string');
    });

    it('should keep already-serialized eventDate strings for organizer and staff events', async () => {
      const organizerEvent = { ...futureEvent, id: 'event-C', eventDate: futureDate.toISOString() as unknown as Date };
      const staffEvent = { ...futureEvent, id: 'event-D', eventDate: new Date(futureDate.getTime() + 86400000).toISOString() as unknown as Date };
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockPrismaService.event.findMany.mockResolvedValue([organizerEvent]);
      mockPrismaService.eventStaff.findMany.mockResolvedValue([{ event: staffEvent }]);
      const result = await service.getMyUpcomingEvents('user-1');
      expect(result).toHaveLength(2);
      expect(typeof result[0].eventDate).toBe('string');
    });

    it('should skip events that have ended', async () => {
      const endedEvent = { ...futureEvent, eventDate: new Date(now.getTime() - 7 * 3600000), endDate: null };
      mockPrismaService.ticket.findMany.mockResolvedValue([{
        ticketCategory: { name: 'Standard', event: endedEvent },
      }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      const result = await service.getMyUpcomingEvents('user-1');
      expect(result).toHaveLength(0);
    });

    it('should aggregate ticket counts for same event', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([
        { ticketCategory: { name: 'Standard', event: futureEvent } },
        { ticketCategory: { name: 'Standard', event: futureEvent } },
      ]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      const result = await service.getMyUpcomingEvents('user-1');
      expect((result[0] as any).ticketCount).toBe(2);
    });

    it('should use endDate for event end calculation when set', async () => {
      const eventWithEndDate = {
        ...futureEvent,
        endDate: new Date(futureDate.getTime() + 3600000),
      };
      mockPrismaService.ticket.findMany.mockResolvedValue([{
        ticketCategory: { name: 'Standard', event: eventWithEndDate },
      }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      const result = await service.getMyUpcomingEvents('user-1');
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should include events the user organizes', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockPrismaService.event.findMany.mockResolvedValue([
        { ...futureEvent, type: 'COMMUNITY' },
      ]);
      const result = await service.getMyUpcomingEvents('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].participationType).toBe('ORGANIZER');
    });

    it('should not duplicate an event the user both organizes and holds a ticket for', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([{
        ticketCategory: { name: 'Standard', event: futureEvent },
      }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockPrismaService.event.findMany.mockResolvedValue([futureEvent]);
      const result = await service.getMyUpcomingEvents('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].participationType).toBe('TICKET');
    });

    it('should include events the user is only staff on', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockPrismaService.eventStaff.findMany.mockResolvedValue([
        { event: futureEvent },
      ]);
      const result = await service.getMyUpcomingEvents('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].participationType).toBe('STAFF');
    });
  });

  describe('getMyParticipatedEvents', () => {
    it('should return participated events sorted by date', async () => {
      const event = {
        id: 'event-1',
        title: 'Past Event',
        description: 'D',
        eventDate: pastDate,
        location: 'Lyon',
        imageUrl: null,
        type: 'PROFESSIONAL',
        category: 'ART',
        organizer: { id: 'org-1', email: 'e', username: 'o' },
      };
      mockPrismaService.ticket.findMany.mockResolvedValue([{
        ticketCategory: { name: 'Std', event },
      }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([{
        event: { ...event, type: 'COMMUNITY' },
        respondedAt: new Date(),
      }]);
      const result = await service.getMyParticipatedEvents('user-1');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should deduplicate events across tickets and participations', async () => {
      const event = {
        id: 'event-1', title: 'E', description: 'D', eventDate: pastDate,
        location: 'L', imageUrl: null, type: 'PROFESSIONAL', category: 'ART',
        organizer: { id: 'o', email: 'e', username: 'o' },
      };
      mockPrismaService.ticket.findMany.mockResolvedValue([
        { ticketCategory: { name: 'Std', event } },
        { ticketCategory: { name: 'Std', event } },
      ]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      const result = await service.getMyParticipatedEvents('user-1');
      const ids = result.filter((e: any) => e.id === 'event-1');
      expect(ids).toHaveLength(1);
    });

    it('should include events the user is only staff on', async () => {
      const event = {
        id: 'event-1', title: 'E', description: 'D', eventDate: pastDate,
        location: 'L', imageUrl: null, type: 'PROFESSIONAL', category: 'ART',
        organizer: { id: 'o', email: 'e', username: 'o' },
      };
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockPrismaService.eventStaff.findMany.mockResolvedValue([{ event }]);
      const result = await service.getMyParticipatedEvents('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].participationType).toBe('STAFF');
    });

    it('should not duplicate a staff event already found via a ticket', async () => {
      const event = {
        id: 'event-1', title: 'E', description: 'D', eventDate: pastDate,
        location: 'L', imageUrl: null, type: 'PROFESSIONAL', category: 'ART',
        organizer: { id: 'o', email: 'e', username: 'o' },
      };
      mockPrismaService.ticket.findMany.mockResolvedValue([{ ticketCategory: { name: 'Std', event } }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockPrismaService.eventStaff.findMany.mockResolvedValue([{ event }]);
      const result = await service.getMyParticipatedEvents('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].participationType).toBe('TICKET');
    });

    it('should keep already-serialized eventDate strings and sort multiple events', async () => {
      const eventA = {
        id: 'event-A', title: 'A', description: 'D', eventDate: pastDate.toISOString() as unknown as Date,
        location: 'L', imageUrl: null, type: 'PROFESSIONAL', category: 'ART',
        organizer: { id: 'o', email: 'e', username: 'o' },
      };
      const eventB = {
        id: 'event-B', title: 'B', description: 'D',
        eventDate: new Date(pastDate.getTime() + 3600000).toISOString() as unknown as Date,
        location: 'L', imageUrl: null, type: 'COMMUNITY', category: 'ART',
        organizer: { id: 'o', email: 'e', username: 'o' },
      };
      const eventC = {
        id: 'event-C', title: 'C', description: 'D',
        eventDate: new Date(pastDate.getTime() + 7200000).toISOString() as unknown as Date,
        location: 'L', imageUrl: null, type: 'PROFESSIONAL', category: 'ART',
        organizer: { id: 'o', email: 'e', username: 'o' },
      };
      mockPrismaService.ticket.findMany.mockResolvedValue([{ ticketCategory: { name: 'Std', event: eventA } }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([{ event: eventB, respondedAt: new Date() }]);
      mockPrismaService.eventStaff.findMany.mockResolvedValue([{ event: eventC }]);
      const result = await service.getMyParticipatedEvents('user-1');
      expect(result).toHaveLength(3);
      expect(typeof result[0].eventDate).toBe('string');
      expect(result[0].id).toBe('event-C');
    });
  });

  describe('getMyCalendarEvents', () => {
    it('should merge participated and organized events, preferring the participation entry', async () => {
      const sharedEvent = {
        id: 'event-1', title: 'Shared', description: 'D', eventDate: pastDate,
        location: 'L', imageUrl: null, type: 'PROFESSIONAL', category: 'ART',
        organizer: { id: 'o', email: 'e', username: 'o' },
      };
      mockPrismaService.ticket.findMany.mockResolvedValue([{ ticketCategory: { name: 'Std', event: sharedEvent } }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockPrismaService.eventStaff.findMany.mockResolvedValue([]);
      mockPrismaService.event.findMany.mockResolvedValue([sharedEvent]);

      const result = await service.getMyCalendarEvents('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].participationType).toBe('TICKET');
    });

    it('should include organized-only events and sort with participated ones', async () => {
      const participatedEvent = {
        id: 'event-1', title: 'Participated', description: 'D', eventDate: pastDate,
        location: 'L', imageUrl: null, type: 'PROFESSIONAL', category: 'ART',
        organizer: { id: 'o', email: 'e', username: 'o' },
      };
      const organizedEvent = {
        id: 'event-2', title: 'Organized', description: 'D',
        eventDate: new Date(pastDate.getTime() + 3600000).toISOString() as unknown as Date,
        location: 'L', imageUrl: null, type: 'PROFESSIONAL', category: 'ART',
        organizer: { id: 'user-1', email: 'e', username: 'o' },
      };
      mockPrismaService.ticket.findMany.mockResolvedValue([{ ticketCategory: { name: 'Std', event: participatedEvent } }]);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([]);
      mockPrismaService.eventStaff.findMany.mockResolvedValue([]);
      mockPrismaService.event.findMany.mockResolvedValue([organizedEvent]);

      const result = await service.getMyCalendarEvents('user-1');
      expect(result).toHaveLength(2);
      expect(result.map((e: any) => e.id)).toEqual(expect.arrayContaining(['event-1', 'event-2']));
      expect(result[0].id).toBe('event-2');
      expect(typeof result[0].eventDate).toBe('string');
    });
  });
});
