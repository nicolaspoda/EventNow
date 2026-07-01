import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantReviewsService } from './participant-reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventType, ParticipationRequestStatus } from '@prisma/client';

describe('ParticipantReviewsService', () => {
  let service: ParticipantReviewsService;

  const mockPrismaService = {
    event: { findUnique: jest.fn() },
    participationRequest: { findUnique: jest.fn(), findMany: jest.fn() },
    participantReview: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const pastDate = new Date('2020-01-01T00:00:00Z');
  const futureDate = new Date(Date.now() + 86400000);

  const mockCommunityEvent = {
    id: 'event-1',
    type: EventType.COMMUNITY,
    organizerId: 'organizer-1',
    eventDate: pastDate,
    organizer: { id: 'organizer-1' },
  };

  const mockReview = {
    id: 'review-1',
    eventId: 'event-1',
    reviewerId: 'organizer-1',
    participantId: 'user-1',
    rating: 4,
    comment: 'Good participant',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ParticipantReviewsService>(ParticipantReviewsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { eventId: 'event-1', participantId: 'user-1', rating: 4, comment: 'Good' };

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.create('organizer-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if event is not COMMUNITY', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, type: EventType.PROFESSIONAL });
      await expect(service.create('organizer-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event not yet past', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, eventDate: futureDate });
      await expect(service.create('organizer-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if reviewer is not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      await expect(service.create('other-user', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if reviewing yourself', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      await expect(service.create('organizer-1', { ...dto, participantId: 'organizer-1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if participant was not accepted', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      await expect(service.create('organizer-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if participant not accepted status', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: ParticipationRequestStatus.PENDING });
      await expect(service.create('organizer-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if review already exists', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: ParticipationRequestStatus.ACCEPTED });
      mockPrismaService.participantReview.findUnique.mockResolvedValue(mockReview);
      await expect(service.create('organizer-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should create review successfully', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: ParticipationRequestStatus.ACCEPTED });
      mockPrismaService.participantReview.findUnique.mockResolvedValue(null);
      mockPrismaService.participantReview.create.mockResolvedValue(mockReview);
      const result = await service.create('organizer-1', dto);
      expect(mockPrismaService.participantReview.create).toHaveBeenCalled();
    });

    it('should handle null eventDate as past', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, eventDate: null });
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: ParticipationRequestStatus.ACCEPTED });
      mockPrismaService.participantReview.findUnique.mockResolvedValue(null);
      mockPrismaService.participantReview.create.mockResolvedValue(mockReview);
      await service.create('organizer-1', dto);
      expect(mockPrismaService.participantReview.create).toHaveBeenCalled();
    });
  });

  describe('findAllByParticipant', () => {
    it('should return reviews with stats', async () => {
      mockPrismaService.participantReview.findMany.mockResolvedValue([mockReview]);
      mockPrismaService.participantReview.aggregate.mockResolvedValue({ _avg: { rating: 4 }, _count: { rating: 1 } });
      const result = await service.findAllByParticipant('user-1');
      expect(result.reviews).toHaveLength(1);
      expect(result.stats.averageRating).toBe(4);
    });

    it('should return null averageRating when no reviews', async () => {
      mockPrismaService.participantReview.findMany.mockResolvedValue([]);
      mockPrismaService.participantReview.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } });
      const result = await service.findAllByParticipant('user-1');
      expect(result.stats.averageRating).toBeNull();
    });
  });

  describe('findAllByEvent', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.findAllByEvent('event-1', 'organizer-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      await expect(service.findAllByEvent('event-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });

    it('should return reviews for event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participantReview.findMany.mockResolvedValue([mockReview]);
      const result = await service.findAllByEvent('event-1', 'organizer-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if review not found', async () => {
      mockPrismaService.participantReview.findUnique.mockResolvedValue(null);
      await expect(service.update('review-1', 'organizer-1', { rating: 5 })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not reviewer', async () => {
      mockPrismaService.participantReview.findUnique.mockResolvedValue({ ...mockReview, reviewerId: 'other-user' });
      await expect(service.update('review-1', 'organizer-1', { rating: 5 })).rejects.toThrow(ForbiddenException);
    });

    it('should update review', async () => {
      mockPrismaService.participantReview.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.participantReview.update.mockResolvedValue({ ...mockReview, rating: 5 });
      await service.update('review-1', 'organizer-1', { rating: 5 });
      expect(mockPrismaService.participantReview.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if review not found', async () => {
      mockPrismaService.participantReview.findUnique.mockResolvedValue(null);
      await expect(service.delete('review-1', 'organizer-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not reviewer', async () => {
      mockPrismaService.participantReview.findUnique.mockResolvedValue({ ...mockReview, reviewerId: 'other-user' });
      await expect(service.delete('review-1', 'organizer-1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete review', async () => {
      mockPrismaService.participantReview.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.participantReview.delete.mockResolvedValue({});
      await service.delete('review-1', 'organizer-1');
      expect(mockPrismaService.participantReview.delete).toHaveBeenCalledWith({ where: { id: 'review-1' } });
    });
  });

  describe('getParticipantsForEvent', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.getParticipantsForEvent('event-1', 'organizer-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      await expect(service.getParticipantsForEvent('event-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });

    it('should return participants with review status', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([
        { userId: 'user-1', user: { id: 'user-1', email: 'u@test.com', username: 'user1', avatarUrl: null } },
      ]);
      mockPrismaService.participantReview.findUnique.mockResolvedValue(mockReview);
      const result = await service.getParticipantsForEvent('event-1', 'organizer-1');
      expect(result).toHaveLength(1);
      expect(result[0].hasReview).toBe(true);
    });

    it('should show hasReview: false when no review exists', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([
        { userId: 'user-1', user: { id: 'user-1', email: 'u@test.com', username: 'user1', avatarUrl: null } },
      ]);
      mockPrismaService.participantReview.findUnique.mockResolvedValue(null);
      const result = await service.getParticipantsForEvent('event-1', 'organizer-1');
      expect(result[0].hasReview).toBe(false);
      expect(result[0].review).toBeNull();
    });
  });
});
