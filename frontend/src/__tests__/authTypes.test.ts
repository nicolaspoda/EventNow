import { describe, it, expect } from 'vitest';
import { Role } from '../types/auth';

describe('Role', () => {
  it('exposes the three role values used across the app', () => {
    expect(Role).toEqual({
      USER: 'USER',
      ORGANIZER: 'ORGANIZER',
      ADMIN: 'ADMIN',
    });
  });
});
