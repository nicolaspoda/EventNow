import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getOrganizerOverview: jest.fn(),
    getOrganizerEvents: jest.fn(),
    getEventStats: jest.fn(),
    getClientOverview: jest.fn(),
    getClientEvents: jest.fn(),
    getEventParticipants: jest.fn(),
    getMyUpcomingEvents: jest.fn(),
    getMyParticipatedEvents: jest.fn(),
    getMyCalendarEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrganizerOverview', () => {
    it('should call service with user id', async () => {
      const mockUser = { id: 'user-1', role: 'ORGANIZER' };
      const mockOverview = {
        totalEvents: 5,
        upcomingEvents: 3,
        pastEvents: 2,
        totalRevenue: 10000,
        totalTicketsSold: 200,
        averageTicketPrice: 50,
      };

      mockDashboardService.getOrganizerOverview.mockResolvedValue(mockOverview);

      const result = await controller.getOrganizerOverview(mockUser);

      expect(service.getOrganizerOverview).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockOverview);
    });
  });

  describe('getClientOverview', () => {
    it('should call service with user id', async () => {
      const mockUser = { id: 'user-2', role: 'USER' };
      const mockOverview = {
        totalEvents: 3,
        upcomingEvents: 2,
        totalParticipants: 50,
        averageParticipants: 16,
      };

      mockDashboardService.getClientOverview.mockResolvedValue(mockOverview);

      const result = await controller.getClientOverview(mockUser);

      expect(service.getClientOverview).toHaveBeenCalledWith('user-2');
      expect(result).toEqual(mockOverview);
    });
  });

  describe('getEventStats', () => {
    it('should call service with event id and user id', async () => {
      const mockUser = { id: 'user-1', role: 'ORGANIZER' };
      const mockStats = {
        event: { id: 'event-1', title: 'Test Event' },
        categoriesStats: [],
        salesByDay: {},
        totalRevenue: 5000,
        totalSold: 100,
      };

      mockDashboardService.getEventStats.mockResolvedValue(mockStats);

      const result = await controller.getEventStats('event-1', mockUser);

      expect(service.getEventStats).toHaveBeenCalledWith('event-1', 'user-1');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getOrganizerEvents', () => {
    it('should return organizer events', async () => {
      const mockUser = { id: 'user-1', role: 'ORGANIZER' } as any;
      mockDashboardService.getOrganizerEvents.mockResolvedValue([{ id: 'e-1' }]);
      const result = await controller.getOrganizerEvents(mockUser);
      expect(service.getOrganizerEvents).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([{ id: 'e-1' }]);
    });
  });

  describe('getClientEvents', () => {
    it('should return client events', async () => {
      const mockUser = { id: 'user-2', role: 'USER' } as any;
      mockDashboardService.getClientEvents.mockResolvedValue([{ id: 'e-2' }]);
      const result = await controller.getClientEvents(mockUser);
      expect(service.getClientEvents).toHaveBeenCalledWith('user-2');
      expect(result).toEqual([{ id: 'e-2' }]);
    });
  });

  describe('getEventParticipants', () => {
    it('should return event participants', async () => {
      const mockUser = { id: 'user-2', role: 'USER' } as any;
      mockDashboardService.getEventParticipants.mockResolvedValue([{ id: 'p-1' }]);
      const result = await controller.getEventParticipants('event-1', mockUser);
      expect(service.getEventParticipants).toHaveBeenCalledWith('event-1', 'user-2');
      expect(result).toEqual([{ id: 'p-1' }]);
    });
  });

  describe('getMyUpcomingEvents', () => {
    it('should return upcoming events for user', async () => {
      const mockUser = { id: 'user-1' } as any;
      mockDashboardService.getMyUpcomingEvents.mockResolvedValue([{ id: 'e-3' }]);
      const result = await controller.getMyUpcomingEvents(mockUser);
      expect(service.getMyUpcomingEvents).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([{ id: 'e-3' }]);
    });
  });

  describe('getMyParticipatedEvents', () => {
    it('should return participated events for user', async () => {
      const mockUser = { id: 'user-1' } as any;
      mockDashboardService.getMyParticipatedEvents.mockResolvedValue([]);
      await controller.getMyParticipatedEvents(mockUser);
      expect(service.getMyParticipatedEvents).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getMyCalendarEvents', () => {
    it('should return calendar events for user', async () => {
      const mockUser = { id: 'user-1' } as any;
      mockDashboardService.getMyCalendarEvents.mockResolvedValue([]);
      await controller.getMyCalendarEvents(mockUser);
      expect(service.getMyCalendarEvents).toHaveBeenCalledWith('user-1');
    });
  });
});
