import { api } from './api';

export type PollStatus = 'OPEN' | 'CLOSED';

export interface PollOption {
  id: string;
  text: string;
  order: number;
  voteCount: number;
}

export interface Poll {
  id: string;
  eventId: string;
  createdById: string;
  question: string;
  description: string | null;
  status: PollStatus;
  multipleChoice: boolean;
  closesAt: string | null;
  createdAt: string;
  updatedAt: string;
  options: PollOption[];
  hasVoted: boolean;
  myVotes: string[];
  totalVotes: number;
  isCreatedByMe: boolean;
  isClosed: boolean;
}

export interface CreatePollDto {
  question: string;
  description?: string;
  options: string[];
  multipleChoice?: boolean;
  closesAt?: string;
}

export interface VotePollDto {
  optionIds: string[];
}

export const pollsService = {
  async getEventPolls(eventId: string): Promise<Poll[]> {
    const response = await api.get<Poll[]>(`/events/${eventId}/polls`);
    return response.data;
  },

  async createPoll(eventId: string, dto: CreatePollDto): Promise<Poll> {
    const response = await api.post<Poll>(`/events/${eventId}/polls`, dto);
    return response.data;
  },

  async vote(eventId: string, pollId: string, dto: VotePollDto): Promise<Poll> {
    const response = await api.post<Poll>(
      `/events/${eventId}/polls/${pollId}/vote`,
      dto,
    );
    return response.data;
  },

  async changeVote(eventId: string, pollId: string, dto: VotePollDto): Promise<Poll> {
    const response = await api.patch<Poll>(
      `/events/${eventId}/polls/${pollId}/vote`,
      dto,
    );
    return response.data;
  },

  async closePoll(eventId: string, pollId: string): Promise<Poll> {
    const response = await api.patch<Poll>(
      `/events/${eventId}/polls/${pollId}/close`,
    );
    return response.data;
  },

  async deletePoll(eventId: string, pollId: string): Promise<void> {
    await api.delete(`/events/${eventId}/polls/${pollId}`);
  },
};
