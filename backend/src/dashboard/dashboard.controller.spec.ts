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
      const mockUser = { id: 'user-2', role: 'CLIENT' };
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
});
