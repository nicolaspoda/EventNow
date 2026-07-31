import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ContactDto } from './contact.dto';

describe('ContactDto', () => {
  const valid = {
    name: 'Jean Dupont',
    email: 'jean@test.com',
    subject: 'Question sur un événement',
    message: 'Bonjour, je voulais savoir si les billets étaient remboursables.',
  };

  it('should validate a valid contact message', async () => {
    const dto = plainToClass(ContactDto, valid);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without name', async () => {
    const dto = plainToClass(ContactDto, { ...valid, name: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail with a name that is too short', async () => {
    const dto = plainToClass(ContactDto, { ...valid, name: 'A' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail with a name that is too long', async () => {
    const dto = plainToClass(ContactDto, { ...valid, name: 'A'.repeat(101) });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail with an invalid email', async () => {
    const dto = plainToClass(ContactDto, { ...valid, email: 'not-an-email' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should fail without a subject', async () => {
    const dto = plainToClass(ContactDto, { ...valid, subject: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'subject')).toBe(true);
  });

  it('should fail with a subject that is too long', async () => {
    const dto = plainToClass(ContactDto, {
      ...valid,
      subject: 'A'.repeat(151),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'subject')).toBe(true);
  });

  it('should fail with a message that is too short', async () => {
    const dto = plainToClass(ContactDto, { ...valid, message: 'short' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'message')).toBe(true);
  });

  it('should fail with a message that is too long', async () => {
    const dto = plainToClass(ContactDto, {
      ...valid,
      message: 'A'.repeat(2001),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'message')).toBe(true);
  });
});
