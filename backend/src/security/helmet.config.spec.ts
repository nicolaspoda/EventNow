import { INestApplication } from '@nestjs/common';
import { configureHelmet } from './helmet.config';

describe('Helmet Configuration', () => {
  let mockApp: jest.Mocked<INestApplication>;

  beforeEach(() => {
    mockApp = {
      use: jest.fn(),
    } as any;
  });

  it('should configure helmet middleware', () => {
    configureHelmet(mockApp);
    expect(mockApp.use).toHaveBeenCalled();
  });

  it('should enable HSTS in production', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    configureHelmet(mockApp);

    process.env.NODE_ENV = original;
    expect(mockApp.use).toHaveBeenCalled();
  });

  it('should set the Permissions-Policy header via the second middleware', () => {
    configureHelmet(mockApp);

    const permissionsPolicyMiddleware = mockApp.use.mock.calls[1][0];
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    permissionsPolicyMiddleware({}, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'geolocation=(self), camera=(), microphone=(), payment=(self)',
    );
    expect(next).toHaveBeenCalled();
  });
});
