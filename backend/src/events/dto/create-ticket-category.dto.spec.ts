import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateTicketCategoryDto } from './create-ticket-category.dto';

describe('CreateTicketCategoryDto', () => {
  it('should validate and transform price and initial_stock from string', async () => {
    const plain = {
      name: 'Standard',
      description: 'Standard seat',
      price: '50',
      initial_stock: '100',
    };
    const dto = plainToClass(CreateTicketCategoryDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.price).toBe(50);
    expect(dto.initial_stock).toBe(100);
  });
});
