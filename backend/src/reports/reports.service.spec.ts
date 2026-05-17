import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ReportType, ReportReason, ReportStatus, Prisma } from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    event: { findUnique: jest.fn() },
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockUser = { id: 'user-1', username: 'alice' };
  const mockTargetUser = { id: 'user-2', username: 'bob' };
  const mockEvent = { id: 'event-1', title: 'Cool Event' };

  const mockReport = {
    id: 'report-1',
    reporterId: 'user-1',
    type: ReportType.EVENT,
    reason: ReportReason.SPAM,
    description: null,
    status: ReportStatus.PENDING,
    targetUserId: null,
    targetEventId: 'event-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── createReport ───────────────────────────────────────────────────────────

  describe('createReport', () => {
    it('creates a report on an event successfully', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.report.create.mockResolvedValue(mockReport);

      const result = await service.createReport('user-1', {
        type: ReportType.EVENT,
        reason: ReportReason.SPAM,
        targetEventId: 'event-1',
      });

      expect(result).toEqual(mockReport);
      expect(mockPrismaService.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reporterId: 'user-1',
          type: ReportType.EVENT,
          targetEventId: 'event-1',
          targetUserId: null,
        }),
      });
    });

    it('creates a report on a user successfully', async () => {
      const userReport = {
        ...mockReport,
        type: ReportType.USER,
        targetUserId: 'user-2',
        targetEventId: null,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockTargetUser);
      mockPrismaService.report.create.mockResolvedValue(userReport);

      const result = await service.createReport('user-1', {
        type: ReportType.USER,
        reason: ReportReason.HARASSMENT,
        targetUserId: 'user-2',
      });

      expect(result.type).toBe(ReportType.USER);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-2' },
      });
    });

    it('throws BadRequestException when neither target is provided', async () => {
      await expect(
        service.createReport('user-1', {
          type: ReportType.EVENT,
          reason: ReportReason.SPAM,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when both targets are provided', async () => {
      await expect(
        service.createReport('user-1', {
          type: ReportType.EVENT,
          reason: ReportReason.SPAM,
          targetUserId: 'user-2',
          targetEventId: 'event-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when reporting yourself', async () => {
      await expect(
        service.createReport('user-1', {
          type: ReportType.USER,
          reason: ReportReason.SPAM,
          targetUserId: 'user-1',
        }),
      ).rejects.toThrow(new BadRequestException('Cannot report yourself'));
    });

    it('throws NotFoundException when target event does not exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(
        service.createReport('user-1', {
          type: ReportType.EVENT,
          reason: ReportReason.SPAM,
          targetEventId: 'nonexistent-event',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when target user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createReport('user-1', {
          type: ReportType.USER,
          reason: ReportReason.HARASSMENT,
          targetUserId: 'nonexistent-user',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when already reported (P2002)', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0', meta: {} },
      );
      mockPrismaService.report.create.mockRejectedValue(prismaError);

      await expect(
        service.createReport('user-1', {
          type: ReportType.EVENT,
          reason: ReportReason.SPAM,
          targetEventId: 'event-1',
        }),
      ).rejects.toThrow(new ConflictException('You have already reported this'));
    });

    it('throws BadRequestException when type is EVENT but targetUserId is provided', async () => {
      await expect(
        service.createReport('user-1', {
          type: ReportType.EVENT,
          reason: ReportReason.SPAM,
          targetUserId: 'user-2',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when type is USER but targetEventId is provided', async () => {
      await expect(
        service.createReport('user-1', {
          type: ReportType.USER,
          reason: ReportReason.HARASSMENT,
          targetEventId: 'event-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getMyReports ───────────────────────────────────────────────────────────

  describe('getMyReports', () => {
    it('returns reports submitted by the user with target info', async () => {
      const reports = [
        {
          ...mockReport,
          targetEvent: { id: 'event-1', title: 'Cool Event' },
          targetUser: null,
        },
      ];
      mockPrismaService.report.findMany.mockResolvedValue(reports);

      const result = await service.getMyReports('user-1');

      expect(result).toEqual(reports);
      expect(mockPrismaService.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { reporterId: 'user-1' } }),
      );
    });

    it('returns empty array when user has no reports', async () => {
      mockPrismaService.report.findMany.mockResolvedValue([]);

      const result = await service.getMyReports('user-1');

      expect(result).toEqual([]);
    });
  });
});
