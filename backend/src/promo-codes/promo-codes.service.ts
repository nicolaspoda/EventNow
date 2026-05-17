import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DiscountType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';

@Injectable()
export class PromoCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async createPromoCode(userId: string, dto: CreatePromoCodeDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à créer des codes promo pour cet événement",
      );
    }

    const existing = await this.prisma.promoCode.findUnique({
      where: { code_eventId: { code: dto.code, eventId: dto.eventId } },
    });

    if (existing) {
      throw new BadRequestException(
        'Ce code promo existe déjà pour cet événement',
      );
    }

    return this.prisma.promoCode.create({
      data: {
        code: dto.code,
        eventId: dto.eventId,
        createdById: userId,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxUses: dto.maxUses ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async validatePromoCode(dto: ValidatePromoCodeDto) {
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { code_eventId: { code: dto.code, eventId: dto.eventId } },
    });

    if (!promoCode) {
      throw new NotFoundException('Code promo introuvable');
    }

    if (!promoCode.isActive) {
      throw new BadRequestException('Ce code promo est désactivé');
    }

    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      throw new BadRequestException('Ce code promo a expiré');
    }

    if (
      promoCode.maxUses !== null &&
      promoCode.currentUses >= promoCode.maxUses
    ) {
      throw new BadRequestException(
        "Ce code promo a atteint son nombre maximum d'utilisations",
      );
    }

    const { discountAmount, finalAmount } = this.calculateDiscount(
      dto.orderAmount,
      promoCode.discountType,
      Number(promoCode.discountValue),
    );

    return { promoCode, discountAmount, finalAmount };
  }

  async validatePromoCodeById(promoCodeId: string, orderAmount: number) {
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { id: promoCodeId },
    });

    if (!promoCode) {
      throw new NotFoundException('Code promo introuvable');
    }

    if (!promoCode.isActive) {
      throw new BadRequestException('Ce code promo est désactivé');
    }

    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      throw new BadRequestException('Ce code promo a expiré');
    }

    if (
      promoCode.maxUses !== null &&
      promoCode.currentUses >= promoCode.maxUses
    ) {
      throw new BadRequestException(
        "Ce code promo a atteint son nombre maximum d'utilisations",
      );
    }

    const { discountAmount, finalAmount } = this.calculateDiscount(
      orderAmount,
      promoCode.discountType,
      Number(promoCode.discountValue),
    );

    return { promoCode, discountAmount, finalAmount };
  }

  async applyPromoCode(promoCodeId: string) {
    return this.prisma.promoCode.update({
      where: { id: promoCodeId },
      data: { currentUses: { increment: 1 } },
    });
  }

  async getEventPromoCodes(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à consulter les codes promo de cet événement",
      );
    }

    return this.prisma.promoCode.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePromoCode(userId: string, promoCodeId: string) {
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { id: promoCodeId },
    });

    if (!promoCode) {
      throw new NotFoundException('Code promo introuvable');
    }

    if (promoCode.createdById !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à supprimer ce code promo",
      );
    }

    return this.prisma.promoCode.update({
      where: { id: promoCodeId },
      data: { isActive: false },
    });
  }

  private calculateDiscount(
    orderAmount: number,
    discountType: DiscountType,
    discountValue: number,
  ): { discountAmount: number; finalAmount: number } {
    let discountAmount: number;
    let finalAmount: number;

    if (discountType === DiscountType.PERCENTAGE) {
      discountAmount = orderAmount * (discountValue / 100);
      finalAmount = orderAmount - discountAmount;
    } else {
      discountAmount = Math.min(discountValue, orderAmount);
      finalAmount = Math.max(0, orderAmount - discountValue);
    }

    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
    };
  }
}
