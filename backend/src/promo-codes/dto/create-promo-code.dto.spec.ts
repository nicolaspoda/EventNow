import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { DiscountType } from '@prisma/client';
import { CreatePromoCodeDto } from './create-promo-code.dto';

describe('CreatePromoCodeDto', () => {
  const base = {
    code: 'PROMO10',
    eventId: 'event-1',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
  };

  it('should validate a valid percentage promo code', async () => {
    const dto = plainToClass(CreatePromoCodeDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when discountValue exceeds 100 for a percentage discount', async () => {
    const dto = plainToClass(CreatePromoCodeDto, {
      ...base,
      discountValue: 150,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should allow discountValue above 100 for a fixed discount', async () => {
    const dto = plainToClass(CreatePromoCodeDto, {
      ...base,
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 150,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
