import { BadRequestException } from '@nestjs/common';
import { ValidationPipe } from './validation.pipe';
import { IsString, IsNotEmpty } from 'class-validator';

class TestDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe();
  });

  it('should pass through when no metatype', async () => {
    const value = { name: 'test' };
    const result = await pipe.transform(value, { metatype: undefined, type: 'body', data: '' });
    expect(result).toEqual(value);
  });

  it('should pass through for primitive metatypes (String)', async () => {
    const result = await pipe.transform('hello', { metatype: String, type: 'param', data: 'id' });
    expect(result).toBe('hello');
  });

  it('should pass through for Number metatype', async () => {
    const result = await pipe.transform(42, { metatype: Number, type: 'param', data: 'count' });
    expect(result).toBe(42);
  });

  it('should pass through for Boolean metatype', async () => {
    const result = await pipe.transform(true, { metatype: Boolean, type: 'query', data: 'active' });
    expect(result).toBe(true);
  });

  it('should pass through for Array metatype', async () => {
    const result = await pipe.transform([1, 2], { metatype: Array, type: 'body', data: '' });
    expect(result).toEqual([1, 2]);
  });

  it('should pass through for Object metatype', async () => {
    const value = { a: 1 };
    const result = await pipe.transform(value, { metatype: Object, type: 'body', data: '' });
    expect(result).toEqual(value);
  });

  it('should validate and return transformed DTO on success', async () => {
    const result = await pipe.transform(
      { name: 'Alice' },
      { metatype: TestDto, type: 'body', data: '' },
    );
    expect(result).toBeInstanceOf(TestDto);
    expect(result.name).toBe('Alice');
  });

  it('should throw BadRequestException on validation failure', async () => {
    await expect(
      pipe.transform({ name: '' }, { metatype: TestDto, type: 'body', data: '' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when required field missing', async () => {
    await expect(
      pipe.transform({}, { metatype: TestDto, type: 'body', data: '' }),
    ).rejects.toThrow(BadRequestException);
  });
});
