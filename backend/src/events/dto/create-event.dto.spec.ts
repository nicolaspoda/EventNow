import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateEventDto, EventType, EventCategory } from './create-event.dto';

describe('CreateEventDto', () => {
  it('should validate with optional description and image_url', async () => {
    const plain = {
      title: 'Event',
      description: 'Desc',
      location: 'Paris',
      image_url: 'https://example.com/img.png',
      event_date: '2026-12-31T20:00:00Z',
      ticket_categories: [
        { name: 'VIP', description: 'VIP', price: 100, initial_stock: 50 },
      ],
    };
    const dto = plainToClass(CreateEventDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.image_url).toBe(plain.image_url);
    expect(dto.ticket_categories).toHaveLength(1);
  });

  it('should validate with type and category set', async () => {
    const plain = {
      title: 'Event',
      location: 'Paris',
      event_date: '2026-12-31T20:00:00Z',
      type: EventType.PROFESSIONAL,
      category: EventCategory.CONFERENCE,
      ticket_categories: [{ name: 'VIP', price: 100, initial_stock: 50 }],
    };
    const dto = plainToClass(CreateEventDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.type).toBe(EventType.PROFESSIONAL);
    expect(dto.category).toBe(EventCategory.CONFERENCE);
  });

  it('should reject a missing title', async () => {
    const plain = {
      location: 'Paris',
      event_date: '2026-12-31T20:00:00Z',
      ticket_categories: [{ name: 'VIP', price: 100, initial_stock: 50 }],
    };
    const dto = plainToClass(CreateEventDto, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('should reject a missing location', async () => {
    const plain = {
      title: 'Event',
      event_date: '2026-12-31T20:00:00Z',
      ticket_categories: [{ name: 'VIP', price: 100, initial_stock: 50 }],
    };
    const dto = plainToClass(CreateEventDto, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'location')).toBe(true);
  });

  it('should reject an invalid event_date', async () => {
    const plain = {
      title: 'Event',
      location: 'Paris',
      event_date: 'not-a-date',
      ticket_categories: [{ name: 'VIP', price: 100, initial_stock: 50 }],
    };
    const dto = plainToClass(CreateEventDto, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'event_date')).toBe(true);
  });

  it('should reject an invalid type', async () => {
    const plain = {
      title: 'Event',
      location: 'Paris',
      event_date: '2026-12-31T20:00:00Z',
      type: 'NOT_A_TYPE',
      ticket_categories: [{ name: 'VIP', price: 100, initial_stock: 50 }],
    };
    const dto = plainToClass(CreateEventDto, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });

  it('should reject an invalid category', async () => {
    const plain = {
      title: 'Event',
      location: 'Paris',
      event_date: '2026-12-31T20:00:00Z',
      category: 'NOT_A_CATEGORY',
      ticket_categories: [{ name: 'VIP', price: 100, initial_stock: 50 }],
    };
    const dto = plainToClass(CreateEventDto, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'category')).toBe(true);
  });

  it('should reject an empty ticket_categories array', async () => {
    const plain = {
      title: 'Event',
      location: 'Paris',
      event_date: '2026-12-31T20:00:00Z',
      ticket_categories: [],
    };
    const dto = plainToClass(CreateEventDto, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'ticket_categories')).toBe(true);
  });

  it('should propagate nested validation errors from ticket_categories', async () => {
    const plain = {
      title: 'Event',
      location: 'Paris',
      event_date: '2026-12-31T20:00:00Z',
      ticket_categories: [{ name: '', price: -5, initial_stock: 0 }],
    };
    const dto = plainToClass(CreateEventDto, plain);
    const errors = await validate(dto);
    const ticketErrors = errors.find((e) => e.property === 'ticket_categories');
    expect(ticketErrors?.children?.length).toBeGreaterThan(0);
  });
});
