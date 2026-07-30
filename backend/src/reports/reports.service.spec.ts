import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    event: { findUnique: jest.fn() },
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockReport = {
    id: 'report-1',
    reporterId: 'user-1',
    type: 'USER',
    reason: 'SPAM',
    description: 'Test description',
    targetUserId: 'user-2',
    targetEventId: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('should throw BadRequestException if neither targetUserId nor targetEventId', async () => {
      await expect(
        service.createReport('user-1', { type: 'USER', reason: 'SPAM' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if both targetUserId and targetEventId', async () => {
      await expect(
        service.createReport('user-1', {
          type: 'USER',
          reason: 'SPAM',
          targetUserId: 'user-2',
          targetEventId: 'event-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if EVENT type without targetEventId', async () => {
      await expect(
        service.createReport('user-1', {
          type: 'EVENT',
          reason: 'SPAM',
          targetUserId: 'user-2',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if USER type without targetUserId', async () => {
      await expect(
        service.createReport('user-1', {
          type: 'USER',
          reason: 'SPAM',
          targetEventId: 'event-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if reporting yourself', async () => {
      await expect(
        service.createReport('user-1', {
          type: 'USER',
          reason: 'SPAM',
          targetUserId: 'user-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.createReport('user-1', {
          type: 'USER',
          reason: 'SPAM',
          targetUserId: 'user-2',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(
        service.createReport('user-1', {
          type: 'EVENT',
          reason: 'SPAM',
          targetEventId: 'event-1',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create USER report successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-2' });
      mockPrismaService.report.create.mockResolvedValue(mockReport);

      const result = await service.createReport('user-1', {
        type: 'USER',
        reason: 'SPAM',
        description: 'Test',
        targetUserId: 'user-2',
      } as any);
      expect(result).toEqual(mockReport);
    });

    it('should create EVENT report successfully', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.report.create.mockResolvedValue({
        ...mockReport,
        type: 'EVENT',
        targetEventId: 'event-1',
        targetUserId: null,
      });

      const result = await service.createReport('user-1', {
        type: 'EVENT',
        reason: 'INAPPROPRIATE',
        targetEventId: 'event-1',
      } as any);
      expect(result.type).toBe('EVENT');
    });

    it('should throw ConflictException on duplicate report (P2002)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-2' });
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0' },
      );
      mockPrismaService.report.create.mockRejectedValue(prismaError);

      await expect(
        service.createReport('user-1', {
          type: 'USER',
          reason: 'SPAM',
          targetUserId: 'user-2',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow non-P2002 Prisma errors', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-2' });
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.0' },
      );
      mockPrismaService.report.create.mockRejectedValue(prismaError);

      await expect(
        service.createReport('user-1', {
          type: 'USER',
          reason: 'SPAM',
          targetUserId: 'user-2',
        } as any),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });

    it('should rethrow generic errors', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-2' });
      mockPrismaService.report.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.createReport('user-1', {
          type: 'USER',
          reason: 'SPAM',
          targetUserId: 'user-2',
        } as any),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getMyReports', () => {
    it('should return reports for user', async () => {
      mockPrismaService.report.findMany.mockResolvedValue([mockReport]);
      const result = await service.getMyReports('user-1');
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no reports', async () => {
      mockPrismaService.report.findMany.mockResolvedValue([]);
      const result = await service.getMyReports('user-1');
      expect(result).toHaveLength(0);
    });
  });

  describe('getAllReports', () => {
    it('should filter by status when provided', async () => {
      mockPrismaService.report.findMany.mockResolvedValue([mockReport]);

      const result = await service.getAllReports('PENDING' as any);

      expect(result).toEqual([mockReport]);
      expect(mockPrismaService.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PENDING' } }),
      );
    });

    it('should return all reports when no status is provided', async () => {
      mockPrismaService.report.findMany.mockResolvedValue([mockReport]);

      const result = await service.getAllReports();

      expect(result).toEqual([mockReport]);
      expect(mockPrismaService.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  describe('updateReportStatus', () => {
    it('should throw NotFoundException if report does not exist', async () => {
      mockPrismaService.report.findUnique.mockResolvedValue(null);

      await expect(
        service.updateReportStatus('report-1', 'RESOLVED' as any),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.report.update).not.toHaveBeenCalled();
    });

    it('should update the report status', async () => {
      mockPrismaService.report.findUnique.mockResolvedValue(mockReport);
      mockPrismaService.report.update.mockResolvedValue({
        ...mockReport,
        status: 'RESOLVED',
      });

      const result = await service.updateReportStatus(
        'report-1',
        'RESOLVED' as any,
      );

      expect(result.status).toBe('RESOLVED');
      expect(mockPrismaService.report.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: { status: 'RESOLVED' },
      });
    });
  });
});
