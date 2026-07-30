import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportType, ReportReason, ReportStatus } from '@prisma/client';

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockReportsService = {
    createReport: jest.fn(),
    getMyReports: jest.fn(),
    getAllReports: jest.fn(),
    updateReportStatus: jest.fn(),
  };

  const mockUser = { id: 'user-1', email: 'alice@example.com', role: 'USER' };

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
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('delegates to reportsService.createReport with user id', async () => {
      mockReportsService.createReport.mockResolvedValue(mockReport);

      const dto = {
        type: ReportType.EVENT,
        reason: ReportReason.SPAM,
        targetEventId: 'event-1',
      };

      const result = await controller.createReport(dto, mockUser as any);

      expect(result).toEqual(mockReport);
      expect(mockReportsService.createReport).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
    });
  });

  describe('getMyReports', () => {
    it('delegates to reportsService.getMyReports with user id', async () => {
      mockReportsService.getMyReports.mockResolvedValue([mockReport]);

      const result = await controller.getMyReports(mockUser as any);

      expect(result).toEqual([mockReport]);
      expect(mockReportsService.getMyReports).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getAllReports', () => {
    it('delegates to reportsService.getAllReports with the status filter', async () => {
      mockReportsService.getAllReports.mockResolvedValue([mockReport]);

      const result = await controller.getAllReports(ReportStatus.PENDING);

      expect(result).toEqual([mockReport]);
      expect(mockReportsService.getAllReports).toHaveBeenCalledWith(
        ReportStatus.PENDING,
      );
    });

    it('delegates to reportsService.getAllReports without a status filter', async () => {
      mockReportsService.getAllReports.mockResolvedValue([mockReport]);

      const result = await controller.getAllReports();

      expect(result).toEqual([mockReport]);
      expect(mockReportsService.getAllReports).toHaveBeenCalledWith(undefined);
    });
  });

  describe('updateReportStatus', () => {
    it('delegates to reportsService.updateReportStatus with id and status', async () => {
      const updatedReport = { ...mockReport, status: ReportStatus.RESOLVED };
      mockReportsService.updateReportStatus.mockResolvedValue(updatedReport);

      const result = await controller.updateReportStatus('report-1', {
        status: ReportStatus.RESOLVED,
      });

      expect(result).toEqual(updatedReport);
      expect(mockReportsService.updateReportStatus).toHaveBeenCalledWith(
        'report-1',
        ReportStatus.RESOLVED,
      );
    });
  });
});
