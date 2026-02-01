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
