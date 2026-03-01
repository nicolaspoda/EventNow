import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  private readonly bookingsService: BookingsService;

  constructor(bookingsService: BookingsService) {
    this.bookingsService = bookingsService;
  }

  @Post()
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(user.id, dto);
  }

  @Get()
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  getUserBookings(@CurrentUser() user: any) {
    return this.bookingsService.getUserBookings(user.id);
  }

  @Patch(':id/confirm')
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.confirmBooking(id, user.id);
  }

  @Delete(':id')
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.cancelBooking(id, user.id);
  }
}
