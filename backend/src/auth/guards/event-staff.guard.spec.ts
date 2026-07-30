import { Test, TestingModule } from '@nestjs/testing';
import { EventStaffGuard } from './event-staff.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('EventStaffGuard', () => {
  let guard: EventStaffGuard;

  const mockPrismaService = {
    eventStaff: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventStaffGuard,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get<EventStaffGuard>(EventStaffGuard);
    jest.clearAllMocks();
  });

  const makeContext = (overrides: Record<string, unknown> = {}) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1' },
        params: { eventId: 'event-1' },
        query: {},
        body: {},
        ...overrides,
      }),
    }),
  }) as any;

  it('should throw ForbiddenException if no user', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: null, params: {}, query: {}, body: {} }),
      }),
    } as any;
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user has no id', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: {}, params: {}, query: {}, body: {} }),
      }),
    } as any;
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if no eventId found', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'user-1' }, params: {}, query: {}, body: {} }),
      }),
    } as any;
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('should throw ForbiddenException if user is not staff', async () => {
    mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(makeContext())).rejects.toThrow(ForbiddenException);
  });

  it('should return true if user is staff via params.eventId', async () => {
    mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'user-1' });
    const result = await guard.canActivate(makeContext());
    expect(result).toBe(true);
  });

  it('should extract eventId from params.event_id', async () => {
    mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'user-1' });
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-1' },
          params: { event_id: 'event-1' },
          query: {},
          body: {},
        }),
      }),
    } as any;
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should extract eventId from query.eventId', async () => {
    mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'user-1' });
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-1' },
          params: {},
          query: { eventId: 'event-1' },
          body: {},
        }),
      }),
    } as any;
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should extract eventId from body.eventId', async () => {
    mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'user-1' });
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-1' },
          params: {},
          query: {},
          body: { eventId: 'event-1' },
        }),
      }),
    } as any;
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should extract eventId from body.event_id', async () => {
    mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'user-1' });
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-1' },
          params: {},
          query: {},
          body: { event_id: 'event-1' },
        }),
      }),
    } as any;
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should extract eventId from query.event_id', async () => {
    mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'user-1' });
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-1' },
          params: {},
          query: { event_id: 'event-1' },
          body: {},
        }),
      }),
    } as any;
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
