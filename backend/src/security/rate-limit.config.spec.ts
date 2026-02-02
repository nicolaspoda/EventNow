import { throttlerConfig } from './rate-limit.config';

describe('Rate Limit Configuration', () => {
  it('should be defined', () => {
    expect(throttlerConfig).toBeDefined();
  });

  it('should be a module', () => {
    expect(throttlerConfig.module).toBeDefined();
  });
});
