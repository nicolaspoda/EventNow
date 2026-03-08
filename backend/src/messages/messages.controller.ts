import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import {
  CreateConversationDto,
  SendMessageDto,
  AddMembersDto,
  UpdateConversationDto,
} from './dto';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Créer une nouvelle conversation' })
  async createConversation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.messagesService.createConversation(userId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Obtenir toutes les conversations de l\'utilisateur' })
  async getUserConversations(@CurrentUser('id') userId: string) {
    try {
      return await this.messagesService.getUserConversations(userId);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const message = (err as { message?: string })?.message ?? '';
      if (code === 'P2021' || /does not exist|relation.*does not exist/i.test(message)) {
        console.warn(
          '[Messages] Tables messagerie absentes ? Exécutez: npx prisma migrate deploy',
          message,
        );
        return [];
      }
      throw err;
    }
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Obtenir une conversation spécifique' })
  async getConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.getConversation(conversationId, userId);
  }

  @Put('conversations/:id')
  @ApiOperation({ summary: 'Modifier une conversation' })
  async updateConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.messagesService.updateConversation(conversationId, userId, dto);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Supprimer une conversation' })
  async deleteConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.deleteConversation(conversationId, userId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Obtenir les messages d\'une conversation' })
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messagesService.getMessages(
      conversationId,
      userId,
      limit ? parseInt(limit, 10) : 50,
      before,
    );
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  async sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(conversationId, userId, dto);
  }

  @Post('conversations/:id/members')
  @ApiOperation({ summary: 'Ajouter des membres à une conversation' })
  async addMembers(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.messagesService.addMembers(conversationId, userId, dto);
  }

  @Delete('conversations/:id/members/:memberId')
  @ApiOperation({ summary: 'Retirer un membre d\'une conversation' })
  async removeMember(
    @Param('id') conversationId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.removeMember(conversationId, userId, memberId);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Marquer une conversation comme lue' })
  async markAsRead(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.markAsRead(conversationId, userId);
  }

  @Get('events/:eventId/conversation')
  @ApiOperation({ summary: 'Obtenir ou créer la conversation d\'un événement' })
  async getEventConversation(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.getEventConversation(eventId, userId);
  }
}
