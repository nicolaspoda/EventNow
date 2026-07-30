import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantReviewsController } from './participant-reviews.controller';
import { ParticipantReviewsService } from './participant-reviews.service';

describe('ParticipantReviewsController', () => {
  let controller: ParticipantReviewsController;

  const mockService = {
    create: jest.fn(),
    findAllByParticipant: jest.fn(),
    findAllByEvent: jest.fn(),
    getParticipantsForEvent: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUser = { id: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipantReviewsController],
      providers: [{ provide: ParticipantReviewsService, useValue: mockService }],
    }).compile();

    controller = module.get<ParticipantReviewsController>(ParticipantReviewsController);
    jest.clearAllMocks();
  });

  it('should create participant review', () => {
    mockService.create.mockResolvedValue({ id: 'review-1' });
    controller.create(mockUser, { eventId: 'e-1', participantId: 'p-1', rating: 4 } as any);
    expect(mockService.create).toHaveBeenCalledWith('user-1', expect.objectContaining({ eventId: 'e-1' }));
  });

  it('should find reviews by participant', () => {
    mockService.findAllByParticipant.mockResolvedValue({ reviews: [], stats: {} });
    controller.findAllByParticipant('participant-1');
    expect(mockService.findAllByParticipant).toHaveBeenCalledWith('participant-1');
  });

  it('should find reviews by event', () => {
    mockService.findAllByEvent.mockResolvedValue([]);
    controller.findAllByEvent('event-1', mockUser);
    expect(mockService.findAllByEvent).toHaveBeenCalledWith('event-1', 'user-1');
  });

  it('should get participants for event', () => {
    mockService.getParticipantsForEvent.mockResolvedValue([]);
    controller.getParticipantsForEvent('event-1', mockUser);
    expect(mockService.getParticipantsForEvent).toHaveBeenCalledWith('event-1', 'user-1');
  });

  it('should update participant review', () => {
    mockService.update.mockResolvedValue({ id: 'review-1', rating: 5 });
    controller.update('review-1', mockUser, { rating: 5 } as any);
    expect(mockService.update).toHaveBeenCalledWith('review-1', 'user-1', { rating: 5 });
  });

  it('should delete participant review', () => {
    mockService.delete.mockResolvedValue({});
    controller.delete('review-1', mockUser);
    expect(mockService.delete).toHaveBeenCalledWith('review-1', 'user-1');
  });
});
