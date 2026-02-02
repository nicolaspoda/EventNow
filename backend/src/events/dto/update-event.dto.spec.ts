import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateEventDto } from './update-event.dto';

describe('UpdateEventDto', () => {
  it('should validate with optional ticket_categories', async () => {
    const plain = {
      title: 'Updated',
      ticket_categories: [
        { name: 'VIP', price: 100, initial_stock: 50 },
      ],
    };
    const dto = plainToClass(UpdateEventDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.ticket_categories).toHaveLength(1);
    expect(dto.ticket_categories![0].name).toBe('VIP');
  });
});
