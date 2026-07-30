import { ThrottlerOverrideGuard } from './throttler-override.guard';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('ThrottlerOverrideGuard', () => {
  let guard: ThrottlerOverrideGuard;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    guard = new ThrottlerOverrideGuard(
      {} as any,
      {} as any,
      {} as any,
    );
  });

  afterEach(() => {
    delete process.env.DISABLE_THROTTLE;
  });

  it('should return true when DISABLE_THROTTLE=true', async () => {
    process.env.DISABLE_THROTTLE = 'true';
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should call super.canActivate when DISABLE_THROTTLE is not set', async () => {
    delete process.env.DISABLE_THROTTLE;
    jest
      .spyOn(ThrottlerGuard.prototype, 'canActivate')
      .mockResolvedValue(true);
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should call super.canActivate when DISABLE_THROTTLE=false', async () => {
    process.env.DISABLE_THROTTLE = 'false';
    jest
      .spyOn(ThrottlerGuard.prototype, 'canActivate')
      .mockResolvedValue(true);
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  describe('throwThrottlingException', () => {
    it('should log a RATE_LIMIT security event and throw when a securityLogger is provided', async () => {
      const mockLogger = { logSecurityEvent: jest.fn() };
      const loggedGuard = new ThrottlerOverrideGuard(
        {} as any,
        {} as any,
        {} as any,
        mockLogger as any,
      );
      jest
        .spyOn(loggedGuard as any, 'getRequestResponse')
        .mockReturnValue({ req: { ip: '1.2.3.4', method: 'GET', url: '/test' } });
      jest
        .spyOn(loggedGuard as any, 'getErrorMessage')
        .mockResolvedValue('Too many requests');

      await expect(
        (loggedGuard as any).throwThrottlingException(mockContext, {}),
      ).rejects.toThrow('Too many requests');

      expect(mockLogger.logSecurityEvent).toHaveBeenCalledWith({
        type: 'RATE_LIMIT',
        ip: '1.2.3.4',
        details: { method: 'GET', path: '/test' },
      });
    });

    it('should throw without logging when no securityLogger is provided', async () => {
      jest
        .spyOn(guard as any, 'getRequestResponse')
        .mockReturnValue({ req: {} });
      jest
        .spyOn(guard as any, 'getErrorMessage')
        .mockResolvedValue('Too many requests');

      await expect(
        (guard as any).throwThrottlingException(mockContext, {}),
      ).rejects.toThrow('Too many requests');
    });
  });
});
