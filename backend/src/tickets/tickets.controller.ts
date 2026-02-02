import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { ValidateTicketDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  private readonly ticketsService: TicketsService;

  constructor(ticketsService: TicketsService) {
    this.ticketsService = ticketsService;
  }

  @Post('validate')
  @Roles('STAFF')
  @HttpCode(HttpStatus.OK)
  validateTicket(@Body() dto: ValidateTicketDto, @CurrentUser() user: any) {
    return this.ticketsService.validateTicket(dto.qrCode, user.id);
  }

  @Get('my-tickets')
  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  getMyTickets(@CurrentUser() user: any) {
    return this.ticketsService.getUserTickets(user.id);
  }

  @Get('qr/:qrCode')
  @Roles('CLIENT', 'STAFF')
  @HttpCode(HttpStatus.OK)
  getTicketByQRCode(@Param('qrCode') qrCode: string) {
    return this.ticketsService.getTicketByQRCode(qrCode);
  }
}
