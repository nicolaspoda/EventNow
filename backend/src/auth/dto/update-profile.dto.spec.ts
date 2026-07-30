import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateProfileDto } from './update-profile.dto';

describe('UpdateProfileDto', () => {
  it('should validate when avatarUrl is a valid URL', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      avatarUrl: 'https://example.com/avatar.png',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate when avatarUrl is omitted', async () => {
    const dto = plainToClass(UpdateProfileDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should skip URL validation when avatarUrl is an empty string', async () => {
    const dto = plainToClass(UpdateProfileDto, { avatarUrl: '' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when avatarUrl is not a valid URL', async () => {
    const dto = plainToClass(UpdateProfileDto, { avatarUrl: 'not-a-url' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
