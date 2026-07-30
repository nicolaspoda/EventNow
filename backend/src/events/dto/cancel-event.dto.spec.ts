import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CancelEventDto } from './cancel-event.dto';

describe('CancelEventDto', () => {
  it('should validate with a reason', async () => {
    const dto = plainToClass(CancelEventDto, { reason: 'Bad weather' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.reason).toBe('Bad weather');
  });

  it('should validate without a reason (optional)', async () => {
    const dto = plainToClass(CancelEventDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.reason).toBeUndefined();
  });

  it('should reject a non-string reason', async () => {
    const dto = plainToClass(CancelEventDto, { reason: 42 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('reason');
  });
});
