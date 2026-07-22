import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventCategory } from './dto/create-event.dto';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockEventsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    searchEvents: jest.fn(),
    getSearchSuggestions: jest.fn(),
    getAvailableLocations: jest.fn(),
    getAvailableCities: jest.fn(),
    cancelEvent: jest.fn(),
    suspendEvent: jest.fn(),
  };

  const mockEvent = {
    id: 'event-1',
    title: 'Concert Test',
    description: 'Description test',
    location: 'Paris',
    imageUrl: null,
    eventDate: new Date('2026-12-31'),
    organizerId: 'user-1',
    ticketCategories: [
      {
        id: 'cat-1',
        name: 'VIP',
        description: 'VIP access',
        price: 100,
        initialStock: 50,
        currentStock: 50,
      },
    ],
    organizer: {
      id: 'user-1',
      email: 'organizer@test.com',
      username: 'johndoe',
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'organizer@test.com',
    role: 'ORGANIZER',
    username: 'johndoe',
    createdAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createEventDto = {
      title: 'Concert Test',
      description: 'Description test',
      location: 'Paris',
      event_date: '2026-12-31T20:00:00Z',
      ticket_categories: [
        {
          name: 'VIP',
          description: 'VIP access',
          price: 100,
          initial_stock: 50,
        },
      ],
    };

    it('should create an event', async () => {
      mockEventsService.create.mockResolvedValue(mockEvent);

      const result = await controller.create(mockUser, createEventDto);

      expect(result).toEqual(mockEvent);
      expect(service.create).toHaveBeenCalledWith(
        mockUser.id,
        createEventDto,
        mockUser.role,
      );
    });
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      mockEventsService.findAll.mockResolvedValue([mockEvent]);

      const result = await controller.findAll({});

      expect(result).toEqual([mockEvent]);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne('event-1');

      expect(result).toEqual(mockEvent);
      expect(service.findOne).toHaveBeenCalledWith('event-1', undefined);
    });
  });

  describe('update', () => {
    const updateEventDto = {
      title: 'Updated Concert',
      location: 'Lyon',
    };

    it('should update an event', async () => {
      const updatedEvent = { ...mockEvent, ...updateEventDto };
      mockEventsService.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(
        'event-1',
        mockUser,
        updateEventDto,
      );

      expect(result).toEqual(updatedEvent);
      expect(service.update).toHaveBeenCalledWith(
        'event-1',
        mockUser.id,
        updateEventDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete an event', async () => {
      const deleteResult = { message: 'Événement supprimé avec succès' };
      mockEventsService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove('event-1', mockUser);

      expect(result).toEqual(deleteResult);
      expect(service.remove).toHaveBeenCalledWith('event-1', mockUser.id);
    });
  });

  describe('searchEvents', () => {
    it('should search events with dto and user id', async () => {
      mockEventsService.searchEvents.mockResolvedValue([mockEvent]);
      const searchDto = { q: 'concert' } as any;
      const result = await controller.searchEvents(searchDto, { id: 'user-1' });
      expect(result).toEqual([mockEvent]);
      expect(service.searchEvents).toHaveBeenCalledWith(searchDto, 'user-1');
    });

    it('should search events without user', async () => {
      mockEventsService.searchEvents.mockResolvedValue([]);
      const searchDto = { q: 'concert' } as any;
      await controller.searchEvents(searchDto, undefined);
      expect(service.searchEvents).toHaveBeenCalledWith(searchDto, undefined);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return search suggestions', async () => {
      mockEventsService.getSearchSuggestions.mockResolvedValue(['Paris', 'Lyon']);
      const result = await controller.getSearchSuggestions('par');
      expect(result).toEqual(['Paris', 'Lyon']);
      expect(service.getSearchSuggestions).toHaveBeenCalledWith('par');
    });
  });

  describe('getCategories', () => {
    it('should return all event categories', () => {
      const result = controller.getCategories();
      expect(result).toEqual(Object.values(EventCategory));
    });
  });

  describe('getLocations', () => {
    it('should return available locations', async () => {
      mockEventsService.getAvailableLocations.mockResolvedValue(['Paris', 'Lyon']);
      const result = await controller.getLocations();
      expect(result).toEqual(['Paris', 'Lyon']);
    });
  });

  describe('getCities', () => {
    it('should return available cities', async () => {
      mockEventsService.getAvailableCities.mockResolvedValue(['Paris', 'Lyon']);
      const result = await controller.getCities();
      expect(result).toEqual(['Paris', 'Lyon']);
    });
  });

  describe('cancelEvent', () => {
    it('should cancel an event', async () => {
      const cancelResult = { id: 'event-1', status: 'CANCELLED' };
      mockEventsService.cancelEvent.mockResolvedValue(cancelResult);
      const result = await controller.cancelEvent('event-1', mockUser, { reason: 'Venue issue' } as any);
      expect(result).toEqual(cancelResult);
      expect(service.cancelEvent).toHaveBeenCalledWith('user-1', 'event-1', 'Venue issue');
    });
  });

  describe('suspendEvent', () => {
    it('should suspend an event', async () => {
      const suspendResult = { id: 'event-1', status: 'SUSPENDED' };
      mockEventsService.suspendEvent.mockResolvedValue(suspendResult);

      const result = await controller.suspendEvent('event-1');

      expect(result).toEqual(suspendResult);
      expect(service.suspendEvent).toHaveBeenCalledWith('event-1');
    });
  });
});
