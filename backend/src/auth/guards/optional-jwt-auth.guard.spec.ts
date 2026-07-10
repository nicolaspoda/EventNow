import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return undefined when err is present', () => {
    const result = guard.handleRequest(new Error('invalid token'), false);
    expect(result).toBeUndefined();
  });

  it('should return undefined when user is false', () => {
    const result = guard.handleRequest(null, false);
    expect(result).toBeUndefined();
  });

  it('should return user when no error and user is set', () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    const result = guard.handleRequest(null, mockUser);
    expect(result).toEqual(mockUser);
  });
});
