import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getBannedUsers() {
    return this.prisma.user.findMany({
      where: { isBanned: true },
      select: { id: true, username: true, email: true, bannedAt: true },
      orderBy: { bannedAt: 'desc' },
    });
  }

  async banUser(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new BadRequestException('Vous ne pouvez pas vous bannir vous-même');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${targetUserId} introuvable`);
    }
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Impossible de bannir un administrateur');
    }

    const isBanned = !user.isBanned;
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned, bannedAt: isBanned ? new Date() : null },
      select: { id: true, username: true, email: true, isBanned: true },
    });
  }
}
