import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
  let controller: ReviewsController;

  const mockReviewsService = {
    create: jest.fn(),
    findAllByEvent: jest.fn(),
    findAllByUser: jest.fn(),
    canUserReview: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockClientUser = { id: 'user-1', role: 'USER' };
  const mockOrganizerUser = { id: 'org-1', role: 'ORGANIZER' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [{ provide: ReviewsService, useValue: mockReviewsService }],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    jest.clearAllMocks();
  });

  it('should create review', async () => {
    mockReviewsService.create.mockResolvedValue({ id: 'review-1' });
    await controller.create('event-1', { rating: 5, comment: 'Great' }, mockClientUser as any);
    expect(mockReviewsService.create).toHaveBeenCalledWith('event-1', 'user-1', { rating: 5, comment: 'Great' });
  });

  it('should find all reviews by event', async () => {
    mockReviewsService.findAllByEvent.mockResolvedValue({ reviews: [], pagination: {}, stats: {} });
    await controller.findAllByEvent('event-1', 1, 10, 'recent');
    expect(mockReviewsService.findAllByEvent).toHaveBeenCalledWith('event-1', 1, 10, 'recent');
  });

  it('should return canReview for CLIENT user', async () => {
    mockReviewsService.canUserReview.mockResolvedValue({ canReview: true });
    await controller.canUserReview('event-1', mockClientUser as any);
    expect(mockReviewsService.canUserReview).toHaveBeenCalledWith('event-1', 'user-1');
  });

  it('should return canReview: false for non-CLIENT user', async () => {
    const result = await controller.canUserReview('event-1', mockOrganizerUser as any);
    expect(result.canReview).toBe(false);
    expect(mockReviewsService.canUserReview).not.toHaveBeenCalled();
  });

  it('should get my reviews', async () => {
    mockReviewsService.findAllByUser.mockResolvedValue([]);
    await controller.getMyReviews(mockClientUser as any);
    expect(mockReviewsService.findAllByUser).toHaveBeenCalledWith('user-1');
  });

  it('should update review', async () => {
    mockReviewsService.update.mockResolvedValue({ id: 'review-1', rating: 5 });
    await controller.update('review-1', { rating: 5 }, mockClientUser as any);
    expect(mockReviewsService.update).toHaveBeenCalledWith('review-1', 'user-1', { rating: 5 });
  });

  it('should delete review', async () => {
    mockReviewsService.delete.mockResolvedValue({});
    await controller.delete('review-1', mockClientUser as any);
    expect(mockReviewsService.delete).toHaveBeenCalledWith('review-1', 'user-1');
  });
});
