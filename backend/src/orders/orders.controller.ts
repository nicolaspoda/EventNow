import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto, ConfirmPaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  private readonly ordersService: OrdersService;

  constructor(ordersService: OrdersService) {
    this.ordersService = ordersService;
  }

  @Post('payment/initiate')
  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  @Throttle({ payment: { limit: 5, ttl: 60000 } })
  initiatePayment(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.initiatePayment(dto.bookingId, user.id);
  }

  @Post('payment/confirm')
  @Roles('CLIENT')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ payment: { limit: 5, ttl: 60000 } })
  confirmPayment(@Body() dto: ConfirmPaymentDto, @CurrentUser() user: any) {
    return this.ordersService.confirmPayment(
      dto.bookingId,
      dto.paymentId,
      user.id,
    );
  }

  @Get()
  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  getUserOrders(@CurrentUser() user: any) {
    return this.ordersService.getUserOrders(user.id);
  }

  @Get(':id')
  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  getOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getOrderById(id, user.id);
  }

  @Patch(':id/refund')
  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  @Throttle({ payment: { limit: 5, ttl: 60000 } })
  refundOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.refundOrder(id, user.id);
  }
}
