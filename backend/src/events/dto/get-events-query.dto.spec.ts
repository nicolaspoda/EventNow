import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { GetEventsQueryDto } from './get-events-query.dto';

describe('GetEventsQueryDto', () => {
  it('should validate with no fields set (all optional)', async () => {
    const dto = plainToClass(GetEventsQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with all fields set correctly', async () => {
    const plain = {
      search: 'concert',
      location: 'Paris',
      dateFrom: '2026-01-01T00:00:00Z',
      dateTo: '2026-12-31T23:59:59Z',
    };
    const dto = plainToClass(GetEventsQueryDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.search).toBe(plain.search);
    expect(dto.location).toBe(plain.location);
  });

  it('should reject an invalid dateFrom', async () => {
    const dto = plainToClass(GetEventsQueryDto, { dateFrom: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('dateFrom');
  });

  it('should reject an invalid dateTo', async () => {
    const dto = plainToClass(GetEventsQueryDto, { dateTo: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('dateTo');
  });

  it('should reject a non-string search', async () => {
    const dto = plainToClass(GetEventsQueryDto, { search: 123 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('search');
  });
});
