import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffInvitationDto } from './dto';

@Injectable()
export class StaffInvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvitation(invitedById: string, dto: CreateStaffInvitationDto) {
    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedById },
    });

    if (!inviter || inviter.role !== 'ORGANIZER') {
      throw new BadRequestException(
        'Seuls les organisateurs peuvent inviter des membres du staff',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.role === 'STAFF') {
      throw new ConflictException('Cet utilisateur est déjà membre du staff');
    }

    const existingInvitation = await this.prisma.staffInvitation.findFirst({
      where: {
        email: dto.email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'Une invitation en attente existe déjà pour cet email',
      );
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.staffInvitation.create({
      data: {
        email: dto.email,
        token,
        invitedById,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return invitation;
  }

  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.staffInvitation.findUnique({
      where: { token },
      include: {
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
  }

  async acceptInvitation(userId: string, token: string) {
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

    if (user.role === 'STAFF') {
      throw new BadRequestException('Vous êtes déjà membre du staff');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { role: 'STAFF' },
      }),
      this.prisma.staffInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: userId,
        },
      }),
    ]);

    return { message: 'Invitation acceptée avec succès' };
  }

  async declineInvitation(userId: string, token: string) {
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

    return { message: 'Invitation refusée' };
  }

  async getMyInvitations(organizerId: string) {
    return this.prisma.staffInvitation.findMany({
      where: { invitedById: organizerId },
      include: {
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
  }

  async getPendingInvitationsForEmail(email: string) {
    return this.prisma.staffInvitation.findMany({
      where: {
        email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
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
  }

  async cancelInvitation(organizerId: string, invitationId: string) {
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

    await this.prisma.staffInvitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitation annulée' };
  }
}
