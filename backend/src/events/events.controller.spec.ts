import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockEventsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'organizer@test.com',
    role: 'ORGANIZER',
  };

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
      expect(service.create).toHaveBeenCalledWith(mockUser.id, createEventDto);
    });
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      mockEventsService.findAll.mockResolvedValue([mockEvent]);

      const result = await controller.findAll();

      expect(result).toEqual([mockEvent]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne('event-1');

      expect(result).toEqual(mockEvent);
      expect(service.findOne).toHaveBeenCalledWith('event-1');
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
});
