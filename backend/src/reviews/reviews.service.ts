import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retourne true si l'utilisateur a assisté à l'événement (billet validé ou participation acceptée pour événement communautaire).
   */
  private async hasAttended(
    eventId: string,
    userId: string,
    eventType: EventType,
  ): Promise<boolean> {
    if (eventType === EventType.COMMUNITY) {
      const participation = await this.prisma.participationRequest.findUnique({
        where: {
          eventId_userId: { eventId, userId },
          status: 'ACCEPTED',
        },
      });
      return !!participation;
    }
    const hasAttended = await this.prisma.ticket.findFirst({
      where: {
        order: { userId },
        ticketCategory: { eventId },
        validatedAt: { not: null },
      },
    });
    return !!hasAttended;
  }

  /**
   * Retourne true si l'événement est considéré comme passé (ou date absente/invalide).
   */
  private isEventPast(eventDate: Date | string | null): boolean {
    if (eventDate == null) return true;
    const d = new Date(eventDate);
    if (Number.isNaN(d.getTime())) return true;
    return d <= new Date();
  }

  async create(eventId: string, userId: string, dto: CreateReviewDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (!this.isEventPast(event.eventDate)) {
      throw new BadRequestException(
        "Vous ne pouvez laisser un avis qu'après la date de l'événement",
      );
    }

    const attended = await this.hasAttended(eventId, userId, event.type);
    if (!attended) {
      throw new ForbiddenException(
        'Vous ne pouvez laisser un avis que sur un événement auquel vous avez assisté',
      );
    }

    const existingReview = await this.prisma.review.findUnique({
      where: {
        event_id_user_id: {
          eventId: eventId,
          userId: userId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'Vous avez déjà laissé un avis sur cet événement',
      );
    }

    return this.prisma.review.create({
      data: {
        eventId: eventId,
        userId: userId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async findAllByEvent(
    eventId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: 'recent' | 'highest' | 'lowest' = 'recent',
  ) {
    let orderBy: any = { createdAt: 'desc' };

    if (sortBy === 'highest') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'lowest') {
      orderBy = { rating: 'asc' };
    }

    const skip = (page - 1) * limit;

    const [reviews, total, avgRating] = await Promise.all([
      this.prisma.review.findMany({
        where: { eventId: eventId },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { eventId: eventId },
      }),
      this.prisma.review.aggregate({
        where: { eventId: eventId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      reviews: reviews.map((review) => ({
        ...review,
        user: {
          email: this.maskEmail(review.user.email),
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: avgRating._avg.rating
          ? Math.round(avgRating._avg.rating * 10) / 10
          : null,
        totalReviews: avgRating._count.rating,
      },
    };
  }

  async findAllByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { userId: userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async canUserReview(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { canReview: false, reason: 'Événement introuvable' };
    }

    if (!this.isEventPast(event.eventDate)) {
      return { canReview: false, reason: 'Événement pas encore passé' };
    }

    const attended = await this.hasAttended(eventId, userId, event.type);
    if (!attended) {
      return {
        canReview: false,
        reason: "Vous n'avez pas assisté à cet événement",
      };
    }

    const existingReview = await this.prisma.review.findUnique({
      where: {
        event_id_user_id: {
          eventId: eventId,
          userId: userId,
        },
      },
    });

    if (existingReview) {
      return { canReview: false, reason: 'Vous avez déjà laissé un avis' };
    }

    return { canReview: true };
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Avis introuvable');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres avis',
      );
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: dto,
    });
  }

  async delete(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Avis introuvable');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres avis',
      );
    }

    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    const maskedName = name[0] + '*'.repeat(Math.min(name.length - 1, 3));
    return `${maskedName}@${domain}`;
  }
}
