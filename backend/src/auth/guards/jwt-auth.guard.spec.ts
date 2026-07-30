import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { CustomLoggerService } from '../../logger/logger.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let securityLogger: { logSecurityEvent: jest.Mock };

  beforeEach(async () => {
    securityLogger = { logSecurityEvent: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: CustomLoggerService,
          useValue: securityLogger,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const makeContext = () => ({
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  }) as any;

  it('should return true for public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const result = guard.canActivate(makeContext());
    expect(result).toBe(true);
  });

  it('should call super.canActivate for non-public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const superSpy = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockReturnValue(true);
    guard.canActivate(makeContext());
    expect(superSpy).toHaveBeenCalled();
  });

  describe('handleRequest', () => {
    it('should log an UNAUTHORIZED_ACCESS security event when passport returns an error', () => {
      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'handleRequest')
        .mockReturnValue(undefined);

      guard.handleRequest(new Error('jwt expired'), null, null, makeContext());

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UNAUTHORIZED_ACCESS',
          details: expect.objectContaining({ reason: 'jwt expired' }),
        }),
      );
    });

    it('should log an UNAUTHORIZED_ACCESS security event when no user is resolved', () => {
      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'handleRequest')
        .mockReturnValue(undefined);

      guard.handleRequest(null, null, { message: 'No auth token' }, makeContext());

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UNAUTHORIZED_ACCESS',
          details: expect.objectContaining({ reason: 'No auth token' }),
        }),
      );
    });

    it('should not log a security event when authentication succeeds', () => {
      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'handleRequest')
        .mockReturnValue({ id: 'user-1' });

      guard.handleRequest(null, { id: 'user-1' }, null, makeContext());

      expect(securityLogger.logSecurityEvent).not.toHaveBeenCalled();
    });
  });
});
