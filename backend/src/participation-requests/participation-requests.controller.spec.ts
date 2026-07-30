import { Test, TestingModule } from '@nestjs/testing';
import { ParticipationRequestsController } from './participation-requests.controller';
import { ParticipationRequestsService } from './participation-requests.service';

describe('ParticipationRequestsController', () => {
  let controller: ParticipationRequestsController;

  const mockService = {
    create: jest.fn(),
    getByEvent: jest.fn(),
    resolveEventIdForNotification: jest.fn(),
    getMyRequests: jest.fn(),
    getMyRequestForEvent: jest.fn(),
    getPendingRequestsForOrganizer: jest.fn(),
    respond: jest.fn(),
  };

  const mockUser = { id: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipationRequestsController],
      providers: [{ provide: ParticipationRequestsService, useValue: mockService }],
    }).compile();

    controller = module.get<ParticipationRequestsController>(ParticipationRequestsController);
    jest.clearAllMocks();
  });

  it('should create participation request', () => {
    mockService.create.mockResolvedValue({ id: 'req-1' });
    controller.create(mockUser, { eventId: 'event-1', message: 'Hi' });
    expect(mockService.create).toHaveBeenCalledWith('user-1', { eventId: 'event-1', message: 'Hi' });
  });

  it('should get requests by event', () => {
    mockService.getByEvent.mockResolvedValue([]);
    controller.getByEvent('event-1', mockUser);
    expect(mockService.getByEvent).toHaveBeenCalledWith('event-1', 'user-1');
  });

  it('should resolve event id for notification', () => {
    mockService.resolveEventIdForNotification.mockResolvedValue({ eventId: 'event-1' });
    controller.resolveEventIdForNotification('relatedId-1', mockUser);
    expect(mockService.resolveEventIdForNotification).toHaveBeenCalledWith('relatedId-1', 'user-1');
  });

  it('should get my requests', () => {
    mockService.getMyRequests.mockResolvedValue([]);
    controller.getMyRequests(mockUser);
    expect(mockService.getMyRequests).toHaveBeenCalledWith('user-1');
  });

  it('should get my request for event', () => {
    mockService.getMyRequestForEvent.mockResolvedValue(null);
    controller.getMyRequestForEvent('event-1', mockUser);
    expect(mockService.getMyRequestForEvent).toHaveBeenCalledWith('event-1', 'user-1');
  });

  it('should get pending requests for organizer', () => {
    mockService.getPendingRequestsForOrganizer.mockResolvedValue([]);
    controller.getPendingForOrganizer(mockUser);
    expect(mockService.getPendingRequestsForOrganizer).toHaveBeenCalledWith('user-1');
  });

  it('should respond to request', () => {
    mockService.respond.mockResolvedValue({});
    controller.respond('req-1', mockUser, { action: 'ACCEPT' });
    expect(mockService.respond).toHaveBeenCalledWith('req-1', 'user-1', { action: 'ACCEPT' });
  });
});
