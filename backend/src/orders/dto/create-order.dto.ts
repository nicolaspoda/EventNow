import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  bookingId: string;

  @IsOptional()
  @IsString()
  promoCodeId?: string;
}

export class ConfirmPaymentDto {
  @IsUUID()
  bookingId: string;

  @IsString()
  paymentId: string;

  @IsOptional()
  @IsString()
  promoCodeId?: string;
}
