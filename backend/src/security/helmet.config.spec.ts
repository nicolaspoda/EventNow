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
});
