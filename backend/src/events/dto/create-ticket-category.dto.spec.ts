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

  it('should validate without the optional description and current_stock', async () => {
    const plain = { name: 'Standard', price: '50', initial_stock: '100' };
    const dto = plainToClass(CreateTicketCategoryDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.description).toBeUndefined();
    expect(dto.current_stock).toBeUndefined();
  });

  it('should transform current_stock from string', async () => {
    const plain = {
      name: 'Standard',
      price: '50',
      initial_stock: '100',
      current_stock: '30',
    };
    const dto = plainToClass(CreateTicketCategoryDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.current_stock).toBe(30);
  });

  it('should reject an empty name', async () => {
    const plain = { name: '', price: '50', initial_stock: '100' };
    const dto = plainToClass(CreateTicketCategoryDto, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should reject a price below the minimum', async () => {
    const plain = { name: 'Standard', price: '0.1', initial_stock: '100' };
    const dto = plainToClass(CreateTicketCategoryDto, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });

  it('should reject an initial_stock below the minimum', async () => {
    const plain = { name: 'Standard', price: '50', initial_stock: '0' };
    const dto = plainToClass(CreateTicketCategoryDto, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'initial_stock')).toBe(true);
  });

  it('should reject a negative current_stock', async () => {
    const plain = {
      name: 'Standard',
      price: '50',
      initial_stock: '100',
      current_stock: '-1',
    };
    const dto = plainToClass(CreateTicketCategoryDto, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'current_stock')).toBe(true);
  });
});
