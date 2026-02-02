import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ticketCategory: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEvent = {
    id: 'event-1',
    title: 'Concert Test',
    description: 'Description test',
    location: 'Paris',
    imageUrl: null,
    eventDate: new Date('2026-12-31'),
    organizerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

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

    it('should create an event with ticket categories', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const result = await service.create('user-1', createEventDto);

      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if event date is in the past', async () => {
      const pastEventDto = {
        ...createEventDto,
        event_date: '2020-01-01T20:00:00Z',
      };

      await expect(service.create('user-1', pastEventDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all future events', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      const result = await service.findAll();

      expect(result).toEqual([mockEvent]);
      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.any(Array),
          }),
        }),
      );
    });

    it('should filter events by search term', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      await service.findAll({ search: 'Concert' });

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.any(Array),
              }),
            ]),
          }),
        }),
      );
    });

    it('should filter events by location', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      await service.findAll({ location: 'Paris' });

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                location: expect.any(Object),
              }),
            ]),
          }),
        }),
      );
    });

    it('should filter events by date range', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      await service.findAll({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });

      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should ignore empty search filter', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      await service.findAll({ search: '   ' });

      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should ignore invalid date filters', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      await service.findAll({ dateFrom: 'invalid-date' });

      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
    });

    it('should ignore invalid dateTo', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      await service.findAll({ dateTo: 'not-a-date' });

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne('event-1');

      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateEventDto = {
      title: 'Updated Concert',
      location: 'Lyon',
    };

    it('should update an event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        ...updateEventDto,
      });

      const result = await service.update('event-1', 'user-1', updateEventDto);

      expect(result.title).toBe(updateEventDto.title);
      expect(result.location).toBe(updateEventDto.location);
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'user-1', updateEventDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(
        service.update('event-1', 'other-user', updateEventDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if new date is in the past', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(
        service.update('event-1', 'user-1', {
          event_date: '2020-01-01T20:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update event with ticket categories', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.ticketCategory.deleteMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.event.update.mockResolvedValue(mockEvent);

      const result = await service.update('event-1', 'user-1', {
        title: 'New Title',
        ticket_categories: [
          { name: 'Standard', price: 50, initial_stock: 100 },
        ],
      });

      expect(mockPrismaService.ticketCategory.deleteMany).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update event with description and image_url', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        description: 'New desc',
        imageUrl: 'https://example.com/img.png',
      });

      const result = await service.update('event-1', 'user-1', {
        description: 'New desc',
        image_url: 'https://example.com/img.png',
      });

      expect(mockPrismaService.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'New desc',
            imageUrl: 'https://example.com/img.png',
          }),
        }),
      );
      expect(result.description).toBe('New desc');
      expect(result.imageUrl).toBe('https://example.com/img.png');
    });

    it('should not add title when empty string (falsy)', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.event.update.mockResolvedValue(mockEvent);

      await service.update('event-1', 'user-1', {
        title: '',
        location: 'Lyon',
      });

      const callData = mockPrismaService.event.update.mock.calls[0][0];
      expect(callData.data).not.toHaveProperty('title');
      expect(callData.data.location).toBe('Lyon');
    });

    it('should not add description/image_url when explicitly undefined', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.event.update.mockResolvedValue(mockEvent);

      await service.update('event-1', 'user-1', {
        description: undefined,
        image_url: undefined,
      });

      const callData = mockPrismaService.event.update.mock.calls[0][0];
      expect(callData.data).not.toHaveProperty('description');
      expect(callData.data).not.toHaveProperty('imageUrl');
    });

    it('should not add location when empty string (falsy)', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.event.update.mockResolvedValue(mockEvent);

      await service.update('event-1', 'user-1', {
        location: '',
      });

      const callData = mockPrismaService.event.update.mock.calls[0][0];
      expect(callData.data).not.toHaveProperty('location');
    });

    it('should update without event_date (branch event_date falsy)', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        title: 'Only title',
      });

      await service.update('event-1', 'user-1', {
        title: 'Only title',
      });

      const callData = mockPrismaService.event.update.mock.calls[0][0];
      expect(callData.data.title).toBe('Only title');
      expect(callData.data).not.toHaveProperty('eventDate');
    });
  });

  describe('remove', () => {
    it('should delete an event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.delete.mockResolvedValue(mockEvent);

      const result = await service.remove('event-1', 'user-1');

      expect(result).toEqual({ message: 'Événement supprimé avec succès' });
      expect(mockPrismaService.event.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' },
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(service.remove('event-1', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
