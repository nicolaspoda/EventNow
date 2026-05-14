import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { ValidateTicketDto } from './dto';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EventStaffGuard } from '../auth/guards/event-staff.guard';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  private readonly ticketsService: TicketsService;

  constructor(ticketsService: TicketsService) {
    this.ticketsService = ticketsService;
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateTicket(@Body() dto: ValidateTicketDto, @CurrentUser() user: AuthUser) {
    return this.ticketsService.validateTicket(dto.qrCode, user.id);
  }

  @Get('validations/stats')
  @UseGuards(EventStaffGuard)
  @HttpCode(HttpStatus.OK)
  getValidationStats(
    @Query('event_id') eventId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.getValidationStats(eventId, user.id);
  }

  @Get('validations')
  @HttpCode(HttpStatus.OK)
  getValidations(
    @CurrentUser() user: AuthUser,
    @Query('event_id') eventId?: string,
  ) {
    return this.ticketsService.getStaffValidations(user.id, eventId);
  }

  @Get('staff-events')
  @HttpCode(HttpStatus.OK)
  getStaffEvents(@CurrentUser() user: AuthUser) {
    return this.ticketsService.getStaffEvents(user.id);
  }

  @Get('my-tickets')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getMyTickets(@CurrentUser() user: AuthUser) {
    return this.ticketsService.getUserTickets(user.id);
  }

  @Get('qr/:qrCode')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getTicketByQRCode(@Param('qrCode') qrCode: string) {
    return this.ticketsService.getTicketByQRCode(qrCode);
  }

  @Get('download/:id')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  async downloadTicket(
    @Param('id') ticketId: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.ticketsService.generateTicketPDF(
      ticketId,
      user.id,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=ticket-${ticketId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
