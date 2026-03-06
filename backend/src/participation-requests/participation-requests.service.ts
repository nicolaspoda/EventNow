import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventType, ParticipationRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateParticipationRequestDto,
  RespondToParticipationRequestDto,
} from './dto';

@Injectable()
export class ParticipationRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateParticipationRequestDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { ticketCategories: true },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.type !== EventType.COMMUNITY) {
      throw new BadRequestException(
        'Les demandes de participation concernent uniquement les événements communautaires.',
      );
    }

    if (event.organizerId === userId) {
      throw new BadRequestException(
        "L'organisateur ne peut pas demander à participer à son propre événement.",
      );
    }

    const existing = await this.prisma.participationRequest.findUnique({
      where: {
        eventId_userId: { eventId: dto.eventId, userId },
      },
    });
    if (existing) {
      throw new BadRequestException(
        existing.status === ParticipationRequestStatus.PENDING
          ? 'Vous avez déjà une demande en attente pour cet événement.'
          : `Votre demande a déjà été ${existing.status === 'ACCEPTED' ? 'acceptée' : 'refusée'}.`,
      );
    }

    const participationCategory = event.ticketCategories?.find(
      (c) => c.name === 'Participation',
    );
    const totalPlaces = participationCategory?.currentStock ?? 0;
    const acceptedCount = await this.prisma.participationRequest.count({
      where: { eventId: dto.eventId, status: ParticipationRequestStatus.ACCEPTED },
    });
    if (event.ticketCategories?.length > 0 && totalPlaces > 0 && acceptedCount >= totalPlaces) {
      throw new BadRequestException('Il n\'y a plus de places disponibles pour cet événement.');
    }

    const request = await this.prisma.participationRequest.create({
      data: {
        eventId: dto.eventId,
        userId,
        status: ParticipationRequestStatus.PENDING,
      },
      include: {
        event: { select: { title: true } },
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    const requesterLabel =
      request.user.firstName && request.user.lastName
        ? `${request.user.firstName} ${request.user.lastName}`
        : request.user.email;

    await this.prisma.notification.create({
      data: {
        userId: event.organizerId,
        type: 'PARTICIPATION_REQUEST',
        title: 'Nouvelle demande de participation',
        body: `${requesterLabel} a demandé à participer à « ${request.event.title} ».`,
        relatedId: request.id,
      },
    });

    return request;
  }

  async getByEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, type: true },
    });
    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }
    if (event.organizerId !== userId) {
      throw new ForbiddenException(
        "Seul l'organisateur peut consulter les demandes de participation.",
      );
    }

    return this.prisma.participationRequest.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyRequests(userId: string) {
    return this.prisma.participationRequest.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            location: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyRequestForEvent(eventId: string, userId: string) {
    return this.prisma.participationRequest.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
      include: {
        event: { select: { id: true, title: true } },
      },
    });
  }

  async getPendingRequestsForOrganizer(userId: string) {
    const events = await this.prisma.event.findMany({
      where: { organizerId: userId, type: EventType.COMMUNITY },
      select: { id: true, title: true, eventDate: true },
    });
    const eventIds = events.map((e) => e.id);
    const requests = await this.prisma.participationRequest.findMany({
      where: {
        eventId: { in: eventIds },
        status: ParticipationRequestStatus.PENDING,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return requests;
  }

  async respond(
    requestId: string,
    userId: string,
    dto: RespondToParticipationRequestDto,
  ) {
    const request = await this.prisma.participationRequest.findUnique({
      where: { id: requestId },
      include: {
        event: {
          include: { ticketCategories: true },
        },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }
    if (request.event.organizerId !== userId) {
      throw new ForbiddenException(
        "Seul l'organisateur de l'événement peut accepter ou refuser une demande.",
      );
    }
    if (request.status !== ParticipationRequestStatus.PENDING) {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    const status =
      dto.action === 'ACCEPT'
        ? ParticipationRequestStatus.ACCEPTED
        : ParticipationRequestStatus.REFUSED;

    const participationCategory = request.event.ticketCategories?.find(
      (c) => c.name === 'Participation',
    );

    return this.prisma.$transaction(async (tx) => {
      if (dto.action === 'ACCEPT' && participationCategory) {
        if (participationCategory.currentStock < 1) {
          throw new BadRequestException(
            'Il n\'y a plus de places disponibles pour cet événement.',
          );
        }
        await tx.ticketCategory.update({
          where: { id: participationCategory.id },
          data: { currentStock: { decrement: 1 } },
        });
      }

      const updated = await tx.participationRequest.update({
        where: { id: requestId },
        data: {
          status,
          respondedAt: new Date(),
        },
        include: {
          event: { select: { title: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      await tx.notification.create({
        data: {
          userId: request.userId,
          type:
            dto.action === 'ACCEPT'
              ? 'PARTICIPATION_ACCEPTED'
              : 'PARTICIPATION_REFUSED',
          title:
            dto.action === 'ACCEPT'
              ? 'Demande acceptée'
              : 'Demande refusée',
          body:
            dto.action === 'ACCEPT'
              ? `Votre demande pour participer à « ${updated.event.title} » a été acceptée.`
              : `Votre demande pour participer à « ${updated.event.title} » a été refusée.`,
          relatedId: request.eventId,
        },
      });

      return updated;
    });
  }
}
