import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateEventDto } from './create-event.dto';

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
});
