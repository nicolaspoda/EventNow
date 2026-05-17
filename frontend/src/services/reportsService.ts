import { api } from './api';

export type ReportType = 'EVENT' | 'USER';
export type ReportReason =
  | 'INAPPROPRIATE_CONTENT'
  | 'SPAM'
  | 'FAKE_EVENT'
  | 'HARASSMENT'
  | 'SCAM'
  | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';

export interface CreateReportDto {
  type: ReportType;
  reason: ReportReason;
  description?: string;
  targetUserId?: string;
  targetEventId?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  type: ReportType;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  targetUserId: string | null;
  targetEventId: string | null;
  targetEvent: { id: string; title: string } | null;
  targetUser: { id: string; username: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export const reportsService = {
  async createReport(dto: CreateReportDto): Promise<Report> {
    const response = await api.post<Report>('/reports', dto);
    return response.data;
  },

  async getMyReports(): Promise<Report[]> {
    const response = await api.get<Report[]>('/reports/my');
    return response.data;
  },
};
