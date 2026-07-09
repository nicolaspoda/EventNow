import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventItemsService } from './event-items.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { EventType, ItemStatus, ParticipationRequestStatus } from '@prisma/client';

describe('EventItemsService', () => {
  let service: EventItemsService;

  const mockGateway = {
    notifyItemListUpdated: jest.fn(),
  };

  const mockPrismaService = {
    event: { findUnique: jest.fn() },
    participationRequest: { findUnique: jest.fn() },
    eventItemList: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    eventItem: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCommunityEvent = {
    id: 'event-1',
    organizerId: 'user-1',
    type: EventType.COMMUNITY,
  };

  const mockItem = {
    id: 'item-1',
    listId: 'list-1',
    name: 'Wine',
    quantity: 2,
    unit: 'bottles',
    note: null,
    status: ItemStatus.UNCLAIMED,
    claimedById: null,
    addedById: 'user-1',
    claimedBy: null,
    addedBy: { id: 'user-1', username: 'user1' },
    list: { eventId: 'event-1' },
  };

  const mockList = {
    id: 'list-1',
    eventId: 'event-1',
    items: [mockItem],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventItemsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MessagesGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<EventItemsService>(EventItemsService);
    jest.clearAllMocks();
  });

  const setupAccess = (userId = 'user-1') => {
    mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
  };

  const setupParticipantAccess = (userId = 'user-2') => {
    mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, organizerId: 'other-user' });
    mockPrismaService.participationRequest.findUnique.mockResolvedValue({
      status: ParticipationRequestStatus.ACCEPTED,
    });
  };

  describe('checkAccess (via getList)', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.getList('user-1', 'event-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if event is not COMMUNITY type', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockCommunityEvent,
        type: EventType.PROFESSIONAL,
      });
      await expect(service.getList('user-1', 'event-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if not organizer and not accepted participant', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, organizerId: 'other-user' });
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      await expect(service.getList('user-1', 'event-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if participant not accepted', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, organizerId: 'other-user' });
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: 'PENDING' });
      await expect(service.getList('user-1', 'event-1')).rejects.toThrow(ForbiddenException);
    });

    it('should allow organizer to access', async () => {
      setupAccess();
      mockPrismaService.eventItemList.findUnique.mockResolvedValue(mockList);
      const result = await service.getList('user-1', 'event-1');
      expect(result).toBeDefined();
    });

    it('should allow accepted participant to access', async () => {
      setupParticipantAccess();
      mockPrismaService.eventItemList.findUnique.mockResolvedValue(mockList);
      const result = await service.getList('user-2', 'event-1');
      expect(result).toBeDefined();
    });
  });

  describe('getList', () => {
    it('should create list if none exists', async () => {
      setupAccess();
      mockPrismaService.eventItemList.findUnique.mockResolvedValue(null);
      mockPrismaService.eventItemList.create.mockResolvedValue({ ...mockList, items: [] });
      const result = await service.getList('user-1', 'event-1');
      expect(mockPrismaService.eventItemList.create).toHaveBeenCalled();
    });

    it('should return existing list with sorted items', async () => {
      setupAccess();
      const claimedItem = {
        ...mockItem,
        id: 'item-2',
        name: 'Beer',
        status: ItemStatus.CLAIMED,
        claimedById: 'user-1',
      };
      mockPrismaService.eventItemList.findUnique.mockResolvedValue({
        ...mockList,
        items: [claimedItem, mockItem],
      });
      const result = await service.getList('user-1', 'event-1');
      expect(result.items[0].status).toBe(ItemStatus.UNCLAIMED);
    });

    it('should mark isClaimedByMe correctly', async () => {
      setupAccess();
      const claimedItem = {
        ...mockItem,
        id: 'item-2',
        status: ItemStatus.CLAIMED,
        claimedById: 'user-1',
      };
      mockPrismaService.eventItemList.findUnique.mockResolvedValue({
        ...mockList,
        items: [claimedItem],
      });
      const result = await service.getList('user-1', 'event-1');
      expect(result.items[0].isClaimedByMe).toBe(true);
    });
  });

  describe('addItem', () => {
    it('should add item to list', async () => {
      setupAccess();
      mockPrismaService.eventItemList.findUnique
        .mockResolvedValueOnce(mockList)
        .mockResolvedValueOnce(mockList);
      mockPrismaService.eventItem.create.mockResolvedValue(mockItem);
      const result = await service.addItem('user-1', 'event-1', { name: 'Wine', quantity: 2, unit: 'bottles' });
      expect(mockPrismaService.eventItem.create).toHaveBeenCalled();
    });

    it('should use default quantity of 1 if not provided', async () => {
      setupAccess();
      mockPrismaService.eventItemList.findUnique
        .mockResolvedValueOnce(mockList)
        .mockResolvedValueOnce(mockList);
      mockPrismaService.eventItem.create.mockResolvedValue(mockItem);
      await service.addItem('user-1', 'event-1', { name: 'Cheese' });
      expect(mockPrismaService.eventItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: 1 }),
        }),
      );
    });

    it('should create list if none exists before adding', async () => {
      setupAccess();
      mockPrismaService.eventItemList.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockList);
      mockPrismaService.eventItemList.create.mockResolvedValue(mockList);
      mockPrismaService.eventItem.create.mockResolvedValue(mockItem);
      await service.addItem('user-1', 'event-1', { name: 'Wine' });
      expect(mockPrismaService.eventItemList.create).toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('should throw NotFoundException if item not found', async () => {
      setupAccess();
      mockPrismaService.eventItem.findUnique.mockResolvedValue(null);
      await expect(
        service.updateItem('user-1', 'event-1', 'item-1', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if item belongs to different event', async () => {
      setupAccess();
      mockPrismaService.eventItem.findUnique.mockResolvedValue({
        ...mockItem,
        list: { eventId: 'other-event' },
      });
      await expect(
        service.updateItem('user-1', 'event-1', 'item-1', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer and not item creator', async () => {
      setupParticipantAccess('user-2');
      mockPrismaService.eventItem.findUnique.mockResolvedValue({
        ...mockItem,
        addedById: 'user-3',
        status: ItemStatus.UNCLAIMED,
      });
      await expect(
        service.updateItem('user-2', 'event-1', 'item-1', { name: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if item claimed by someone else', async () => {
      setupParticipantAccess('user-2');
      mockPrismaService.eventItem.findUnique.mockResolvedValue({
        ...mockItem,
        addedById: 'user-2',
        status: ItemStatus.CLAIMED,
        claimedById: 'user-3',
        list: { eventId: 'event-1' },
      });
      await expect(
        service.updateItem('user-2', 'event-1', 'item-1', { name: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update item successfully', async () => {
      setupAccess();
      mockPrismaService.eventItem.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.eventItem.update.mockResolvedValue({ ...mockItem, name: 'Updated Wine' });
      mockPrismaService.eventItemList.findUnique.mockResolvedValue(mockList);
      await service.updateItem('user-1', 'event-1', 'item-1', { name: 'Updated Wine' });
      expect(mockPrismaService.eventItem.update).toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    it('should throw NotFoundException if item not found', async () => {
      setupAccess();
      mockPrismaService.eventItem.findUnique.mockResolvedValue(null);
      await expect(service.deleteItem('user-1', 'event-1', 'item-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer and not item creator', async () => {
      setupParticipantAccess('user-2');
      mockPrismaService.eventItem.findUnique.mockResolvedValue({
        ...mockItem,
        addedById: 'user-3',
      });
      await expect(service.deleteItem('user-2', 'event-1', 'item-1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete item and return updated list', async () => {
      setupAccess();
      mockPrismaService.eventItem.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.eventItem.delete.mockResolvedValue({});
      mockPrismaService.eventItemList.findUnique.mockResolvedValue({ ...mockList, items: [] });
      const result = await service.deleteItem('user-1', 'event-1', 'item-1');
      expect(mockPrismaService.eventItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
    });
  });

  describe('claimItem', () => {
    it('should throw NotFoundException if item not found', async () => {
      setupAccess();
      mockPrismaService.eventItem.findUnique.mockResolvedValue(null);
      await expect(service.claimItem('user-1', 'event-1', 'item-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if item already claimed by someone else', async () => {
      setupAccess();
      mockPrismaService.eventItem.findUnique.mockResolvedValue({
        ...mockItem,
        status: ItemStatus.CLAIMED,
        claimedById: 'user-2',
      });
      await expect(service.claimItem('user-1', 'event-1', 'item-1')).rejects.toThrow(ConflictException);
    });

    it('should claim unclaimed item', async () => {
      setupAccess();
      mockPrismaService.eventItem.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.eventItem.update.mockResolvedValue({
        ...mockItem,
        status: ItemStatus.CLAIMED,
        claimedById: 'user-1',
      });
      mockPrismaService.eventItemList.findUnique.mockResolvedValue(mockList);
      await service.claimItem('user-1', 'event-1', 'item-1');
      expect(mockPrismaService.eventItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ItemStatus.CLAIMED }),
        }),
      );
    });

    it('should unclaim item if already claimed by same user', async () => {
      setupAccess();
      mockPrismaService.eventItem.findUnique.mockResolvedValue({
        ...mockItem,
        status: ItemStatus.CLAIMED,
        claimedById: 'user-1',
      });
      mockPrismaService.eventItem.update.mockResolvedValue({
        ...mockItem,
        status: ItemStatus.UNCLAIMED,
        claimedById: null,
      });
      mockPrismaService.eventItemList.findUnique.mockResolvedValue(mockList);
      await service.claimItem('user-1', 'event-1', 'item-1');
      expect(mockPrismaService.eventItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ItemStatus.UNCLAIMED, claimedById: null }),
        }),
      );
    });
  });
});
