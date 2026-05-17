import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('promo-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Post()
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.CREATED)
  createPromoCode(
    @Body() dto: CreatePromoCodeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.promoCodesService.createPromoCode(user.id, dto);
  }

  @Post('validate')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  validatePromoCode(@Body() dto: ValidatePromoCodeDto) {
    return this.promoCodesService.validatePromoCode(dto);
  }

  @Get('event/:eventId')
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getEventPromoCodes(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.promoCodesService.getEventPromoCodes(user.id, eventId);
  }

  @Delete(':id')
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.OK)
  deletePromoCode(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.promoCodesService.deletePromoCode(user.id, id);
  }
}
