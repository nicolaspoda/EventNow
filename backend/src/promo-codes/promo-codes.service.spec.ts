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
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEvent = { id: 'event-1', title: 'Test Event', organizerId: 'user-1' };
  const mockPromoCode = {
    id: 'promo-1',
    code: 'SAVE10',
    eventId: 'event-1',
    createdById: 'user-1',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxUses: 100,
    currentUses: 0,
    isActive: true,
    expiresAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoCodesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PromoCodesService>(PromoCodesService);
    jest.clearAllMocks();
  });

  describe('createPromoCode', () => {
    const createDto = {
      code: 'SAVE10',
      eventId: 'event-1',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      maxUses: 100,
    };

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.createPromoCode('user-1', createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not event organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      await expect(service.createPromoCode('other-user', createDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if promo code already exists', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      await expect(service.createPromoCode('user-1', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should create promo code successfully', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);
      mockPrismaService.promoCode.create.mockResolvedValue(mockPromoCode);
      const result = await service.createPromoCode('user-1', createDto);
      expect(result).toEqual(mockPromoCode);
    });

    it('should create with expiresAt date', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);
      mockPrismaService.promoCode.create.mockResolvedValue(mockPromoCode);
      await service.createPromoCode('user-1', {
        ...createDto,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(mockPrismaService.promoCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expiresAt: expect.any(Date) }),
        }),
      );
    });

    it('should create with null maxUses when not provided', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);
      mockPrismaService.promoCode.create.mockResolvedValue(mockPromoCode);
      await service.createPromoCode('user-1', { ...createDto, maxUses: undefined });
      expect(mockPrismaService.promoCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ maxUses: null }),
        }),
      );
    });
  });

  describe('validatePromoCode', () => {
    const validateDto = { code: 'SAVE10', eventId: 'event-1', orderAmount: 100 };

    it('should throw NotFoundException if promo code not found', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);
      await expect(service.validatePromoCode(validateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if inactive', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({ ...mockPromoCode, isActive: false });
      await expect(service.validatePromoCode(validateDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if expired', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.validatePromoCode(validateDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if max uses reached', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        maxUses: 10,
        currentUses: 10,
      });
      await expect(service.validatePromoCode(validateDto)).rejects.toThrow(BadRequestException);
    });

    it('should return discount for PERCENTAGE type', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      const result = await service.validatePromoCode(validateDto);
      expect(result.discountAmount).toBe(10);
      expect(result.finalAmount).toBe(90);
    });

    it('should return discount for FIXED type', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        discountType: DiscountType.FIXED,
        discountValue: 15,
      });
      const result = await service.validatePromoCode(validateDto);
      expect(result.discountAmount).toBe(15);
      expect(result.finalAmount).toBe(85);
    });

    it('should cap FIXED discount at order amount', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        discountType: DiscountType.FIXED,
        discountValue: 200,
      });
      const result = await service.validatePromoCode({ ...validateDto, orderAmount: 50 });
      expect(result.finalAmount).toBe(0);
      expect(result.discountAmount).toBe(50);
    });

    it('should work with null maxUses (unlimited)', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        maxUses: null,
        currentUses: 9999,
      });
      const result = await service.validatePromoCode(validateDto);
      expect(result.discountAmount).toBeGreaterThan(0);
    });
  });

  describe('validatePromoCodeById', () => {
    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);
      await expect(service.validatePromoCodeById('nonexistent', 100)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if inactive', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({ ...mockPromoCode, isActive: false });
      await expect(service.validatePromoCodeById('promo-1', 100)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if expired', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        expiresAt: new Date(0),
      });
      await expect(service.validatePromoCodeById('promo-1', 100)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if max uses reached', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...mockPromoCode,
        maxUses: 5,
        currentUses: 5,
      });
      await expect(service.validatePromoCodeById('promo-1', 100)).rejects.toThrow(BadRequestException);
    });

    it('should return discount for valid code', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      const result = await service.validatePromoCodeById('promo-1', 200);
      expect(result.discountAmount).toBe(20);
      expect(result.finalAmount).toBe(180);
    });
  });

  describe('applyPromoCode', () => {
    it('should increment currentUses', async () => {
      mockPrismaService.promoCode.update.mockResolvedValue({ ...mockPromoCode, currentUses: 1 });
      await service.applyPromoCode('promo-1');
      expect(mockPrismaService.promoCode.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { currentUses: { increment: 1 } },
      });
    });
  });

  describe('getEventPromoCodes', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.getEventPromoCodes('user-1', 'event-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      await expect(service.getEventPromoCodes('other-user', 'event-1')).rejects.toThrow(ForbiddenException);
    });

    it('should return event promo codes', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.promoCode.findMany.mockResolvedValue([mockPromoCode]);
      const result = await service.getEventPromoCodes('user-1', 'event-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('deletePromoCode', () => {
    it('should throw NotFoundException if promo code not found', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);
      await expect(service.deletePromoCode('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not creator', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      await expect(service.deletePromoCode('other-user', 'promo-1')).rejects.toThrow(ForbiddenException);
    });

    it('should deactivate promo code', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      mockPrismaService.promoCode.update.mockResolvedValue({ ...mockPromoCode, isActive: false });
      await service.deletePromoCode('user-1', 'promo-1');
      expect(mockPrismaService.promoCode.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { isActive: false },
      });
    });
  });
});
