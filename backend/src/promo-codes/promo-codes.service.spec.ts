import { Test, TestingModule } from '@nestjs/testing';
import { PromoCodesService } from './promo-codes.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DiscountType } from '@prisma/client';

describe('PromoCodesService', () => {
  let service: PromoCodesService;

  const mockPrismaService = {
    event: { findUnique: jest.fn() },
    promoCode: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEvent = {
    id: 'event-1',
    organizerId: 'user-1',
    title: 'Test Event',
  };

  const mockPromoCode = {
    id: 'promo-1',
    code: 'SUMMER20',
    eventId: 'event-1',
    createdById: 'user-1',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 20,
    maxUses: 100,
    currentUses: 0,
    expiresAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoCodesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PromoCodesService>(PromoCodesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── createPromoCode ────────────────────────────────────────────────────────

  describe('createPromoCode', () => {
    const dto = {
      code: 'SUMMER20',
      eventId: 'event-1',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
    };

    it('creates a promo code successfully', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);
      mockPrismaService.promoCode.create.mockResolvedValue(mockPromoCode);

      const result = await service.createPromoCode('user-1', dto);

      expect(result).toEqual(mockPromoCode);
      expect(mockPrismaService.promoCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ code: 'SUMMER20', eventId: 'event-1' }),
      });
    });

    it('throws NotFoundException when event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.createPromoCode('user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user does not own the event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        organizerId: 'other-user',
      });

      await expect(service.createPromoCode('user-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when code already exists for this event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.promoCode.findUnique.mockResolvedValue(mockPromoCode);

      await expect(service.createPromoCode('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── validatePromoCode ──────────────────────────────────────────────────────

  describe('validatePromoCode', () => {
    const dto = { code: 'SUMMER20', eventId: 'event-1', orderAmount: 50 };

    it('validates PERCENTAGE discount correctly', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(mockPromoCode);

      const result = await service.validatePromoCode(dto);

      expect(result.discountAmount).toBe(10);
      expect(result.finalAmount).toBe(40);
      expect(result.promoCode).toEqual(mockPromoCode);
    });

    it('validates FIXED_AMOUNT discount correctly', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 15,
      });

      const result = await service.validatePromoCode(dto);

      expect(result.discountAmount).toBe(15);
      expect(result.finalAmount).toBe(35);
    });

    it('caps FIXED_AMOUNT discount so finalAmount is 0 when discount exceeds order', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 100,
      });

      const result = await service.validatePromoCode(dto);

      expect(result.finalAmount).toBe(0);
      expect(result.discountAmount).toBe(50);
    });

    it('throws NotFoundException when code not found', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);

      await expect(service.validatePromoCode(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when code is inactive', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        isActive: false,
      });

      await expect(service.validatePromoCode(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when code has expired', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(service.validatePromoCode(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when max uses reached', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        maxUses: 10,
        currentUses: 10,
      });

      await expect(service.validatePromoCode(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── applyPromoCode ─────────────────────────────────────────────────────────

  describe('applyPromoCode', () => {
    it('increments currentUses by 1', async () => {
      const updated = { ...mockPromoCode, currentUses: 1 };
      mockPrismaService.promoCode.update.mockResolvedValue(updated);

      const result = await service.applyPromoCode('promo-1');

      expect(result.currentUses).toBe(1);
      expect(mockPrismaService.promoCode.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { currentUses: { increment: 1 } },
      });
    });
  });

  // ─── getEventPromoCodes ─────────────────────────────────────────────────────

  describe('getEventPromoCodes', () => {
    it('returns promo codes for event owner', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.promoCode.findMany.mockResolvedValue([mockPromoCode]);

      const result = await service.getEventPromoCodes('user-1', 'event-1');

      expect(result).toEqual([mockPromoCode]);
    });

    it('throws ForbiddenException when user does not own the event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        organizerId: 'other-user',
      });

      await expect(
        service.getEventPromoCodes('user-1', 'event-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── deletePromoCode ────────────────────────────────────────────────────────

  describe('deletePromoCode', () => {
    it('soft-deletes a promo code (sets isActive false)', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      mockPrismaService.promoCode.update.mockResolvedValue({
        ...mockPromoCode,
        isActive: false,
      });

      const result = await service.deletePromoCode('user-1', 'promo-1');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.promoCode.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { isActive: false },
      });
    });

    it('throws NotFoundException when promo code not found', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);

      await expect(
        service.deletePromoCode('user-1', 'promo-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own the promo code', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        createdById: 'other-user',
      });

      await expect(
        service.deletePromoCode('user-1', 'promo-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
