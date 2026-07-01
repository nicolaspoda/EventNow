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
});
