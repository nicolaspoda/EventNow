import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pollsService } from '../services/pollsService';
import { api } from '../services/api';
import type { Poll, CreatePollDto, VotePollDto } from '../services/pollsService';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const poll: Poll = {
  id: 'p1',
  eventId: 'e1',
  createdById: 'u1',
  question: 'Pizza or sushi?',
  description: null,
  status: 'OPEN',
  multipleChoice: false,
  closesAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  options: [],
  hasVoted: false,
  myVotes: [],
  totalVotes: 0,
  isCreatedByMe: true,
  isClosed: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('pollsService', () => {
  it('getEventPolls fetches polls for an event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [poll] });

    const result = await pollsService.getEventPolls('e1');

    expect(api.get).toHaveBeenCalledWith('/events/e1/polls');
    expect(result).toEqual([poll]);
  });

  it('createPoll posts the new poll dto', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: poll });
    const dto: CreatePollDto = { question: 'Pizza or sushi?', options: ['Pizza', 'Sushi'] };

    const result = await pollsService.createPoll('e1', dto);

    expect(api.post).toHaveBeenCalledWith('/events/e1/polls', dto);
    expect(result).toEqual(poll);
  });

  it('vote posts the selected option ids', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: poll });
    const dto: VotePollDto = { optionIds: ['o1'] };

    const result = await pollsService.vote('e1', 'p1', dto);

    expect(api.post).toHaveBeenCalledWith('/events/e1/polls/p1/vote', dto);
    expect(result).toEqual(poll);
  });

  it('changeVote patches the selected option ids', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: poll });
    const dto: VotePollDto = { optionIds: ['o2'] };

    const result = await pollsService.changeVote('e1', 'p1', dto);

    expect(api.patch).toHaveBeenCalledWith('/events/e1/polls/p1/vote', dto);
    expect(result).toEqual(poll);
  });

  it('closePoll patches the close endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: poll });

    const result = await pollsService.closePoll('e1', 'p1');

    expect(api.patch).toHaveBeenCalledWith('/events/e1/polls/p1/close');
    expect(result).toEqual(poll);
  });

  it('deletePoll deletes the poll by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await pollsService.deletePoll('e1', 'p1');

    expect(api.delete).toHaveBeenCalledWith('/events/e1/polls/p1');
  });
});
