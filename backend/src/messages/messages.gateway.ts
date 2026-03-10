import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://localhost:5174',
    ],
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted connection without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      if (!userId) {
        this.logger.warn(`Invalid token payload for client ${client.id}`);
        client.disconnect();
        return;
      }

      client.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      const conversations = await this.prisma.conversation.findMany({
        where: {
          members: {
            some: {
              userId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      conversations.forEach((conv) => {
        client.join(`conversation:${conv.id}`);
      });

      this.logger.log(`Client ${client.id} connected as user ${userId}`);
      this.logger.log(`User ${userId} joined ${conversations.length} conversation rooms`);
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      this.logger.log(`Client ${client.id} (user ${client.userId}) disconnected`);
    } else {
      this.logger.log(`Client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      const conversation = await this.messagesService.getConversation(
        data.conversationId,
        client.userId,
      );

      if (!conversation) {
        return { error: 'Conversation not found or access denied' };
      }

      client.join(`conversation:${data.conversationId}`);
      this.logger.log(`User ${client.userId} joined conversation ${data.conversationId}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error joining conversation:`, error.message);
      return { error: error.message };
    }
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.log(`User ${client.userId} left conversation ${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      const dto: SendMessageDto = { content: data.content };
      const message = await this.messagesService.sendMessage(
        data.conversationId,
        client.userId,
        dto,
      );

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('newMessage', {
          conversationId: data.conversationId,
          message,
        });

      this.logger.log(`Message sent in conversation ${data.conversationId} by user ${client.userId}`);
      
      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message:`, error.message);
      return { error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      conversationId: data.conversationId,
      userId: client.userId,
      isTyping: data.isTyping,
    });

    return { success: true };
  }

  async notifyNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('newMessage', {
      conversationId,
      message,
    });
  }

  async notifyConversationUpdate(conversationId: string, conversation: any) {
    this.server.to(`conversation:${conversationId}`).emit('conversationUpdated', {
      conversationId,
      conversation,
    });
  }

  async notifyMemberAdded(conversationId: string, userId: string) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.join(`conversation:${conversationId}`);
        }
      });
    }

    this.server.to(`conversation:${conversationId}`).emit('memberAdded', {
      conversationId,
      userId,
    });
  }

  async notifyMemberRemoved(conversationId: string, userId: string) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.leave(`conversation:${conversationId}`);
        }
      });
    }

    this.server.to(`conversation:${conversationId}`).emit('memberRemoved', {
      conversationId,
      userId,
    });
  }
}
