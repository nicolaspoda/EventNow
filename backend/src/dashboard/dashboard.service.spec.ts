import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockPrismaService = {
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrganizerOverview', () => {
    it('should return organizer overview statistics', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Event 1',
          eventDate: new Date('2026-12-31'),
          ticketCategories: [
            {
              initialStock: 100,
              currentStock: 60,
              price: 50,
            },
          ],
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.getOrganizerOverview('user-1');

      expect(result).toEqual({
        totalEvents: 1,
        upcomingEvents: 1,
        pastEvents: 0,
        totalRevenue: 2000,
        totalTicketsSold: 40,
        averageTicketPrice: 50,
      });
    });
  });

  describe('getEventStats', () => {
    it('should throw NotFoundException if event does not exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.getEventStats('event-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        organizerId: 'other-user',
      });

      await expect(service.getEventStats('event-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getClientOverview', () => {
    it('should return client overview statistics', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Community Event',
          eventDate: new Date('2026-06-15'),
          ticketCategories: [
            {
              initialStock: 50,
              currentStock: 30,
            },
          ],
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.getClientOverview('user-1');

      expect(result).toEqual({
        totalEvents: 1,
        upcomingEvents: 1,
        totalParticipants: 20,
        averageParticipants: 20,
      });
    });
  });
});
