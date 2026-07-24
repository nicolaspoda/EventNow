import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRaw: jest.Mock };
  let redis: { ping: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    redis = { ping: jest.fn().mockResolvedValue('PONG') };

    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns status ok when database and redis are reachable', async () => {
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.info).toEqual({
      database: { status: 'up' },
      redis: { status: 'up' },
    });
  });

  it('throws a 503 with details when the database is unreachable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toMatchObject({
      response: {
        status: 'error',
        error: {
          database: {
            status: 'down',
            message: 'connection refused',
          },
        },
      },
    });
    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws a 503 with details when redis is unreachable', async () => {
    redis.ping.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(controller.check()).rejects.toMatchObject({
      response: {
        status: 'error',
        error: {
          redis: {
            status: 'down',
            message: 'ECONNREFUSED',
          },
        },
      },
    });
  });
});
