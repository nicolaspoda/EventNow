import { Test, TestingModule } from '@nestjs/testing';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

const mockPollsService = {
  getEventPolls: jest.fn(),
  createPoll: jest.fn(),
  vote: jest.fn(),
  changeVote: jest.fn(),
  closePoll: jest.fn(),
  deletePoll: jest.fn(),
};

const mockUser = { id: 'user-1', email: 'test@test.com', role: 'USER' };

describe('PollsController', () => {
  let controller: PollsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PollsController],
      providers: [{ provide: PollsService, useValue: mockPollsService }],
    }).compile();

    controller = module.get<PollsController>(PollsController);
  });

  it('getEventPolls delegates to service', async () => {
    mockPollsService.getEventPolls.mockResolvedValue([]);
    await controller.getEventPolls('event-1', mockUser as any);
    expect(mockPollsService.getEventPolls).toHaveBeenCalledWith(
      'user-1',
      'event-1',
    );
  });

  it('createPoll delegates to service', async () => {
    const dto = { question: 'Test question?', options: ['A', 'B'] };
    mockPollsService.createPoll.mockResolvedValue({});
    await controller.createPoll('event-1', dto as any, mockUser as any);
    expect(mockPollsService.createPoll).toHaveBeenCalledWith(
      'user-1',
      'event-1',
      dto,
    );
  });

  it('vote delegates to service', async () => {
    const dto = { optionIds: ['option-1'] };
    mockPollsService.vote.mockResolvedValue({});
    await controller.vote('event-1', 'poll-1', dto as any, mockUser as any);
    expect(mockPollsService.vote).toHaveBeenCalledWith(
      'user-1',
      'event-1',
      'poll-1',
      dto,
    );
  });

  it('changeVote delegates to service', async () => {
    const dto = { optionIds: ['option-2'] };
    mockPollsService.changeVote.mockResolvedValue({});
    await controller.changeVote(
      'event-1',
      'poll-1',
      dto as any,
      mockUser as any,
    );
    expect(mockPollsService.changeVote).toHaveBeenCalledWith(
      'user-1',
      'event-1',
      'poll-1',
      dto,
    );
  });

  it('closePoll delegates to service', async () => {
    mockPollsService.closePoll.mockResolvedValue({});
    await controller.closePoll('event-1', 'poll-1', mockUser as any);
    expect(mockPollsService.closePoll).toHaveBeenCalledWith(
      'user-1',
      'event-1',
      'poll-1',
    );
  });

  it('deletePoll delegates to service', async () => {
    mockPollsService.deletePoll.mockResolvedValue(undefined);
    await controller.deletePoll('event-1', 'poll-1', mockUser as any);
    expect(mockPollsService.deletePoll).toHaveBeenCalledWith(
      'user-1',
      'event-1',
      'poll-1',
    );
  });
});
