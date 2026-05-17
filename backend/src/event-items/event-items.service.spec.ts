import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EventItemsService } from './event-items.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-1';
const ORGANIZER_ID = 'organizer-1';
const OTHER_USER_ID = 'other-user-2';
const EVENT_ID = 'event-1';
const LIST_ID = 'list-1';
const ITEM_ID = 'item-1';

const mockEvent = {
  organizerId: ORGANIZER_ID,
  type: 'COMMUNITY',
};

const mockList = {
  id: LIST_ID,
  eventId: EVENT_ID,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeItem = (overrides: Record<string, unknown> = {}) => ({
  id: ITEM_ID,
  listId: LIST_ID,
  name: 'Chips',
  quantity: 1,
  unit: null,
  note: null,
  status: 'UNCLAIMED',
  claimedById: null,
  addedById: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  list: { eventId: EVENT_ID },
  claimedBy: null,
  addedBy: { id: USER_ID, username: 'user1' },
  ...overrides,
});

const mockPrisma = {
  event: { findUnique: jest.fn() },
  participationRequest: { findUnique: jest.fn() },
  eventItemList: { findUnique: jest.fn(), create: jest.fn() },
  eventItem: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('EventItemsService', () => {
  let service: EventItemsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventItemsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EventItemsService>(EventItemsService);
  });

  // --- helpers to set up common mocks ---

  function setupOrganizerAccess() {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
    mockPrisma.eventItemList.findUnique.mockResolvedValue({
      ...mockList,
      items: [],
    });
  }

  function setupParticipantAccess() {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
    mockPrisma.participationRequest.findUnique.mockResolvedValue({
      status: 'ACCEPTED',
    });
    mockPrisma.eventItemList.findUnique.mockResolvedValue({
      ...mockList,
      items: [],
    });
  }

  // ============================================================
  // getList
  // ============================================================

  describe('getList', () => {
    it('returns sorted list (unclaimed first) for organizer', async () => {
      const claimedItem = makeItem({
        id: 'item-2',
        name: 'Balloon',
        status: 'CLAIMED',
        claimedById: ORGANIZER_ID,
      });
      const unclaimedItem = makeItem({ id: 'item-3', name: 'Chips' });
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.eventItemList.findUnique.mockResolvedValue({
        ...mockList,
        items: [claimedItem, unclaimedItem],
      });

      const result = await service.getList(ORGANIZER_ID, EVENT_ID);

      expect(result.items[0].status).toBe('UNCLAIMED');
      expect(result.items[1].status).toBe('CLAIMED');
    });

    it('throws NotFoundException when event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.getList(USER_ID, EVENT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException for non-community event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        ...mockEvent,
        type: 'PROFESSIONAL',
      });

      await expect(service.getList(USER_ID, EVENT_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.participationRequest.findUnique.mockResolvedValue(null);

      await expect(service.getList(USER_ID, EVENT_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('adds isClaimedByMe flag correctly', async () => {
      const item = makeItem({ status: 'CLAIMED', claimedById: USER_ID });
      mockPrisma.event.findUnique.mockResolvedValue({
        ...mockEvent,
        organizerId: USER_ID,
      });
      mockPrisma.eventItemList.findUnique.mockResolvedValue({
        ...mockList,
        items: [item],
      });

      const result = await service.getList(USER_ID, EVENT_ID);

      expect(result.items[0].isClaimedByMe).toBe(true);
    });
  });

  // ============================================================
  // addItem
  // ============================================================

  describe('addItem', () => {
    it('creates list if not exists and adds item', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.participationRequest.findUnique.mockResolvedValue({
        status: 'ACCEPTED',
      });
      mockPrisma.eventItemList.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockList, items: [] });
      mockPrisma.eventItemList.create.mockResolvedValue({
        ...mockList,
        items: [],
      });
      mockPrisma.eventItem.create.mockResolvedValue(makeItem());

      const result = await service.addItem(USER_ID, EVENT_ID, {
        name: 'Chips',
        quantity: 2,
      });

      expect(mockPrisma.eventItemList.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { eventId: EVENT_ID } }),
      );
      expect(mockPrisma.eventItem.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws BadRequestException for non-community event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        ...mockEvent,
        type: 'PROFESSIONAL',
      });

      await expect(
        service.addItem(USER_ID, EVENT_ID, { name: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.participationRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem(USER_ID, EVENT_ID, { name: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================================
  // updateItem
  // ============================================================

  describe('updateItem', () => {
    it('allows item creator to update their own unclaimed item', async () => {
      setupParticipantAccess();
      const item = makeItem({ addedById: USER_ID });
      mockPrisma.eventItem.findUnique.mockResolvedValue(item);
      mockPrisma.eventItem.update.mockResolvedValue({
        ...item,
        name: 'Updated',
      });

      await expect(
        service.updateItem(USER_ID, EVENT_ID, ITEM_ID, { name: 'Updated' }),
      ).resolves.toBeDefined();
    });

    it('allows organizer to update any item', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.eventItemList.findUnique.mockResolvedValue({
        ...mockList,
        items: [],
      });
      const item = makeItem({ addedById: OTHER_USER_ID });
      mockPrisma.eventItem.findUnique.mockResolvedValue(item);
      mockPrisma.eventItem.update.mockResolvedValue({
        ...item,
        name: 'Updated',
      });

      await expect(
        service.updateItem(ORGANIZER_ID, EVENT_ID, ITEM_ID, {
          name: 'Updated',
        }),
      ).resolves.toBeDefined();
    });

    it('throws NotFoundException when item does not exist', async () => {
      setupParticipantAccess();
      mockPrisma.eventItem.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItem(USER_ID, EVENT_ID, 'bad-id', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not owner or organizer', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.participationRequest.findUnique.mockResolvedValue({
        status: 'ACCEPTED',
      });
      mockPrisma.eventItemList.findUnique.mockResolvedValue({
        ...mockList,
        items: [],
      });
      const item = makeItem({ addedById: OTHER_USER_ID });
      mockPrisma.eventItem.findUnique.mockResolvedValue(item);

      await expect(
        service.updateItem(USER_ID, EVENT_ID, ITEM_ID, { name: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when updating claimed item by non-claimer non-organizer', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.participationRequest.findUnique.mockResolvedValue({
        status: 'ACCEPTED',
      });
      mockPrisma.eventItemList.findUnique.mockResolvedValue({
        ...mockList,
        items: [],
      });
      const item = makeItem({
        addedById: USER_ID,
        status: 'CLAIMED',
        claimedById: OTHER_USER_ID,
      });
      mockPrisma.eventItem.findUnique.mockResolvedValue(item);

      await expect(
        service.updateItem(USER_ID, EVENT_ID, ITEM_ID, { name: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================================
  // deleteItem
  // ============================================================

  describe('deleteItem', () => {
    it('allows item creator to delete their own item', async () => {
      setupParticipantAccess();
      const item = makeItem({ addedById: USER_ID });
      mockPrisma.eventItem.findUnique.mockResolvedValue(item);
      mockPrisma.eventItem.delete.mockResolvedValue(item);

      await expect(
        service.deleteItem(USER_ID, EVENT_ID, ITEM_ID),
      ).resolves.toBeDefined();
    });

    it('allows organizer to delete any item', async () => {
      setupOrganizerAccess();
      const item = makeItem({ addedById: OTHER_USER_ID });
      mockPrisma.eventItem.findUnique.mockResolvedValue(item);
      mockPrisma.eventItem.delete.mockResolvedValue(item);

      await expect(
        service.deleteItem(ORGANIZER_ID, EVENT_ID, ITEM_ID),
      ).resolves.toBeDefined();
    });

    it('throws NotFoundException when item does not exist', async () => {
      setupParticipantAccess();
      mockPrisma.eventItem.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteItem(USER_ID, EVENT_ID, ITEM_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not owner or organizer', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.participationRequest.findUnique.mockResolvedValue({
        status: 'ACCEPTED',
      });
      mockPrisma.eventItemList.findUnique.mockResolvedValue({
        ...mockList,
        items: [],
      });
      const item = makeItem({ addedById: OTHER_USER_ID });
      mockPrisma.eventItem.findUnique.mockResolvedValue(item);

      await expect(
        service.deleteItem(USER_ID, EVENT_ID, ITEM_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================================
  // claimItem
  // ============================================================

  describe('claimItem', () => {
    it('claims an unclaimed item', async () => {
      setupParticipantAccess();
      const item = makeItem({ status: 'UNCLAIMED', claimedById: null });
      mockPrisma.eventItem.findUnique.mockResolvedValue(item);
      mockPrisma.eventItem.update.mockResolvedValue({
        ...item,
        status: 'CLAIMED',
        claimedById: USER_ID,
      });

      await expect(
        service.claimItem(USER_ID, EVENT_ID, ITEM_ID),
      ).resolves.toBeDefined();
      expect(mockPrisma.eventItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'CLAIMED', claimedById: USER_ID },
        }),
      );
    });

    it('unclames item already claimed by current user (toggle)', async () => {
      setupParticipantAccess();
      const item = makeItem({ status: 'CLAIMED', claimedById: USER_ID });
      mockPrisma.eventItem.findUnique.mockResolvedValue(item);
      mockPrisma.eventItem.update.mockResolvedValue({
        ...item,
        status: 'UNCLAIMED',
        claimedById: null,
      });

      await expect(
        service.claimItem(USER_ID, EVENT_ID, ITEM_ID),
      ).resolves.toBeDefined();
      expect(mockPrisma.eventItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'UNCLAIMED', claimedById: null },
        }),
      );
    });

    it('throws ConflictException when item is claimed by someone else', async () => {
      setupParticipantAccess();
      const item = makeItem({ status: 'CLAIMED', claimedById: OTHER_USER_ID });
      mockPrisma.eventItem.findUnique.mockResolvedValue(item);

      await expect(
        service.claimItem(USER_ID, EVENT_ID, ITEM_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when item does not exist', async () => {
      setupParticipantAccess();
      mockPrisma.eventItem.findUnique.mockResolvedValue(null);

      await expect(
        service.claimItem(USER_ID, EVENT_ID, ITEM_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.participationRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.claimItem(USER_ID, EVENT_ID, ITEM_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
