import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { EventType, ParticipationRequestStatus, PollStatus } from '@prisma/client';

describe('PollsService', () => {
  let service: PollsService;

  const mockPrismaService = {
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
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockGateway = {
    notifyPollCreated: jest.fn(),
    notifyPollUpdated: jest.fn(),
    notifyPollDeleted: jest.fn(),
  };

  const mockCommunityEvent = {
    id: 'event-1',
    organizerId: 'user-1',
    type: EventType.COMMUNITY,
  };

  const mockPollOption = {
    id: 'opt-1',
    text: 'Option A',
    order: 0,
    votes: [],
  };
  const mockPollOption2 = {
    id: 'opt-2',
    text: 'Option B',
    order: 1,
    votes: [],
  };

  const mockPoll = {
    id: 'poll-1',
    eventId: 'event-1',
    createdById: 'user-1',
    question: 'What food?',
    description: null,
    status: PollStatus.OPEN,
    multipleChoice: false,
    closesAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    options: [mockPollOption, mockPollOption2],
    votes: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MessagesGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<PollsService>(PollsService);
    jest.clearAllMocks();
  });

  const setupOrganizerAccess = () => {
    mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
  };

  describe('checkAccess', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.getEventPolls('user-1', 'event-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if event is not COMMUNITY type', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockCommunityEvent,
        type: EventType.PROFESSIONAL,
      });
      await expect(service.getEventPolls('user-1', 'event-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if not organizer and no accepted request', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, organizerId: 'other-user' });
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      await expect(service.getEventPolls('user-1', 'event-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if participation request not ACCEPTED', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, organizerId: 'other-user' });
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: 'PENDING' });
      await expect(service.getEventPolls('user-1', 'event-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getEventPolls', () => {
    it('should return polls sorted by open first, then by date desc', async () => {
      setupOrganizerAccess();
      const closedPoll = {
        ...mockPoll,
        id: 'poll-2',
        status: PollStatus.CLOSED,
        createdAt: new Date('2025-01-02'),
      };
      mockPrismaService.poll.findMany.mockResolvedValue([closedPoll, mockPoll]);
      const result = await service.getEventPolls('user-1', 'event-1');
      expect(result[0].isClosed).toBe(false);
      expect(result[1].isClosed).toBe(true);
    });

    it('should mark poll as closed when closesAt is in the past', async () => {
      setupOrganizerAccess();
      const expiredPoll = {
        ...mockPoll,
        closesAt: new Date(Date.now() - 1000),
        status: PollStatus.OPEN,
      };
      mockPrismaService.poll.findMany.mockResolvedValue([expiredPoll]);
      const result = await service.getEventPolls('user-1', 'event-1');
      expect(result[0].isClosed).toBe(true);
    });

    it('should include myVotes and hasVoted for current user', async () => {
      setupOrganizerAccess();
      const pollWithVote = {
        ...mockPoll,
        votes: [{ userId: 'user-1', optionId: 'opt-1' }],
      };
      mockPrismaService.poll.findMany.mockResolvedValue([pollWithVote]);
      const result = await service.getEventPolls('user-1', 'event-1');
      expect(result[0].hasVoted).toBe(true);
      expect(result[0].myVotes).toContain('opt-1');
    });
  });

  describe('createPoll', () => {
    const createDto = {
      question: 'What food?',
      options: ['Pizza', 'Burger'],
      multipleChoice: false,
    };

    it('should throw BadRequestException if fewer than 2 options', async () => {
      setupOrganizerAccess();
      await expect(
        service.createPoll('user-1', 'event-1', { ...createDto, options: ['Only one'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if closesAt is in the past', async () => {
      setupOrganizerAccess();
      await expect(
        service.createPoll('user-1', 'event-1', {
          ...createDto,
          closesAt: new Date(Date.now() - 1000).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create poll and notify via gateway', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.create.mockResolvedValue(mockPoll);

      const result = await service.createPoll('user-1', 'event-1', createDto);
      expect(result.id).toBe('poll-1');
      expect(mockGateway.notifyPollCreated).toHaveBeenCalledWith(
        'event-1',
        expect.any(Object),
      );
    });

    it('should create poll with closesAt', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.create.mockResolvedValue({
        ...mockPoll,
        closesAt: new Date(Date.now() + 86400000),
      });
      await service.createPoll('user-1', 'event-1', {
        ...createDto,
        closesAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(mockPrismaService.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ closesAt: expect.any(Date) }),
        }),
      );
    });

    it('should default multipleChoice to false when not provided', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.create.mockResolvedValue(mockPoll);
      await service.createPoll('user-1', 'event-1', { question: 'Q?', options: ['A', 'B'] });
      expect(mockPrismaService.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ multipleChoice: false }),
        }),
      );
    });
  });

  describe('vote', () => {
    const voteDto = { optionIds: ['opt-1'] };

    it('should throw NotFoundException if poll not found', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue(null);
      await expect(service.vote('user-1', 'event-1', 'nonexistent', voteDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if poll belongs to different event', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({ ...mockPoll, eventId: 'other-event' });
      await expect(service.vote('user-1', 'event-1', 'poll-1', voteDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if poll is closed', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({
        ...mockPoll,
        status: PollStatus.CLOSED,
      });
      await expect(service.vote('user-1', 'event-1', 'poll-1', voteDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if poll is expired', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({
        ...mockPoll,
        closesAt: new Date(Date.now() - 1000),
      });
      await expect(service.vote('user-1', 'event-1', 'poll-1', voteDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invalid option', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue(mockPoll);
      await expect(
        service.vote('user-1', 'event-1', 'poll-1', { optionIds: ['invalid-opt'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if multiple votes on single-choice poll', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue(mockPoll);
      await expect(
        service.vote('user-1', 'event-1', 'poll-1', { optionIds: ['opt-1', 'opt-2'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if already voted', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({
        ...mockPoll,
        votes: [{ userId: 'user-1', optionId: 'opt-1' }],
      });
      await expect(service.vote('user-1', 'event-1', 'poll-1', voteDto)).rejects.toThrow(ConflictException);
    });

    it('should record vote and notify gateway with neutral data', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique
        .mockResolvedValueOnce(mockPoll)
        .mockResolvedValueOnce({
          ...mockPoll,
          votes: [{ userId: 'user-1', optionId: 'opt-1' }],
        });
      mockPrismaService.pollVote.createMany.mockResolvedValue({});

      await service.vote('user-1', 'event-1', 'poll-1', voteDto);
      expect(mockPrismaService.pollVote.createMany).toHaveBeenCalled();
      expect(mockGateway.notifyPollUpdated).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({ hasVoted: false, myVotes: [] }),
      );
    });

    it('should allow multiple votes on multi-choice poll', async () => {
      setupOrganizerAccess();
      const multiChoicePoll = { ...mockPoll, multipleChoice: true };
      mockPrismaService.poll.findUnique
        .mockResolvedValueOnce(multiChoicePoll)
        .mockResolvedValueOnce({
          ...multiChoicePoll,
          votes: [
            { userId: 'user-1', optionId: 'opt-1' },
            { userId: 'user-1', optionId: 'opt-2' },
          ],
        });
      mockPrismaService.pollVote.createMany.mockResolvedValue({});

      await service.vote('user-1', 'event-1', 'poll-1', { optionIds: ['opt-1', 'opt-2'] });
      expect(mockPrismaService.pollVote.createMany).toHaveBeenCalled();
    });
  });

  describe('changeVote', () => {
    const voteDto = { optionIds: ['opt-2'] };

    it('should throw NotFoundException if poll not found', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue(null);
      await expect(service.changeVote('user-1', 'event-1', 'poll-1', voteDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if poll is closed', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({ ...mockPoll, status: PollStatus.CLOSED });
      await expect(service.changeVote('user-1', 'event-1', 'poll-1', voteDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invalid option', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue(mockPoll);
      await expect(
        service.changeVote('user-1', 'event-1', 'poll-1', { optionIds: ['invalid'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if multiple votes on single-choice poll', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue(mockPoll);
      await expect(
        service.changeVote('user-1', 'event-1', 'poll-1', { optionIds: ['opt-1', 'opt-2'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete old votes and create new ones', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique
        .mockResolvedValueOnce(mockPoll)
        .mockResolvedValueOnce({
          ...mockPoll,
          votes: [{ userId: 'user-1', optionId: 'opt-2' }],
        });
      mockPrismaService.pollVote.deleteMany.mockResolvedValue({});
      mockPrismaService.pollVote.createMany.mockResolvedValue({});

      await service.changeVote('user-1', 'event-1', 'poll-1', voteDto);
      expect(mockPrismaService.pollVote.deleteMany).toHaveBeenCalledWith({
        where: { pollId: 'poll-1', userId: 'user-1' },
      });
      expect(mockPrismaService.pollVote.createMany).toHaveBeenCalled();
      expect(mockGateway.notifyPollUpdated).toHaveBeenCalled();
    });

    it('should throw BadRequestException if expired', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({
        ...mockPoll,
        closesAt: new Date(Date.now() - 1000),
      });
      await expect(service.changeVote('user-1', 'event-1', 'poll-1', voteDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if poll belongs to different event', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({ ...mockPoll, eventId: 'other-event' });
      await expect(service.changeVote('user-1', 'event-1', 'poll-1', voteDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('closePoll', () => {
    it('should throw NotFoundException if poll not found', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue(null);
      await expect(service.closePoll('user-1', 'event-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already closed', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({
        id: 'poll-1',
        eventId: 'event-1',
        createdById: 'user-1',
        status: PollStatus.CLOSED,
      });
      await expect(service.closePoll('user-1', 'event-1', 'poll-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if neither creator nor organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, organizerId: 'other-user' });
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({
        status: ParticipationRequestStatus.ACCEPTED,
      });
      mockPrismaService.poll.findUnique.mockResolvedValue({
        id: 'poll-1',
        eventId: 'event-1',
        createdById: 'another-user',
        status: PollStatus.OPEN,
      });
      await expect(service.closePoll('user-2', 'event-1', 'poll-1')).rejects.toThrow(ForbiddenException);
    });

    it('should close poll as creator and notify gateway', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique
        .mockResolvedValueOnce({
          id: 'poll-1',
          eventId: 'event-1',
          createdById: 'user-1',
          status: PollStatus.OPEN,
        })
        .mockResolvedValueOnce({ ...mockPoll, status: PollStatus.CLOSED });
      mockPrismaService.poll.update.mockResolvedValue({});

      await service.closePoll('user-1', 'event-1', 'poll-1');
      expect(mockPrismaService.poll.update).toHaveBeenCalledWith({
        where: { id: 'poll-1' },
        data: { status: PollStatus.CLOSED },
      });
      expect(mockGateway.notifyPollUpdated).toHaveBeenCalled();
    });

    it('should allow organizer to close any poll', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique
        .mockResolvedValueOnce({
          id: 'poll-1',
          eventId: 'event-1',
          createdById: 'other-user',
          status: PollStatus.OPEN,
        })
        .mockResolvedValueOnce({ ...mockPoll, status: PollStatus.CLOSED });
      mockPrismaService.poll.update.mockResolvedValue({});

      await service.closePoll('user-1', 'event-1', 'poll-1');
      expect(mockPrismaService.poll.update).toHaveBeenCalled();
    });
  });

  describe('deletePoll', () => {
    it('should throw NotFoundException if poll not found', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue(null);
      await expect(service.deletePoll('user-1', 'event-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if neither creator nor organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, organizerId: 'other-user' });
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({
        status: ParticipationRequestStatus.ACCEPTED,
      });
      mockPrismaService.poll.findUnique.mockResolvedValue({
        id: 'poll-1',
        eventId: 'event-1',
        createdById: 'another-user',
      });
      await expect(service.deletePoll('user-2', 'event-1', 'poll-1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete poll as creator and notify gateway', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({
        id: 'poll-1',
        eventId: 'event-1',
        createdById: 'user-1',
      });
      mockPrismaService.poll.delete.mockResolvedValue({});

      await service.deletePoll('user-1', 'event-1', 'poll-1');
      expect(mockPrismaService.poll.delete).toHaveBeenCalledWith({ where: { id: 'poll-1' } });
      expect(mockGateway.notifyPollDeleted).toHaveBeenCalledWith('event-1', 'poll-1');
    });

    it('should allow organizer to delete any poll', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({
        id: 'poll-1',
        eventId: 'event-1',
        createdById: 'other-user',
      });
      mockPrismaService.poll.delete.mockResolvedValue({});

      await service.deletePoll('user-1', 'event-1', 'poll-1');
      expect(mockPrismaService.poll.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if poll belongs to different event', async () => {
      setupOrganizerAccess();
      mockPrismaService.poll.findUnique.mockResolvedValue({
        id: 'poll-1',
        eventId: 'other-event',
        createdById: 'user-1',
      });
      await expect(service.deletePoll('user-1', 'event-1', 'poll-1')).rejects.toThrow(NotFoundException);
    });
  });
});
