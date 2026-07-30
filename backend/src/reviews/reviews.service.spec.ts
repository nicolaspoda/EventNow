import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventType } from '@prisma/client';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockGateway = {
    notifyReviewsChanged: jest.fn(),
  };

  const mockPrismaService = {
    event: { findUnique: jest.fn() },
    participationRequest: { findUnique: jest.fn() },
    ticket: { findFirst: jest.fn() },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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
  };

  const mockProfessionalEvent = {
    id: 'event-1',
    type: EventType.PROFESSIONAL,
    organizerId: 'organizer-1',
    eventDate: pastDate,
  };

  const mockReview = {
    id: 'review-1',
    eventId: 'event-1',
    userId: 'user-1',
    rating: 4,
    comment: 'Great event',
    createdAt: new Date(),
    user: { id: 'user-1', email: 'user@example.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MessagesGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.create('event-1', 'user-1', { rating: 5, comment: 'Good' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if event not yet past', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, eventDate: futureDate });
      await expect(service.create('event-1', 'user-1', { rating: 5, comment: 'Good' })).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user did not attend COMMUNITY event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      await expect(service.create('event-1', 'user-1', { rating: 5, comment: 'Good' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user did not attend PROFESSIONAL event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockProfessionalEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      await expect(service.create('event-1', 'user-1', { rating: 5, comment: 'Good' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if review already exists', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: 'ACCEPTED' });
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      await expect(service.create('event-1', 'user-1', { rating: 5, comment: 'Good' })).rejects.toThrow(BadRequestException);
    });

    it('should create review for COMMUNITY event attendee', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: 'ACCEPTED' });
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue(mockReview);
      await service.create('event-1', 'user-1', { rating: 4, comment: 'Great' });
      expect(mockPrismaService.review.create).toHaveBeenCalled();
    });

    it('should create review for PROFESSIONAL event attendee with validated ticket', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockProfessionalEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue({ id: 'ticket-1' });
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue(mockReview);
      await service.create('event-1', 'user-1', { rating: 4, comment: 'Great' });
      expect(mockPrismaService.review.create).toHaveBeenCalled();
    });

    it('should handle null eventDate as past event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, eventDate: null });
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: 'ACCEPTED' });
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue(mockReview);
      await service.create('event-1', 'user-1', { rating: 4, comment: 'Great' });
      expect(mockPrismaService.review.create).toHaveBeenCalled();
    });
  });

  describe('findAllByEvent', () => {
    it('should return reviews with pagination and stats', async () => {
      const reviews = [{ ...mockReview, user: { email: 'user@example.com' } }];
      mockPrismaService.review.findMany.mockResolvedValue(reviews);
      mockPrismaService.review.count.mockResolvedValue(1);
      mockPrismaService.review.aggregate.mockResolvedValue({ _avg: { rating: 4 }, _count: { rating: 1 } });
      const result = await service.findAllByEvent('event-1');
      expect(result.reviews).toHaveLength(1);
      expect(result.stats.averageRating).toBe(4);
      expect(result.pagination.total).toBe(1);
    });

    it('should mask email in reviews', async () => {
      const reviews = [{ ...mockReview, user: { email: 'johndoe@example.com' } }];
      mockPrismaService.review.findMany.mockResolvedValue(reviews);
      mockPrismaService.review.count.mockResolvedValue(1);
      mockPrismaService.review.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } });
      const result = await service.findAllByEvent('event-1');
      expect(result.reviews[0].user.email).toMatch(/^j\*+@example\.com$/);
    });

    it('should return null averageRating when no ratings', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(0);
      mockPrismaService.review.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } });
      const result = await service.findAllByEvent('event-1');
      expect(result.stats.averageRating).toBeNull();
    });

    it('should sort by highest rating', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(0);
      mockPrismaService.review.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } });
      await service.findAllByEvent('event-1', 1, 10, 'highest');
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { rating: 'desc' } }),
      );
    });

    it('should sort by lowest rating', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(0);
      mockPrismaService.review.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } });
      await service.findAllByEvent('event-1', 1, 10, 'lowest');
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { rating: 'asc' } }),
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return reviews for user', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([mockReview]);
      const result = await service.findAllByUser('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('canUserReview', () => {
    it('should return canReview: false if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      const result = await service.canUserReview('event-1', 'user-1');
      expect(result.canReview).toBe(false);
      expect(result.reason).toContain('introuvable');
    });

    it('should return canReview: false if event not yet past', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockCommunityEvent, eventDate: futureDate });
      const result = await service.canUserReview('event-1', 'user-1');
      expect(result.canReview).toBe(false);
    });

    it('should return canReview: false if user did not attend', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue(null);
      const result = await service.canUserReview('event-1', 'user-1');
      expect(result.canReview).toBe(false);
    });

    it('should return canReview: false if already reviewed', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: 'ACCEPTED' });
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      const result = await service.canUserReview('event-1', 'user-1');
      expect(result.canReview).toBe(false);
    });

    it('should return canReview: true if eligible', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockCommunityEvent);
      mockPrismaService.participationRequest.findUnique.mockResolvedValue({ status: 'ACCEPTED' });
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      const result = await service.canUserReview('event-1', 'user-1');
      expect(result.canReview).toBe(true);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if review not found', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      await expect(service.update('review-1', 'user-1', { rating: 5 })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({ ...mockReview, userId: 'user-2' });
      await expect(service.update('review-1', 'user-1', { rating: 5 })).rejects.toThrow(ForbiddenException);
    });

    it('should update review', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.update.mockResolvedValue({ ...mockReview, rating: 5 });
      await service.update('review-1', 'user-1', { rating: 5 });
      expect(mockPrismaService.review.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if review not found', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      await expect(service.delete('review-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({ ...mockReview, userId: 'user-2' });
      await expect(service.delete('review-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete review', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.delete.mockResolvedValue({});
      await service.delete('review-1', 'user-1');
      expect(mockPrismaService.review.delete).toHaveBeenCalledWith({ where: { id: 'review-1' } });
    });
  });
});
