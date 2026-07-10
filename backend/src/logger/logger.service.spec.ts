import { CustomLoggerService } from './logger.service';

describe('CustomLoggerService', () => {
  let service: CustomLoggerService;

  beforeEach(() => {
    service = new CustomLoggerService();
  });

  it('should log info messages', () => {
    expect(() => service.log('Test message', 'TestContext')).not.toThrow();
  });

  it('should log errors', () => {
    expect(() => service.error('Error message', 'stack trace', 'TestContext')).not.toThrow();
  });

  it('should log warnings', () => {
    expect(() => service.warn('Warning message', 'TestContext')).not.toThrow();
  });

  it('should log debug messages', () => {
    expect(() => service.debug('Debug message', 'TestContext')).not.toThrow();
  });

  it('should log security events', () => {
    expect(() =>
      service.logSecurityEvent({
        type: 'AUTH_FAILED',
        userId: 'user-1',
        ip: '127.0.0.1',
        details: { reason: 'bad password' },
      }),
    ).not.toThrow();
  });

  it('should log security event without userId and ip', () => {
    expect(() =>
      service.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        details: { action: 'mass_request' },
      }),
    ).not.toThrow();
  });

  it('should log all security event types', () => {
    const types = ['AUTH_FAILED', 'UNAUTHORIZED_ACCESS', 'RATE_LIMIT', 'SUSPICIOUS_ACTIVITY'] as const;
    for (const type of types) {
      expect(() =>
        service.logSecurityEvent({ type, details: {} }),
      ).not.toThrow();
    }
  });

  it('should not throw when logging without context', () => {
    expect(() => service.log('msg')).not.toThrow();
    expect(() => service.error('err')).not.toThrow();
    expect(() => service.warn('warn')).not.toThrow();
    expect(() => service.debug('debug')).not.toThrow();
  });
});
