export interface User {
  id: string;
  firstName: string;
  lastName: string;
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

export type ConversationType = typeof ConversationType[keyof typeof ConversationType];

export interface Conversation {
  id: string;
  type: ConversationType;
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
