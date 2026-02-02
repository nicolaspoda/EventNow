import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedisClient = {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
      set: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
    } as any;

    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(
      () => mockRedisClient,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('blacklistToken', () => {
    it('should blacklist token with expiration', async () => {
      await service.blacklistToken('token-123', 3600);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'blacklist:token-123',
        3600,
        '1',
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true if token is blacklisted', async () => {
      mockRedisClient.get.mockResolvedValue('1');

      const result = await service.isTokenBlacklisted('token-123');

      expect(result).toBe(true);
      expect(mockRedisClient.get).toHaveBeenCalledWith('blacklist:token-123');
    });

    it('should return false if token is not blacklisted', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.isTokenBlacklisted('token-123');

      expect(result).toBe(false);
    });
  });

  describe('setOAuthCode', () => {
    it('should store OAuth code with data and TTL', async () => {
      const data = { userId: 'user-123', email: 'test@test.com' };

      await service.setOAuthCode('code-123', data);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'oauth:code:code-123',
        60,
        JSON.stringify(data),
      );
    });
  });

  describe('getAndDeleteOAuthCode', () => {
    it('should retrieve and delete OAuth code', async () => {
      const data = { userId: 'user-123', email: 'test@test.com' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(data));

      const result = await service.getAndDeleteOAuthCode('code-123');

      expect(result).toEqual(data);
      expect(mockRedisClient.get).toHaveBeenCalledWith('oauth:code:code-123');
      expect(mockRedisClient.del).toHaveBeenCalledWith('oauth:code:code-123');
    });

    it('should return null if code not found', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.getAndDeleteOAuthCode('code-123');

      expect(result).toBeNull();
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('acquireLock', () => {
    it('should acquire lock successfully', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.acquireLock('resource-123', 10);

      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'lock:resource-123',
        '1',
        'EX',
        10,
        'NX',
      );
    });

    it('should use default ttl when not provided', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.acquireLock('resource-456');

      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'lock:resource-456',
        '1',
        'EX',
        10,
        'NX',
      );
    });

    it('should fail to acquire lock if already locked', async () => {
      mockRedisClient.set.mockResolvedValue(null);

      const result = await service.acquireLock('resource-123', 10);

      expect(result).toBe(false);
    });
  });

  describe('releaseLock', () => {
    it('should release lock', async () => {
      await service.releaseLock('resource-123');

      expect(mockRedisClient.del).toHaveBeenCalledWith('lock:resource-123');
    });
  });

  describe('withLock', () => {
    it('should execute callback with lock', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      const callback = jest.fn().mockResolvedValue('result');

      const result = await service.withLock('resource-123', callback, 10);

      expect(result).toBe('result');
      expect(callback).toHaveBeenCalled();
      expect(mockRedisClient.del).toHaveBeenCalledWith('lock:resource-123');
    });

    it('should use default ttl when not provided', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      const callback = jest.fn().mockResolvedValue('ok');

      const result = await service.withLock('key', callback);

      expect(result).toBe('ok');
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'lock:key',
        '1',
        'EX',
        10,
        'NX',
      );
    });

    it('should release lock even if callback throws', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      const callback = jest.fn().mockRejectedValue(new Error('Callback error'));

      await expect(
        service.withLock('resource-123', callback, 10),
      ).rejects.toThrow('Callback error');

      expect(mockRedisClient.del).toHaveBeenCalledWith('lock:resource-123');
    });

    it('should throw error if lock cannot be acquired', async () => {
      mockRedisClient.set.mockResolvedValue(null);
      const callback = jest.fn();

      await expect(
        service.withLock('resource-123', callback, 10),
      ).rejects.toThrow("Impossible d'acquérir le lock");

      expect(callback).not.toHaveBeenCalled();
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis client on module destroy', async () => {
      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });
});
