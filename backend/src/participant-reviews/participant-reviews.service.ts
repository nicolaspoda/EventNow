import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParticipantReviewDto } from './dto/create-participant-review.dto';
import { UpdateParticipantReviewDto } from './dto/update-participant-review.dto';
import { EventType, ParticipationRequestStatus } from '@prisma/client';

@Injectable()
export class ParticipantReviewsService {
  constructor(private prisma: PrismaService) {}

  private isEventPast(eventDate: Date | string | null): boolean {
    if (eventDate == null) return true;
    const d = new Date(eventDate);
    if (Number.isNaN(d.getTime())) return true;
    return d <= new Date();
  }

  async create(reviewerId: string, dto: CreateParticipantReviewDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { organizer: true },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.type !== EventType.COMMUNITY) {
      throw new BadRequestException(
        'Les avis sur les participants concernent uniquement les événements communautaires.',
      );
    }

    if (!this.isEventPast(event.eventDate)) {
      throw new BadRequestException(
        "Vous ne pouvez laisser un avis qu'après la date de l'événement",
      );
    }

    if (event.organizerId !== reviewerId) {
      throw new ForbiddenException(
        "Seul l'organisateur de l'événement peut laisser un avis sur un participant",
      );
    }

    if (reviewerId === dto.participantId) {
      throw new BadRequestException(
        'Vous ne pouvez pas laisser un avis sur vous-même',
      );
    }

    const participationRequest =
      await this.prisma.participationRequest.findUnique({
        where: {
          eventId_userId: {
            eventId: dto.eventId,
            userId: dto.participantId,
          },
        },
      });

    if (
      !participationRequest ||
      participationRequest.status !== ParticipationRequestStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        "Ce participant n'a pas été accepté pour cet événement",
      );
    }

    const existingReview = await this.prisma.participantReview.findUnique({
      where: {
        eventId_reviewerId_participantId: {
          eventId: dto.eventId,
          reviewerId: reviewerId,
          participantId: dto.participantId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'Vous avez déjà laissé un avis sur ce participant pour cet événement',
      );
    }

    return this.prisma.participantReview.create({
      data: {
        eventId: dto.eventId,
        reviewerId: reviewerId,
        participantId: dto.participantId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        participant: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  async findAllByParticipant(participantId: string) {
    const reviews = await this.prisma.participantReview.findMany({
      where: { participantId },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = await this.prisma.participantReview.aggregate({
      where: { participantId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      reviews,
      stats: {
        averageRating: avgRating._avg.rating
          ? Math.round(avgRating._avg.rating * 10) / 10
          : null,
        totalReviews: avgRating._count.rating,
      },
    };
  }

  async findAllByEvent(eventId: string, organizerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException(
        "Seul l'organisateur peut consulter les avis de cet événement",
      );
    }

    return this.prisma.participantReview.findMany({
      where: { eventId },
      include: {
        participant: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    reviewId: string,
    reviewerId: string,
    dto: UpdateParticipantReviewDto,
  ) {
    const review = await this.prisma.participantReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Avis introuvable');
    }

    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres avis',
      );
    }

    return this.prisma.participantReview.update({
      where: { id: reviewId },
      data: dto,
    });
  }

  async delete(reviewId: string, reviewerId: string) {
    const review = await this.prisma.participantReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Avis introuvable');
    }

    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres avis',
      );
    }

    return this.prisma.participantReview.delete({
      where: { id: reviewId },
    });
  }

  async getParticipantsForEvent(eventId: string, organizerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException(
        "Seul l'organisateur peut consulter les participants",
      );
    }


    const acceptedParticipants =
      await this.prisma.participationRequest.findMany({
        where: {
          eventId,
          status: ParticipationRequestStatus.ACCEPTED,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

    const participantsWithReviews = await Promise.all(
      acceptedParticipants.map(async (pr) => {
        const existingReview = await this.prisma.participantReview.findUnique({
          where: {
            eventId_reviewerId_participantId: {
              eventId,
              reviewerId: organizerId,
              participantId: pr.userId,
            },
          },
        });

        return {
          ...pr.user,
          hasReview: !!existingReview,
          review: existingReview,
        };
      }),
    );

    return participantsWithReviews;
  }
}
