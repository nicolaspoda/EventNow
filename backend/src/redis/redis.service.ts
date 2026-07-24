import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    await this.client.setex(`blacklist:${token}`, expiresInSeconds, '1');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.get(`blacklist:${token}`);
    return result !== null;
  }

  private static readonly OAUTH_CODE_PREFIX = 'oauth:code:';
  private static readonly OAUTH_CODE_TTL_SECONDS = 60;

  async setOAuthCode(code: string, data: object): Promise<void> {
    const key = `${RedisService.OAUTH_CODE_PREFIX}${code}`;
    await this.client.setex(
      key,
      RedisService.OAUTH_CODE_TTL_SECONDS,
      JSON.stringify(data),
    );
  }

  async getAndDeleteOAuthCode(code: string): Promise<object | null> {
    const key = `${RedisService.OAUTH_CODE_PREFIX}${code}`;
    const value = await this.client.get(key);
    if (value === null) return null;
    await this.client.del(key);
    return JSON.parse(value) as object;
  }

  async acquireLock(key: string, ttl: number = 10): Promise<boolean> {
    const result = await this.client.set(`lock:${key}`, '1', 'EX', ttl, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.client.del(`lock:${key}`);
  }

  async withLock<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = 10,
  ): Promise<T> {
    const lockAcquired = await this.acquireLock(key, ttl);

    if (!lockAcquired) {
      throw new Error(
        "Impossible d'acquérir le lock - trop de demandes simultanées",
      );
    }

    try {
      return await callback();
    } finally {
      await this.releaseLock(key);
    }
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
