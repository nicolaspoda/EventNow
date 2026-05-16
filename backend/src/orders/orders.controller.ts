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
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto, ConfirmPaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Request } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  private readonly ordersService: OrdersService;

  constructor(ordersService: OrdersService) {
    this.ordersService = ordersService;
  }

  @Post('payment/initiate')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  @Throttle({ payment: { limit: 5, ttl: 60000 } })
  initiatePayment(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    return this.ordersService.initiatePayment(dto.bookingId, user.id, dto.promoCodeId);
  }

  @Post('payment/confirm')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ payment: { limit: 5, ttl: 60000 } })
  confirmPayment(@Body() dto: ConfirmPaymentDto, @CurrentUser() user: AuthUser) {
    return this.ordersService.confirmPayment(
      dto.bookingId,
      dto.paymentId,
      user.id,
      dto.promoCodeId,
    );
  }

  @Get()
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getUserOrders(@CurrentUser() user: AuthUser) {
    return this.ordersService.getUserOrders(user.id);
  }

  @Get('refund-requests')
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getRefundRequests(@CurrentUser() user: AuthUser) {
    return this.ordersService.getRefundRequests(user.id);
  }

  @Get(':id')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getOrder(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.getOrderById(id, user.id);
  }

  @Patch(':id/refund')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  @Throttle({ payment: { limit: 5, ttl: 60000 } })
  refundOrder(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.refundOrder(id, user.id);
  }

  @Patch(':id/refund/approve')
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.OK)
  approveRefund(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.approveRefund(id, user.id);
  }

  @Patch(':id/refund/reject')
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.OK)
  rejectRefund(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.rejectRefund(id, user.id);
  }

  @Post('webhook/stripe')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Signature Stripe manquante');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Corps de la requête manquant');
    }

    return this.ordersService.handleStripeWebhook(rawBody, signature);
  }
}
