import { api } from './api';

export interface User {
  id: string;
  username?: string | null;
  email: string;
  avatarUrl?: string;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: string;
  lastReadAt: string;
  user: User;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender: User;
}

export const ConversationType = {
  DIRECT: 'DIRECT',
  GROUP: 'GROUP',
  EVENT: 'EVENT',
} as const;

export type ConversationTypeValue = typeof ConversationType[keyof typeof ConversationType];

export interface Conversation {
  id: string;
  type: ConversationTypeValue;
  name?: string;
  imageUrl?: string;
  eventId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
  messages?: Message[];
  unreadCount?: number;
}

export interface CreateConversationDto {
  type: ConversationTypeValue;
  name?: string;
  imageUrl?: string;
  memberIds: string[];
  eventId?: string;
}

export interface SendMessageDto {
  content: string;
}

export interface AddMembersDto {
  memberIds: string[];
}

export interface UpdateConversationDto {
  name?: string;
  imageUrl?: string;
}

const messageService = {
  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    const response = await api.post('/messages/conversations', dto);
    return response.data;
  },

  async getUserConversations(): Promise<Conversation[]> {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  async updateConversation(
    conversationId: string,
    dto: UpdateConversationDto,
  ): Promise<Conversation> {
    const response = await api.put(
      `/messages/conversations/${conversationId}`,
      dto,
    );
    return response.data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/messages/conversations/${conversationId}`);
  },

  async getMessages(
    conversationId: string,
    limit = 50,
    before?: string,
  ): Promise<Message[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (before) {
      params.append('before', before);
    }
    const response = await api.get(
      `/messages/conversations/${conversationId}/messages?${params.toString()}`,
    );
    return response.data;
  },

  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    const response = await api.post(
      `/messages/conversations/${conversationId}/messages`,
      dto,
    );
    return response.data;
  },

  async addMembers(
    conversationId: string,
    dto: AddMembersDto,
  ): Promise<Conversation> {
    const response = await api.post(
      `/messages/conversations/${conversationId}/members`,
      dto,
    );
    return response.data;
  },

  async removeMember(
    conversationId: string,
    memberId: string,
  ): Promise<void> {
    await api.delete(
      `/messages/conversations/${conversationId}/members/${memberId}`,
    );
  },

  async markAsRead(conversationId: string): Promise<void> {
    await api.post(`/messages/conversations/${conversationId}/read`);
  },

  async getEventConversation(eventId: string): Promise<Conversation> {
    const response = await api.get(`/messages/events/${eventId}/conversation`);
    return response.data;
  },
};

export default messageService;
