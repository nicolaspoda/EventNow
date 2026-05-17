import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    const { type, reason, description, targetUserId, targetEventId } = dto;

    if (!targetUserId && !targetEventId) {
      throw new BadRequestException(
        'Must provide either targetUserId or targetEventId',
      );
    }

    if (targetUserId && targetEventId) {
      throw new BadRequestException(
        'Cannot provide both targetUserId and targetEventId',
      );
    }

    if (type === 'EVENT' && !targetEventId) {
      throw new BadRequestException(
        'Must provide targetEventId for EVENT report type',
      );
    }

    if (type === 'USER' && !targetUserId) {
      throw new BadRequestException(
        'Must provide targetUserId for USER report type',
      );
    }

    if (type === 'USER' && targetUserId === reporterId) {
      throw new BadRequestException('Cannot report yourself');
    }

    if (type === 'USER' && targetUserId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: targetUserId },
      });
      if (!targetUser) {
        throw new NotFoundException('User not found');
      }
    }

    if (type === 'EVENT' && targetEventId) {
      const targetEvent = await this.prisma.event.findUnique({
        where: { id: targetEventId },
      });
      if (!targetEvent) {
        throw new NotFoundException('Event not found');
      }
    }

    try {
      return await this.prisma.report.create({
        data: {
          reporterId,
          type,
          reason,
          description,
          targetUserId: targetUserId ?? null,
          targetEventId: targetEventId ?? null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You have already reported this');
      }
      throw error;
    }
  }

  async getMyReports(userId: string) {
    return this.prisma.report.findMany({
      where: { reporterId: userId },
      include: {
        targetEvent: { select: { id: true, title: true } },
        targetUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
