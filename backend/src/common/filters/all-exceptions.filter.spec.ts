import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { CustomLoggerService } from '../../logger/logger.service';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockLogger: jest.Mocked<CustomLoggerService>;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logSecurityEvent: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockRequest = {
      method: 'GET',
      url: '/test',
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as ArgumentsHost;

    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should handle non-HttpException', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockRequest = {
      method: 'POST',
      url: '/test',
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as ArgumentsHost;

    const exception = new Error('Generic error');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should join array message from HttpException object response', () => {
    const mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const mockRequest = { method: 'POST', url: '/test' };
    const mockHost = {
      switchToHttp: () => ({ getResponse: () => mockResponse, getRequest: () => mockRequest }),
    } as ArgumentsHost;

    const exception = new HttpException({ message: ['Field required', 'Too short'] }, HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);

    const jsonArg = mockResponse.json.mock.calls[0][0];
    expect(jsonArg.message).toBe('Field required, Too short');
  });

  it('should return string message from HttpException object response', () => {
    const mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const mockRequest = { method: 'GET', url: '/test' };
    const mockHost = {
      switchToHttp: () => ({ getResponse: () => mockResponse, getRequest: () => mockRequest }),
    } as ArgumentsHost;

    const exception = new HttpException({ message: 'Single error string' }, HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);

    const jsonArg = mockResponse.json.mock.calls[0][0];
    expect(jsonArg.message).toBe('Single error string');
  });

  it('should return Erreur serveur when message is non-string non-array', () => {
    const mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const mockRequest = { method: 'GET', url: '/test' };
    const mockHost = {
      switchToHttp: () => ({ getResponse: () => mockResponse, getRequest: () => mockRequest }),
    } as ArgumentsHost;

    const exception = new HttpException({ message: 42 }, HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);

    const jsonArg = mockResponse.json.mock.calls[0][0];
    expect(jsonArg.message).toBe('Erreur serveur');
  });

  it('should mask 500 message in production', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const mockRequest = { method: 'GET', url: '/test' };
    const mockHost = {
      switchToHttp: () => ({ getResponse: () => mockResponse, getRequest: () => mockRequest }),
    } as ArgumentsHost;

    filter.catch(new Error('secret db error'), mockHost);

    const jsonArg = mockResponse.json.mock.calls[0][0];
    expect(jsonArg.message).toBe('Internal server error');

    process.env.NODE_ENV = origEnv;
  });

  it('should log non-Error exception as string', () => {
    const mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const mockRequest = { method: 'GET', url: '/test' };
    const mockHost = {
      switchToHttp: () => ({ getResponse: () => mockResponse, getRequest: () => mockRequest }),
    } as ArgumentsHost;

    filter.catch('string exception', mockHost);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'GET /test',
      'string exception',
      'ExceptionFilter',
    );
  });
});
