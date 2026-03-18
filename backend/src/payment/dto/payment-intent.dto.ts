import { IsUUID } from 'class-validator';

export class PaymentIntentDto {
  @IsUUID()
  bookingId: string;
}

export class PaymentIntentResponseDto {
  paymentId: string;
  clientSecret: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: string;
}

export class PaymentWebhookDto {
  paymentId: string;
  bookingId: string;
  status: 'success' | 'failed';
  amount: number;
}
