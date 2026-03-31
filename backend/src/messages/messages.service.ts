import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateConversationDto,
  SendMessageDto,
  AddMembersDto,
  UpdateConversationDto,
  ConversationType,
} from './dto';
import { ConversationType as PrismaConversationType } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    if (dto.type === ConversationType.DIRECT && dto.memberIds.length !== 1) {
      throw new BadRequestException(
        'Une conversation directe doit avoir exactement 1 autre membre',
      );
    }

    if (dto.type === ConversationType.GROUP && !dto.name) {
      throw new BadRequestException(
        'Un nom est requis pour les conversations de groupe',
      );
    }

    if (dto.type === ConversationType.EVENT && !dto.eventId) {
      throw new BadRequestException(
        "Un eventId est requis pour les conversations d'événement",
      );
    }

    if (dto.type === ConversationType.EVENT && dto.eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: dto.eventId },
      });
      if (!event) {
        throw new NotFoundException('Événement non trouvé');
      }
    }

    if (dto.type === ConversationType.DIRECT) {
      const existingConversation = await this.findDirectConversation(
        userId,
        dto.memberIds[0],
      );
      if (existingConversation) {
        return existingConversation;
      }
    }

    const allMemberIds = [...new Set([userId, ...dto.memberIds])];

    const conversation = await this.prisma.conversation.create({
      data: {
        type: dto.type,
        name: dto.name,
        imageUrl: dto.imageUrl,
        eventId: dto.eventId,
        createdBy: userId,
        members: {
          create: allMemberIds.map((memberId) => ({
            userId: memberId,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return conversation;
  }

  async findDirectConversation(userId1: string, userId2: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        type: ConversationType.DIRECT,
        members: {
          every: {
            userId: {
              in: [userId1, userId2],
            },
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return conversations.find(
      (conv) =>
        conv.members.length === 2 &&
        conv.members.some((m) => m.userId === userId1) &&
        conv.members.some((m) => m.userId === userId2),
    );
  }

  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return conversations.map((conv) => {
      const currentUserMember = conv.members.find((m) => m.userId === userId);
      const unreadCount =
        conv.messages.length > 0 && currentUserMember
          ? conv.messages.filter(
              (msg) =>
                msg.createdAt > currentUserMember.lastReadAt &&
                msg.senderId !== userId,
            ).length
          : 0;

      return {
        ...conv,
        unreadCount,
      };
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    const isMember = conversation.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException(
        "Vous n'êtes pas membre de cette conversation",
      );
    }

    return conversation;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    before?: string,
  ) {
    await this.getConversation(conversationId, userId);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(before && {
          createdAt: {
            lt: new Date(before),
          },
        }),
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return messages.reverse().map((msg) => this.serializeMessage(msg));
  }

  private serializeMessage(msg: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    sender: unknown;
  }) {
    const serialized = {
      ...msg,
      createdAt:
        msg.createdAt instanceof Date
          ? msg.createdAt.toISOString()
          : msg.createdAt,
      updatedAt:
        msg.updatedAt instanceof Date
          ? msg.updatedAt.toISOString()
          : msg.updatedAt,
    };
    return serialized;
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    const conversation = await this.getConversation(conversationId, userId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: dto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const otherMembers = conversation.members.filter(
      (m) => m.userId !== userId,
    );
    for (const member of otherMembers) {
      const conversationName =
        conversation.type === PrismaConversationType.DIRECT
          ? message.sender.username || "Quelqu'un"
          : conversation.name || 'Conversation';

      await this.notificationsService.createNotification({
        userId: member.userId,
        type: 'NEW_MESSAGE',
        title: `Nouveau message de ${conversationName}`,
        body: dto.content.substring(0, 100),
        relatedId: conversationId,
      });
    }

    return this.serializeMessage(message);
  }

  async addMembers(conversationId: string, userId: string, dto: AddMembersDto) {
    const conversation = await this.getConversation(conversationId, userId);

    if (conversation.type === PrismaConversationType.DIRECT) {
      throw new BadRequestException(
        "Impossible d'ajouter des membres à une conversation directe",
      );
    }

    const existingMemberIds = conversation.members.map((m) => m.userId);
    const newMemberIds = dto.memberIds.filter(
      (id) => !existingMemberIds.includes(id),
    );

    if (newMemberIds.length === 0) {
      throw new BadRequestException(
        'Tous les membres sont déjà dans la conversation',
      );
    }

    await this.prisma.conversationMember.createMany({
      data: newMemberIds.map((memberId) => ({
        conversationId,
        userId: memberId,
      })),
    });

    for (const memberId of newMemberIds) {
      await this.notificationsService.createNotification({
        userId: memberId,
        type: 'ADDED_TO_CONVERSATION',
        title: 'Ajouté à une conversation',
        body: `Vous avez été ajouté à ${conversation.name || 'une conversation'}`,
        relatedId: conversationId,
      });
    }

    return this.getConversation(conversationId, userId);
  }

  async removeMember(
    conversationId: string,
    userId: string,
    memberIdToRemove: string,
  ) {
    const conversation = await this.getConversation(conversationId, userId);

    if (conversation.type === PrismaConversationType.DIRECT) {
      throw new BadRequestException(
        "Impossible de retirer des membres d'une conversation directe",
      );
    }

    if (userId !== conversation.createdBy && userId !== memberIdToRemove) {
      throw new ForbiddenException(
        "Seul le créateur peut retirer d'autres membres",
      );
    }

    await this.prisma.conversationMember.deleteMany({
      where: {
        conversationId,
        userId: memberIdToRemove,
      },
    });

    const remainingMembers = await this.prisma.conversationMember.count({
      where: { conversationId },
    });

    if (remainingMembers === 0) {
      await this.prisma.conversation.delete({
        where: { id: conversationId },
      });
    }

    return { success: true };
  }

  async updateConversation(
    conversationId: string,
    userId: string,
    dto: UpdateConversationDto,
  ) {
    const conversation = await this.getConversation(conversationId, userId);

    if (conversation.type === PrismaConversationType.DIRECT) {
      throw new BadRequestException(
        'Impossible de modifier une conversation directe',
      );
    }

    if (userId !== conversation.createdBy) {
      throw new ForbiddenException(
        'Seul le créateur peut modifier la conversation',
      );
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        name: dto.name,
        imageUrl: dto.imageUrl,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.getConversation(conversationId, userId);

    await this.prisma.conversationMember.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return { success: true };
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.getConversation(conversationId, userId);

    if (conversation.type !== PrismaConversationType.GROUP) {
      throw new BadRequestException(
        'Seules les conversations de groupe peuvent être supprimées',
      );
    }

    if (userId !== conversation.createdBy) {
      throw new ForbiddenException(
        'Seul le créateur peut supprimer la conversation',
      );
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  async getEventConversation(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participationRequests: {
          where: {
            userId,
            status: 'ACCEPTED',
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Événement non trouvé');
    }

    const isOrganizer = event.organizerId === userId;
    const isAcceptedParticipant = event.participationRequests.length > 0;

    if (!isOrganizer && !isAcceptedParticipant) {
      throw new ForbiddenException(
        'Vous devez être organisateur ou participant accepté pour accéder à cette conversation',
      );
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.EVENT,
        eventId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!conversation && isOrganizer) {
      const acceptedParticipants =
        await this.prisma.participationRequest.findMany({
          where: {
            eventId,
            status: 'ACCEPTED',
          },
          select: {
            userId: true,
          },
        });

      const memberIds = [
        event.organizerId,
        ...acceptedParticipants.map((p) => p.userId),
      ];

      conversation = await this.prisma.conversation.create({
        data: {
          type: ConversationType.EVENT,
          name: `Groupe ${event.title}`,
          eventId,
          createdBy: event.organizerId,
          members: {
            create: memberIds.map((memberId) => ({
              userId: memberId,
            })),
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    }

    if (!conversation) {
      throw new NotFoundException(
        "Conversation d'événement non trouvée. L'organisateur doit la créer.",
      );
    }

    const isMember = conversation.members.some((m) => m.userId === userId);
    if (!isMember) {
      await this.prisma.conversationMember.create({
        data: {
          conversationId: conversation.id,
          userId,
        },
      });

      return this.getConversation(conversation.id, userId);
    }

    return conversation;
  }
}
