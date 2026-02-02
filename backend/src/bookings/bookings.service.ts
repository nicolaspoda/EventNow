import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateBookingDto } from './dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly prisma: PrismaService;
  private readonly redis: RedisService;

  constructor(prisma: PrismaService, redis: RedisService) {
    this.prisma = prisma;
    this.redis = redis;
  }

  async createBooking(userId: string, dto: CreateBookingDto) {
    const lockKey = `booking:category:${dto.ticketCategoryId}`;

    return this.redis.withLock(lockKey, async () => {
      return this.prisma.$transaction(async (tx) => {
        const category = await tx.ticketCategory.findUnique({
          where: { id: dto.ticketCategoryId },
          include: { event: true },
        });

        if (!category) {
          throw new NotFoundException('Catégorie de billet introuvable');
        }

        if (category.currentStock < dto.quantity) {
          throw new BadRequestException(
            `Stock insuffisant. Disponible : ${category.currentStock}, Demandé : ${dto.quantity}`,
          );
        }

        const updatedCategory = await tx.ticketCategory.update({
          where: {
            id: dto.ticketCategoryId,
            currentStock: { gte: dto.quantity },
          },
          data: {
            currentStock: { decrement: dto.quantity },
          },
        });

        if (!updatedCategory) {
          throw new BadRequestException('Stock épuisé pendant la réservation');
        }

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        const booking = await tx.booking.create({
          data: {
            userId: userId,
            ticketCategoryId: dto.ticketCategoryId,
            quantity: dto.quantity,
            status: BookingStatus.PENDING,
            expiresAt: expiresAt,
          },
          include: {
            ticketCategory: {
              include: { event: true },
            },
          },
        });

        return booking;
      });
    });
  }

  async confirmBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Réservation déjà traitée');
    }

    if (new Date() > booking.expiresAt) {
      throw new BadRequestException('Réservation expirée');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });
  }

  async cancelBooking(bookingId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.userId !== userId) {
        throw new NotFoundException('Réservation introuvable');
      }

      if (booking.status === BookingStatus.CONFIRMED) {
        throw new BadRequestException(
          "Impossible d'annuler une réservation confirmée",
        );
      }

      await tx.ticketCategory.update({
        where: { id: booking.ticketCategoryId },
        data: { currentStock: { increment: booking.quantity } },
      });

      return tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });
    });
  }

  async getUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        ticketCategory: {
          include: { event: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async expireOldBookings() {
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
    });

    for (const booking of expiredBookings) {
      await this.prisma.$transaction(async (tx) => {
        await tx.ticketCategory.update({
          where: { id: booking.ticketCategoryId },
          data: { currentStock: { increment: booking.quantity } },
        });

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.EXPIRED },
        });
      });
    }

    return { expired: expiredBookings.length };
  }
}
