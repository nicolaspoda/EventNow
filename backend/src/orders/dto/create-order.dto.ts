import { IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  bookingId: string;
}

export class ConfirmPaymentDto {
  @IsUUID()
  bookingId: string;

  @IsString()
  paymentId: string;
}
