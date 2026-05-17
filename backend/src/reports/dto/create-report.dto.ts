import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportType, ReportReason } from '@prisma/client';

export class CreateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  targetEventId?: string;
}
