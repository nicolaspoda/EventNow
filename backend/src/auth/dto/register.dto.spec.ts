import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { RegisterDto, RegisterOrganizerDto } from './register.dto';

describe('RegisterDto', () => {
  it('should validate a valid client registration', async () => {
    const plain = {
      username: 'testuser',
      email: 'client@test.com',
      password: 'password123',
    };
    const dto = plainToClass(RegisterDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without username', async () => {
    const plain = {
      email: 'client@test.com',
      password: 'password123',
    };
    const dto = plainToClass(RegisterDto, plain);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('RegisterOrganizerDto', () => {
  it('should validate a valid organizer registration', async () => {
    const plain = {
      username: 'organizer1',
      email: 'org@test.com',
      password: 'password123',
      confirmOrganizer: true,
    };
    const dto = plainToClass(RegisterOrganizerDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without confirmOrganizer', async () => {
    const plain = {
      username: 'organizer1',
      email: 'org@test.com',
      password: 'password123',
    };
    const dto = plainToClass(RegisterOrganizerDto, plain);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
