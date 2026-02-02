import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as any;
  };

  describe('canActivate', () => {
    it('should return true if no roles required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({ id: 'user-123', role: 'CLIENT' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when requiredRoles is null', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const context = createMockContext({ id: 'user-123', role: 'CLIENT' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true if user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CLIENT']);

      const context = createMockContext({ id: 'user-123', role: 'CLIENT' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false if user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ORGANIZER']);

      const context = createMockContext({ id: 'user-123', role: 'CLIENT' });

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return true if user has one of multiple required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['ORGANIZER', 'CLIENT']);

      const context = createMockContext({ id: 'user-123', role: 'CLIENT' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true for STAFF role when required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['STAFF']);

      const context = createMockContext({ id: 'staff-123', role: 'STAFF' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false for CLIENT when STAFF required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['STAFF']);

      const context = createMockContext({ id: 'user-123', role: 'CLIENT' });

      expect(guard.canActivate(context)).toBe(false);
    });
  });
});
