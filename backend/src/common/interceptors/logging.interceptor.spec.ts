import { Test, TestingModule } from '@nestjs/testing';
import { LoggingInterceptor } from './logging.interceptor';
import { CustomLoggerService } from '../../logger/logger.service';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingInterceptor,
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
    jest.clearAllMocks();
  });

  it('should log request info after response', (done) => {
    const mockRequest = { method: 'GET', url: '/events', ip: '127.0.0.1', user: { id: 'user-1' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
    } as any;
    const next = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(mockLogger.log).toHaveBeenCalledWith(
          expect.stringContaining('GET /events'),
          'HTTP',
        );
        done();
      },
    });
  });

  it('should use anonymous when no user', (done) => {
    const mockRequest = { method: 'GET', url: '/public', ip: '127.0.0.1' };
    const context = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
    } as any;
    const next = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(mockLogger.log).toHaveBeenCalledWith(
          expect.stringContaining('anonymous'),
          'HTTP',
        );
        done();
      },
    });
  });
});
