import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EventType } from '@prisma/client';
import { CreateStaffInvitationDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class StaffInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService,
    private readonly messagesGateway: MessagesGateway,
    private readonly logger: CustomLoggerService,
  ) {}

  private handlePrismaError(err: unknown, context: string): never {
    if (
      err instanceof BadRequestException ||
      err instanceof ConflictException ||
      err instanceof NotFoundException
    ) {
      throw err;
    }
    const prismaError = err as { code?: string; message?: string };
    if (prismaError?.code === 'P2003') {
      throw new BadRequestException(
        'Événement ou donnée introuvable. Rechargez la page et réessayez.',
      );
    }
    if (prismaError?.code === 'P2002') {
      throw new ConflictException(
        'Une invitation existe déjà pour cette combinaison email / événement.',
      );
    }
    if (prismaError?.code === 'P2021' || prismaError?.code === 'P2018') {
      throw new BadRequestException(
        "La base de données n'est pas à jour. Exécutez : npx prisma migrate deploy",
      );
    }
    const msg =
      typeof prismaError?.message === 'string' ? prismaError.message : '';
    if (
      msg.includes('Unknown arg') ||
      msg.includes('column') ||
      msg.includes('relation') ||
      msg.includes('does not exist')
    ) {
      throw new BadRequestException(
        "La base de données n'est pas à jour. Exécutez : npx prisma migrate deploy",
      );
    }
    this.logger.error(`[StaffInvitations] ${context} error: ${(err as Error).message}`, (err as Error).stack, 'StaffInvitationsService');
    throw new BadRequestException(
      'Une erreur est survenue. Vérifiez que la base de données est à jour (npx prisma migrate deploy).',
    );
  }

  async createInvitation(invitedById: string, dto: CreateStaffInvitationDto) {
    try {
      return await this.doCreateInvitation(invitedById, dto);
    } catch (err) {
      this.handlePrismaError(err, 'createInvitation');
    }
  }

  private async doCreateInvitation(
    invitedById: string,
    dto: CreateStaffInvitationDto,
  ) {
    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedById },
    });

    if (!inviter || inviter.role !== 'ORGANIZER') {
      throw new BadRequestException(
        'Seuls les organisateurs peuvent inviter des membres du staff',
      );
    }

    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event || event.organizerId !== invitedById) {
      throw new BadRequestException(
        "Événement introuvable ou vous n'en êtes pas l'organisateur",
      );
    }

    if (event.type !== EventType.PROFESSIONAL) {
      throw new BadRequestException(
        'Seuls les événements professionnels peuvent avoir du staff',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!existingUser) {
      throw new BadRequestException(
        "Aucun compte n'existe avec cette adresse email. La personne doit d'abord s'inscrire sur la plateforme.",
      );
    }

    const alreadyStaffForEvent = await this.prisma.eventStaff.findUnique({
      where: {
        eventId_userId: { eventId: dto.eventId, userId: existingUser.id },
      },
    });
    if (alreadyStaffForEvent) {
      throw new ConflictException(
        'Cet utilisateur est déjà staff pour cet événement',
      );
    }

    const existingInvitation = await this.prisma.staffInvitation.findFirst({
      where: {
        email: dto.email,
        eventId: dto.eventId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'Une invitation en attente existe déjà pour cet email sur cet événement',
      );
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.staffInvitation.create({
      data: {
        email: dto.email,
        token,
        eventId: dto.eventId,
        invitedById,
        expiresAt,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    await this.notificationsService.create({
      userId: existingUser.id,
      type: 'STAFF_INVITATION',
      title: 'Invitation staff',
      body: `${invitation.invitedBy?.username || invitation.invitedBy?.email} vous invite à rejoindre le staff pour l'événement « ${invitation.event.title} ». Vous pourrez valider les billets à l'entrée.`,
      relatedId: invitation.token,
    });

    this.messagesGateway.emitNewNotificationToUser(existingUser.id);

    return invitation;
  }

  async getInvitationByToken(token: string) {
    try {
      const invitation = await this.prisma.staffInvitation.findUnique({
        where: { token },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new NotFoundException('Invitation non trouvée');
      }

      if (invitation.status !== 'PENDING') {
        throw new BadRequestException('Cette invitation a déjà été utilisée');
      }

      if (invitation.expiresAt < new Date()) {
        await this.prisma.staffInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
        throw new BadRequestException('Cette invitation a expiré');
      }

      return invitation;
    } catch (err) {
      this.handlePrismaError(err, 'getInvitationByToken');
    }
  }

  async acceptInvitation(userId: string, token: string) {
    try {
      const invitation = await this.getInvitationByToken(token);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      if (user.email !== invitation.email) {
        throw new BadRequestException(
          'Cette invitation est destinée à une autre adresse email',
        );
      }

      const alreadyStaffForEvent = await this.prisma.eventStaff.findUnique({
        where: {
          eventId_userId: { eventId: invitation.eventId, userId },
        },
      });

      if (alreadyStaffForEvent) {
        throw new BadRequestException(
          'Vous êtes déjà staff pour cet événement',
        );
      }

      await this.prisma.$transaction([
        this.prisma.eventStaff.create({
          data: { eventId: invitation.eventId, userId },
        }),
        this.prisma.staffInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedById: userId,
          },
        }),
      ]);

      await this.notificationsService.deleteByTypeAndRelatedId(
        userId,
        'STAFF_INVITATION',
        token,
      );

      const updatedUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true, role: true },
      });
      if (!updatedUser) {
        return { message: 'Invitation acceptée avec succès' };
      }
      const tokens = await this.authService.generateTokens(
        updatedUser.id,
        updatedUser.email,
        updatedUser.role,
      );
      return {
        message: 'Invitation acceptée avec succès',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
        },
        ...tokens,
      };
    } catch (err) {
      this.handlePrismaError(err, 'acceptInvitation');
    }
  }

  async declineInvitation(userId: string, token: string) {
    try {
      const invitation = await this.getInvitationByToken(token);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      if (user.email !== invitation.email) {
        throw new BadRequestException(
          'Cette invitation est destinée à une autre adresse email',
        );
      }

      await this.prisma.staffInvitation.update({
        where: { id: invitation.id },
        data: { status: 'DECLINED' },
      });

      await this.notificationsService.deleteByTypeAndRelatedId(
        userId,
        'STAFF_INVITATION',
        invitation.token,
      );

      return { message: 'Invitation refusée' };
    } catch (err) {
      this.handlePrismaError(err, 'declineInvitation');
    }
  }

  async getMyInvitations(organizerId: string) {
    try {
      return await this.prisma.staffInvitation.findMany({
        where: { invitedById: organizerId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
            },
          },
          acceptedBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      this.handlePrismaError(err, 'getMyInvitations');
    }
  }

  async getPendingInvitationsForEmail(email: string) {
    try {
      return await this.prisma.staffInvitation.findMany({
        where: {
          email,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      this.handlePrismaError(err, 'getPendingInvitationsForEmail');
    }
  }

  async cancelInvitation(organizerId: string, invitationId: string) {
    try {
      const invitation = await this.prisma.staffInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        throw new NotFoundException('Invitation non trouvée');
      }

      if (invitation.invitedById !== organizerId) {
        throw new BadRequestException(
          'Vous ne pouvez annuler que vos propres invitations',
        );
      }

      if (invitation.status !== 'PENDING') {
        throw new BadRequestException(
          'Seules les invitations en attente peuvent être annulées',
        );
      }

      const invitedUser = await this.prisma.user.findUnique({
        where: { email: invitation.email },
        select: { id: true },
      });

      await this.prisma.staffInvitation.delete({
        where: { id: invitationId },
      });

      if (invitedUser) {
        await this.notificationsService.deleteByTypeAndRelatedId(
          invitedUser.id,
          'STAFF_INVITATION',
          invitation.token,
        );
        this.messagesGateway.emitNewNotificationToUser(invitedUser.id);
      }

      return { message: 'Invitation annulée' };
    } catch (err) {
      this.handlePrismaError(err, 'cancelInvitation');
    }
  }
}
