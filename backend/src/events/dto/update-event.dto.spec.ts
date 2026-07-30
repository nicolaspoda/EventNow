import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateEventDto } from './update-event.dto';
import { EventCategory } from './create-event.dto';

describe('UpdateEventDto', () => {
  it('should validate with optional ticket_categories', async () => {
    const plain = {
      title: 'Updated',
      ticket_categories: [{ name: 'VIP', price: 100, initial_stock: 50 }],
    };
    const dto = plainToClass(UpdateEventDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.ticket_categories).toHaveLength(1);
    expect(dto.ticket_categories![0].name).toBe('VIP');
  });

  it('should validate an empty payload (all fields optional)', async () => {
    const dto = plainToClass(UpdateEventDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with a category set', async () => {
    const dto = plainToClass(UpdateEventDto, { category: EventCategory.SPORT });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.category).toBe(EventCategory.SPORT);
  });

  it('should reject an invalid category', async () => {
    const dto = plainToClass(UpdateEventDto, { category: 'NOT_A_CATEGORY' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'category')).toBe(true);
  });

  it('should reject an invalid event_date', async () => {
    const dto = plainToClass(UpdateEventDto, { event_date: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'event_date')).toBe(true);
  });

  it('should reject an invalid end_date', async () => {
    const dto = plainToClass(UpdateEventDto, { end_date: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'end_date')).toBe(true);
  });

  it('should reject a non-numeric latitude', async () => {
    const dto = plainToClass(UpdateEventDto, { latitude: 'north' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'latitude')).toBe(true);
  });

  it('should propagate nested validation errors from ticket_categories', async () => {
    const plain = {
      ticket_categories: [{ name: '', price: -5, initial_stock: 0 }],
    };
    const dto = plainToClass(UpdateEventDto, plain);
    const errors = await validate(dto);
    const ticketErrors = errors.find((e) => e.property === 'ticket_categories');
    expect(ticketErrors?.children?.length).toBeGreaterThan(0);
  });
});
