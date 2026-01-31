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

  async onModuleDestroy() {
    await this.client.quit();
  }
}
