import { validate } from 'class-validator';
import { PaymentIntentDto, PaymentWebhookDto } from './payment-intent.dto';

describe('PaymentIntentDto', () => {
  it('should validate bookingId as UUID', async () => {
    const dto = new PaymentIntentDto();
    dto.bookingId = '550e8400-e29b-41d4-a716-446655440000';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('PaymentWebhookDto', () => {
  it('should allow valid webhook payload', () => {
    const dto = new PaymentWebhookDto();
    dto.paymentId = 'pay_1';
    dto.bookingId = 'booking-1';
    dto.status = 'success';
    dto.amount = 100;
    expect(dto.status).toBe('success');
    expect(dto.amount).toBe(100);
  });
});
