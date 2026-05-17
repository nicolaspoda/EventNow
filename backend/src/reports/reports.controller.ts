import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createReport(@Body() dto: CreateReportDto, @CurrentUser() user: AuthUser) {
    return this.reportsService.createReport(user.id, dto);
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  getMyReports(@CurrentUser() user: AuthUser) {
    return this.reportsService.getMyReports(user.id);
  }
}
