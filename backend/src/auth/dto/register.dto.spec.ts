import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { RegisterDto } from './register.dto';
import { Role } from '@prisma/client';

describe('RegisterDto', () => {
  it('should validate with Role.CLIENT', async () => {
    const plain = {
      email: 'client@test.com',
      password: 'password123',
      role: Role.CLIENT,
    };
    const dto = plainToClass(RegisterDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.role).toBe(Role.CLIENT);
  });

  it('should validate with Role.ORGANIZER', async () => {
    const plain = {
      email: 'org@test.com',
      password: 'password123',
      role: Role.ORGANIZER,
    };
    const dto = plainToClass(RegisterDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.role).toBe(Role.ORGANIZER);
  });

  it('should validate with Role.STAFF', async () => {
    const plain = {
      email: 'staff@test.com',
      password: 'password123',
      role: Role.STAFF,
    };
    const dto = plainToClass(RegisterDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.role).toBe(Role.STAFF);
  });
});
