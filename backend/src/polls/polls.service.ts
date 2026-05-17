import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  EventType,
  ParticipationRequestStatus,
  PollStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { CreatePollDto } from './dto/create-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';

const POLL_INCLUDE = {
  options: {
    orderBy: { order: 'asc' as const },
    select: {
      id: true,
      text: true,
      order: true,
      votes: { select: { userId: true } },
    },
  },
  votes: {
    select: { userId: true, optionId: true },
  },
} as const;

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MessagesGateway,
  ) {}

  private async checkAccess(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, type: true },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.type !== EventType.COMMUNITY) {
      throw new BadRequestException(
        'Cette fonctionnalité est réservée aux événements communautaires',
      );
    }

    if (event.organizerId !== userId) {
      const request = await this.prisma.participationRequest.findUnique({
        where: { eventId_userId: { eventId, userId } },
        select: { status: true },
      });
      if (request?.status !== ParticipationRequestStatus.ACCEPTED) {
        throw new ForbiddenException(
          'Vous devez être participant accepté pour accéder aux sondages',
        );
      }
    }

    return event;
  }

  private formatPoll(
    poll: {
      id: string;
      eventId: string;
      createdById: string;
      question: string;
      description: string | null;
      status: PollStatus;
      multipleChoice: boolean;
      closesAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      options: {
        id: string;
        text: string;
        order: number;
        votes: { userId: string }[];
      }[];
      votes: { userId: string; optionId: string }[];
    },
    userId: string,
  ) {
    const now = new Date();
    const isClosed =
      poll.status === PollStatus.CLOSED ||
      (poll.closesAt !== null && poll.closesAt < now);

    const myVotes = poll.votes
      .filter((v) => v.userId === userId)
      .map((v) => v.optionId);

    const uniqueVoters = new Set(poll.votes.map((v) => v.userId));
    const totalVotes = uniqueVoters.size;

    return {
      id: poll.id,
      eventId: poll.eventId,
      createdById: poll.createdById,
      question: poll.question,
      description: poll.description,
      status: poll.status,
      multipleChoice: poll.multipleChoice,
      closesAt: poll.closesAt,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      hasVoted: myVotes.length > 0,
      myVotes,
      totalVotes,
      isCreatedByMe: poll.createdById === userId,
      isClosed,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        order: opt.order,
        voteCount: opt.votes.length,
      })),
    };
  }

  private async fetchFormattedPoll(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: POLL_INCLUDE,
    });
    if (!poll) throw new NotFoundException('Sondage introuvable');
    return this.formatPoll(poll, userId);
  }

  private async fetchPollForBroadcast(pollId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: POLL_INCLUDE,
    });
    if (!poll) throw new NotFoundException('Sondage introuvable');
    const base = this.formatPoll(poll, '');
    return { ...base, hasVoted: false, myVotes: [], isCreatedByMe: false };
  }

  async getEventPolls(userId: string, eventId: string) {
    await this.checkAccess(userId, eventId);

    const polls = await this.prisma.poll.findMany({
      where: { eventId },
      include: POLL_INCLUDE,
    });

    const formatted = polls.map((p) => this.formatPoll(p, userId));

    formatted.sort((a, b) => {
      const aClosed = a.isClosed ? 1 : 0;
      const bClosed = b.isClosed ? 1 : 0;
      if (aClosed !== bClosed) return aClosed - bClosed;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return formatted;
  }

  async createPoll(userId: string, eventId: string, dto: CreatePollDto) {
    await this.checkAccess(userId, eventId);

    if (dto.options.length < 2) {
      throw new BadRequestException('Un sondage doit avoir au moins 2 options');
    }

    if (dto.closesAt && new Date(dto.closesAt) <= new Date()) {
      throw new BadRequestException(
        'La date de clôture doit être dans le futur',
      );
    }

    const poll = await this.prisma.poll.create({
      data: {
        eventId,
        createdById: userId,
        question: dto.question,
        description: dto.description,
        multipleChoice: dto.multipleChoice ?? false,
        closesAt: dto.closesAt ? new Date(dto.closesAt) : undefined,
        options: {
          create: dto.options.map((text, index) => ({ text, order: index })),
        },
      },
      include: POLL_INCLUDE,
    });

    const formatted = this.formatPoll(poll, userId);
    this.gateway.notifyPollCreated(eventId, formatted);
    return formatted;
  }

  async vote(
    userId: string,
    eventId: string,
    pollId: string,
    dto: VotePollDto,
  ) {
    await this.checkAccess(userId, eventId);

    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: POLL_INCLUDE,
    });

    if (!poll || poll.eventId !== eventId) {
      throw new NotFoundException('Sondage introuvable');
    }

    const now = new Date();
    const isExpired = poll.closesAt !== null && poll.closesAt < now;
    if (poll.status === PollStatus.CLOSED || isExpired) {
      throw new BadRequestException('This poll is closed');
    }

    for (const optionId of dto.optionIds) {
      if (!poll.options.some((o) => o.id === optionId)) {
        throw new BadRequestException('Invalid option');
      }
    }

    if (!poll.multipleChoice && dto.optionIds.length !== 1) {
      throw new BadRequestException('This poll only allows one vote');
    }

    const existingVotes = poll.votes.filter((v) => v.userId === userId);
    if (existingVotes.length > 0) {
      throw new ConflictException('Already voted');
    }

    await this.prisma.pollVote.createMany({
      data: dto.optionIds.map((optionId) => ({
        pollId,
        optionId,
        userId,
      })),
    });

    const updated = await this.fetchFormattedPoll(pollId, userId);
    const broadcast = await this.fetchPollForBroadcast(pollId);
    this.gateway.notifyPollUpdated(eventId, broadcast);
    return updated;
  }

  async changeVote(
    userId: string,
    eventId: string,
    pollId: string,
    dto: VotePollDto,
  ) {
    await this.checkAccess(userId, eventId);

    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: POLL_INCLUDE,
    });

    if (!poll || poll.eventId !== eventId) {
      throw new NotFoundException('Sondage introuvable');
    }

    const now = new Date();
    const isExpired = poll.closesAt !== null && poll.closesAt < now;
    if (poll.status === PollStatus.CLOSED || isExpired) {
      throw new BadRequestException('This poll is closed');
    }

    for (const optionId of dto.optionIds) {
      if (!poll.options.some((o) => o.id === optionId)) {
        throw new BadRequestException('Invalid option');
      }
    }

    if (!poll.multipleChoice && dto.optionIds.length !== 1) {
      throw new BadRequestException('This poll only allows one vote');
    }

    await this.prisma.pollVote.deleteMany({
      where: { pollId, userId },
    });

    await this.prisma.pollVote.createMany({
      data: dto.optionIds.map((optionId) => ({
        pollId,
        optionId,
        userId,
      })),
    });

    const updated = await this.fetchFormattedPoll(pollId, userId);
    const broadcast = await this.fetchPollForBroadcast(pollId);
    this.gateway.notifyPollUpdated(eventId, broadcast);
    return updated;
  }

  async closePoll(userId: string, eventId: string, pollId: string) {
    const event = await this.checkAccess(userId, eventId);

    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      select: { id: true, eventId: true, createdById: true, status: true },
    });

    if (!poll || poll.eventId !== eventId) {
      throw new NotFoundException('Sondage introuvable');
    }

    if (poll.status === PollStatus.CLOSED) {
      throw new BadRequestException('Ce sondage est déjà fermé');
    }

    const isCreator = poll.createdById === userId;
    const isOrganizer = event.organizerId === userId;
    if (!isCreator && !isOrganizer) {
      throw new ForbiddenException(
        "Seul le créateur ou l'organisateur peut fermer ce sondage",
      );
    }

    await this.prisma.poll.update({
      where: { id: pollId },
      data: { status: PollStatus.CLOSED },
    });

    const updated = await this.fetchFormattedPoll(pollId, userId);
    const broadcast = await this.fetchPollForBroadcast(pollId);
    this.gateway.notifyPollUpdated(eventId, broadcast);
    return updated;
  }

  async deletePoll(userId: string, eventId: string, pollId: string) {
    const event = await this.checkAccess(userId, eventId);

    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      select: { id: true, eventId: true, createdById: true },
    });

    if (!poll || poll.eventId !== eventId) {
      throw new NotFoundException('Sondage introuvable');
    }

    const isCreator = poll.createdById === userId;
    const isOrganizer = event.organizerId === userId;
    if (!isCreator && !isOrganizer) {
      throw new ForbiddenException(
        "Seul le créateur ou l'organisateur peut supprimer ce sondage",
      );
    }

    await this.prisma.poll.delete({ where: { id: pollId } });
    this.gateway.notifyPollDeleted(eventId, pollId);
  }
}
