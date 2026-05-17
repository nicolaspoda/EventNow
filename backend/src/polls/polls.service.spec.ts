import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../messages/messages.gateway';

const USER_ID = 'user-1';
const ORGANIZER_ID = 'organizer-1';
const OTHER_USER_ID = 'other-user-2';
const EVENT_ID = 'event-1';
const POLL_ID = 'poll-1';
const OPTION_A_ID = 'option-a';
const OPTION_B_ID = 'option-b';

const mockEvent = { organizerId: ORGANIZER_ID, type: 'COMMUNITY' };

const futureDate = new Date(Date.now() + 86400000);
const pastDate = new Date(Date.now() - 86400000);

const makePoll = (overrides: Record<string, unknown> = {}) => ({
  id: POLL_ID,
  eventId: EVENT_ID,
  createdById: USER_ID,
  question: 'Quelle date ?',
  description: null,
  status: 'OPEN',
  multipleChoice: false,
  closesAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  options: [
    { id: OPTION_A_ID, text: 'Option A', order: 0, votes: [] },
    { id: OPTION_B_ID, text: 'Option B', order: 1, votes: [] },
  ],
  votes: [],
  ...overrides,
});

const mockPrisma = {
  event: { findUnique: jest.fn() },
  participationRequest: { findUnique: jest.fn() },
  poll: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  pollVote: {
    findMany: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockGateway = {
  notifyPollCreated: jest.fn(),
  notifyPollUpdated: jest.fn(),
  notifyPollDeleted: jest.fn(),
};

describe('PollsService', () => {
  let service: PollsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MessagesGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<PollsService>(PollsService);
  });

  function setupOrganizerAccess() {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
  }

  function setupParticipantAccess() {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
    mockPrisma.participationRequest.findUnique.mockResolvedValue({
      status: 'ACCEPTED',
    });
  }

  // ============================================================
  // getEventPolls
  // ============================================================

  describe('getEventPolls', () => {
    it('returns polls with vote counts and user vote info', async () => {
      const poll = makePoll({
        options: [
          { id: OPTION_A_ID, text: 'Option A', order: 0, votes: [{ userId: USER_ID }] },
          { id: OPTION_B_ID, text: 'Option B', order: 1, votes: [] },
        ],
        votes: [{ userId: USER_ID, optionId: OPTION_A_ID }],
      });
      setupOrganizerAccess();
      mockPrisma.poll.findMany.mockResolvedValue([poll]);

      const result = await service.getEventPolls(ORGANIZER_ID, EVENT_ID);

      expect(result).toHaveLength(1);
      expect(result[0].hasVoted).toBe(false); // ORGANIZER_ID ≠ USER_ID who voted
      expect(result[0].totalVotes).toBe(1);
      expect(result[0].options[0].voteCount).toBe(1);
      expect(result[0].options[1].voteCount).toBe(0);
    });

    it('returns myVotes when current user has voted', async () => {
      const poll = makePoll({
        votes: [{ userId: USER_ID, optionId: OPTION_A_ID }],
        options: [
          { id: OPTION_A_ID, text: 'Option A', order: 0, votes: [{ userId: USER_ID }] },
          { id: OPTION_B_ID, text: 'Option B', order: 1, votes: [] },
        ],
      });
      setupParticipantAccess();
      mockPrisma.poll.findMany.mockResolvedValue([poll]);

      const result = await service.getEventPolls(USER_ID, EVENT_ID);

      expect(result[0].hasVoted).toBe(true);
      expect(result[0].myVotes).toEqual([OPTION_A_ID]);
    });

    it('throws BadRequestException for non-community event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ ...mockEvent, type: 'PROFESSIONAL' });

      await expect(service.getEventPolls(USER_ID, EVENT_ID)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.participationRequest.findUnique.mockResolvedValue(null);

      await expect(service.getEventPolls(USER_ID, EVENT_ID)).rejects.toThrow(ForbiddenException);
    });

    it('sorts closed polls after open polls', async () => {
      const openPoll = makePoll({
        id: 'poll-open',
        status: 'OPEN',
        createdAt: new Date('2026-01-02'),
      });
      const closedPoll = makePoll({
        id: 'poll-closed',
        status: 'CLOSED',
        createdAt: new Date('2026-01-03'),
      });
      setupOrganizerAccess();
      mockPrisma.poll.findMany.mockResolvedValue([closedPoll, openPoll]);

      const result = await service.getEventPolls(ORGANIZER_ID, EVENT_ID);

      expect(result[0].id).toBe('poll-open');
      expect(result[1].id).toBe('poll-closed');
    });

    it('within open group sorts most recent first', async () => {
      const older = makePoll({ id: 'poll-old', createdAt: new Date('2026-01-01') });
      const newer = makePoll({ id: 'poll-new', createdAt: new Date('2026-01-05') });
      setupOrganizerAccess();
      mockPrisma.poll.findMany.mockResolvedValue([older, newer]);

      const result = await service.getEventPolls(ORGANIZER_ID, EVENT_ID);

      expect(result[0].id).toBe('poll-new');
    });
  });

  // ============================================================
  // createPoll
  // ============================================================

  describe('createPoll', () => {
    const baseDto = {
      question: 'Quelle est votre option préférée ?',
      options: ['Option A', 'Option B'],
    };

    it('creates a poll with 2 options successfully', async () => {
      setupParticipantAccess();
      const created = makePoll();
      mockPrisma.poll.create.mockResolvedValue(created);

      const result = await service.createPoll(USER_ID, EVENT_ID, baseDto);

      expect(mockPrisma.poll.create).toHaveBeenCalled();
      expect(result.question).toBe(created.question);
      expect(mockGateway.notifyPollCreated).toHaveBeenCalledWith(EVENT_ID, expect.any(Object));
    });

    it('creates a poll with multiple choice enabled', async () => {
      setupParticipantAccess();
      const created = makePoll({ multipleChoice: true });
      mockPrisma.poll.create.mockResolvedValue(created);

      const result = await service.createPoll(USER_ID, EVENT_ID, {
        ...baseDto,
        multipleChoice: true,
      });

      expect(result.multipleChoice).toBe(true);
    });

    it('creates a poll with closesAt', async () => {
      setupParticipantAccess();
      const created = makePoll({ closesAt: futureDate });
      mockPrisma.poll.create.mockResolvedValue(created);

      const result = await service.createPoll(USER_ID, EVENT_ID, {
        ...baseDto,
        closesAt: futureDate.toISOString(),
      });

      expect(result.closesAt).toEqual(futureDate);
    });

    it('throws BadRequestException for non-community event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ ...mockEvent, type: 'PROFESSIONAL' });

      await expect(service.createPoll(USER_ID, EVENT_ID, baseDto)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.participationRequest.findUnique.mockResolvedValue(null);

      await expect(service.createPoll(USER_ID, EVENT_ID, baseDto)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when closesAt is in the past', async () => {
      setupParticipantAccess();

      await expect(
        service.createPoll(USER_ID, EVENT_ID, {
          ...baseDto,
          closesAt: pastDate.toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when less than 2 options provided', async () => {
      setupParticipantAccess();

      await expect(
        service.createPoll(USER_ID, EVENT_ID, {
          ...baseDto,
          options: ['Only one'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  // vote
  // ============================================================

  describe('vote', () => {
    it('votes successfully on a single-choice poll', async () => {
      setupParticipantAccess();
      const poll = makePoll();
      mockPrisma.poll.findUnique
        .mockResolvedValueOnce(poll)
        .mockResolvedValueOnce(makePoll({
          votes: [{ userId: USER_ID, optionId: OPTION_A_ID }],
          options: [
            { id: OPTION_A_ID, text: 'Option A', order: 0, votes: [{ userId: USER_ID }] },
            { id: OPTION_B_ID, text: 'Option B', order: 1, votes: [] },
          ],
        }));
      mockPrisma.pollVote.createMany.mockResolvedValue({ count: 1 });

      const result = await service.vote(USER_ID, EVENT_ID, POLL_ID, { optionIds: [OPTION_A_ID] });

      expect(mockPrisma.pollVote.createMany).toHaveBeenCalledWith({
        data: [{ pollId: POLL_ID, optionId: OPTION_A_ID, userId: USER_ID }],
      });
      expect(result.hasVoted).toBe(true);
      expect(mockGateway.notifyPollUpdated).toHaveBeenCalled();
    });

    it('votes successfully on a multiple-choice poll', async () => {
      setupParticipantAccess();
      const poll = makePoll({ multipleChoice: true });
      mockPrisma.poll.findUnique
        .mockResolvedValueOnce(poll)
        .mockResolvedValueOnce(makePoll({
          multipleChoice: true,
          votes: [
            { userId: USER_ID, optionId: OPTION_A_ID },
            { userId: USER_ID, optionId: OPTION_B_ID },
          ],
          options: [
            { id: OPTION_A_ID, text: 'Option A', order: 0, votes: [{ userId: USER_ID }] },
            { id: OPTION_B_ID, text: 'Option B', order: 1, votes: [{ userId: USER_ID }] },
          ],
        }));
      mockPrisma.pollVote.createMany.mockResolvedValue({ count: 2 });

      const result = await service.vote(USER_ID, EVENT_ID, POLL_ID, {
        optionIds: [OPTION_A_ID, OPTION_B_ID],
      });

      expect(mockPrisma.pollVote.createMany).toHaveBeenCalledWith({
        data: [
          { pollId: POLL_ID, optionId: OPTION_A_ID, userId: USER_ID },
          { pollId: POLL_ID, optionId: OPTION_B_ID, userId: USER_ID },
        ],
      });
      expect(result.myVotes).toHaveLength(2);
    });

    it('throws NotFoundException when poll is not found', async () => {
      setupParticipantAccess();
      mockPrisma.poll.findUnique.mockResolvedValue(null);

      await expect(
        service.vote(USER_ID, EVENT_ID, POLL_ID, { optionIds: [OPTION_A_ID] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for invalid optionId', async () => {
      setupParticipantAccess();
      mockPrisma.poll.findUnique.mockResolvedValue(makePoll());

      await expect(
        service.vote(USER_ID, EVENT_ID, POLL_ID, { optionIds: ['nonexistent-id'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when poll is closed', async () => {
      setupParticipantAccess();
      mockPrisma.poll.findUnique.mockResolvedValue(makePoll({ status: 'CLOSED' }));

      await expect(
        service.vote(USER_ID, EVENT_ID, POLL_ID, { optionIds: [OPTION_A_ID] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when poll is expired via closesAt', async () => {
      setupParticipantAccess();
      mockPrisma.poll.findUnique.mockResolvedValue(makePoll({ closesAt: pastDate }));

      await expect(
        service.vote(USER_ID, EVENT_ID, POLL_ID, { optionIds: [OPTION_A_ID] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when multiple options given on single-choice poll', async () => {
      setupParticipantAccess();
      mockPrisma.poll.findUnique.mockResolvedValue(makePoll({ multipleChoice: false }));

      await expect(
        service.vote(USER_ID, EVENT_ID, POLL_ID, {
          optionIds: [OPTION_A_ID, OPTION_B_ID],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when user already voted', async () => {
      setupParticipantAccess();
      const pollWithVote = makePoll({
        votes: [{ userId: USER_ID, optionId: OPTION_A_ID }],
      });
      mockPrisma.poll.findUnique.mockResolvedValue(pollWithVote);

      await expect(
        service.vote(USER_ID, EVENT_ID, POLL_ID, { optionIds: [OPTION_B_ID] }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.participationRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.vote(USER_ID, EVENT_ID, POLL_ID, { optionIds: [OPTION_A_ID] }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================================
  // changeVote
  // ============================================================

  describe('changeVote', () => {
    it('deletes old votes and creates new ones', async () => {
      setupParticipantAccess();
      const poll = makePoll({
        votes: [{ userId: USER_ID, optionId: OPTION_A_ID }],
      });
      mockPrisma.poll.findUnique
        .mockResolvedValueOnce(poll)
        .mockResolvedValueOnce(makePoll({
          votes: [{ userId: USER_ID, optionId: OPTION_B_ID }],
          options: [
            { id: OPTION_A_ID, text: 'Option A', order: 0, votes: [] },
            { id: OPTION_B_ID, text: 'Option B', order: 1, votes: [{ userId: USER_ID }] },
          ],
        }));
      mockPrisma.pollVote.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.pollVote.createMany.mockResolvedValue({ count: 1 });

      const result = await service.changeVote(USER_ID, EVENT_ID, POLL_ID, {
        optionIds: [OPTION_B_ID],
      });

      expect(mockPrisma.pollVote.deleteMany).toHaveBeenCalledWith({
        where: { pollId: POLL_ID, userId: USER_ID },
      });
      expect(mockPrisma.pollVote.createMany).toHaveBeenCalledWith({
        data: [{ pollId: POLL_ID, optionId: OPTION_B_ID, userId: USER_ID }],
      });
      expect(result.myVotes).toEqual([OPTION_B_ID]);
      expect(mockGateway.notifyPollUpdated).toHaveBeenCalled();
    });

    it('throws BadRequestException when poll is closed', async () => {
      setupParticipantAccess();
      mockPrisma.poll.findUnique.mockResolvedValue(makePoll({ status: 'CLOSED' }));

      await expect(
        service.changeVote(USER_ID, EVENT_ID, POLL_ID, { optionIds: [OPTION_B_ID] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  // closePoll
  // ============================================================

  describe('closePoll', () => {
    it('closes the poll when called by creator', async () => {
      setupParticipantAccess();
      const poll = { id: POLL_ID, eventId: EVENT_ID, createdById: USER_ID, status: 'OPEN' };
      mockPrisma.poll.findUnique
        .mockResolvedValueOnce(poll)
        .mockResolvedValueOnce(makePoll({ status: 'CLOSED' }));
      mockPrisma.poll.update.mockResolvedValue({ ...poll, status: 'CLOSED' });

      const result = await service.closePoll(USER_ID, EVENT_ID, POLL_ID);

      expect(mockPrisma.poll.update).toHaveBeenCalledWith({
        where: { id: POLL_ID },
        data: { status: 'CLOSED' },
      });
      expect(result.status).toBe('CLOSED');
      expect(mockGateway.notifyPollUpdated).toHaveBeenCalled();
    });

    it('closes the poll when called by organizer', async () => {
      setupOrganizerAccess();
      const poll = {
        id: POLL_ID,
        eventId: EVENT_ID,
        createdById: OTHER_USER_ID,
        status: 'OPEN',
      };
      mockPrisma.poll.findUnique
        .mockResolvedValueOnce(poll)
        .mockResolvedValueOnce(makePoll({ status: 'CLOSED', createdById: OTHER_USER_ID }));
      mockPrisma.poll.update.mockResolvedValue({ ...poll, status: 'CLOSED' });

      await expect(
        service.closePoll(ORGANIZER_ID, EVENT_ID, POLL_ID),
      ).resolves.toBeDefined();
    });

    it('throws ForbiddenException when user is not creator or organizer', async () => {
      setupParticipantAccess();
      const poll = {
        id: POLL_ID,
        eventId: EVENT_ID,
        createdById: OTHER_USER_ID,
        status: 'OPEN',
      };
      mockPrisma.poll.findUnique.mockResolvedValue(poll);

      await expect(
        service.closePoll(USER_ID, EVENT_ID, POLL_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when poll is already closed', async () => {
      setupParticipantAccess();
      const poll = {
        id: POLL_ID,
        eventId: EVENT_ID,
        createdById: USER_ID,
        status: 'CLOSED',
      };
      mockPrisma.poll.findUnique.mockResolvedValue(poll);

      await expect(
        service.closePoll(USER_ID, EVENT_ID, POLL_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  // deletePoll
  // ============================================================

  describe('deletePoll', () => {
    it('deletes the poll when called by creator', async () => {
      setupParticipantAccess();
      const poll = { id: POLL_ID, eventId: EVENT_ID, createdById: USER_ID };
      mockPrisma.poll.findUnique.mockResolvedValue(poll);
      mockPrisma.poll.delete.mockResolvedValue(poll);

      await service.deletePoll(USER_ID, EVENT_ID, POLL_ID);

      expect(mockPrisma.poll.delete).toHaveBeenCalledWith({ where: { id: POLL_ID } });
      expect(mockGateway.notifyPollDeleted).toHaveBeenCalledWith(EVENT_ID, POLL_ID);
    });

    it('deletes the poll when called by organizer', async () => {
      setupOrganizerAccess();
      const poll = { id: POLL_ID, eventId: EVENT_ID, createdById: OTHER_USER_ID };
      mockPrisma.poll.findUnique.mockResolvedValue(poll);
      mockPrisma.poll.delete.mockResolvedValue(poll);

      await expect(
        service.deletePoll(ORGANIZER_ID, EVENT_ID, POLL_ID),
      ).resolves.toBeUndefined();

      expect(mockPrisma.poll.delete).toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not creator or organizer', async () => {
      setupParticipantAccess();
      const poll = { id: POLL_ID, eventId: EVENT_ID, createdById: OTHER_USER_ID };
      mockPrisma.poll.findUnique.mockResolvedValue(poll);

      await expect(
        service.deletePoll(USER_ID, EVENT_ID, POLL_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
