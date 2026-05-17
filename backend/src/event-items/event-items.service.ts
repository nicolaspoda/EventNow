import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  EventType,
  ItemStatus,
  ParticipationRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

const ITEM_INCLUDE = {
  items: {
    include: {
      claimedBy: { select: { id: true, username: true, avatarUrl: true } },
      addedBy: { select: { id: true, username: true } },
    },
  },
} as const;

@Injectable()
export class EventItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkAccess(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, type: true },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.type !== EventType.COMMUNITY) {
      throw new BadRequestException(
        'Cette fonctionnalité est réservée aux événements communautaires',
      );
    }

    if (event.organizerId !== userId) {
      const request = await this.prisma.participationRequest.findUnique({
        where: { eventId_userId: { eventId, userId } },
        select: { status: true },
      });
      if (request?.status !== ParticipationRequestStatus.ACCEPTED) {
        throw new ForbiddenException(
          'Vous devez être participant accepté pour accéder à cette liste',
        );
      }
    }

    return event;
  }

  private async getOrCreateList(eventId: string) {
    const existing = await this.prisma.eventItemList.findUnique({
      where: { eventId },
      include: ITEM_INCLUDE,
    });

    if (existing) return existing;

    return this.prisma.eventItemList.create({
      data: { eventId },
      include: ITEM_INCLUDE,
    });
  }

  private formatList(
    list: Awaited<ReturnType<typeof this.getOrCreateList>>,
    userId: string,
  ) {
    const sorted = [...list.items].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === ItemStatus.UNCLAIMED ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      ...list,
      items: sorted.map((item) => ({
        ...item,
        isClaimedByMe: item.claimedById === userId,
      })),
    };
  }

  async getList(userId: string, eventId: string) {
    await this.checkAccess(userId, eventId);
    const list = await this.getOrCreateList(eventId);
    return this.formatList(list, userId);
  }

  async addItem(userId: string, eventId: string, dto: CreateItemDto) {
    await this.checkAccess(userId, eventId);
    const list = await this.getOrCreateList(eventId);

    await this.prisma.eventItem.create({
      data: {
        listId: list.id,
        name: dto.name,
        quantity: dto.quantity ?? 1,
        unit: dto.unit,
        note: dto.note,
        addedById: userId,
      },
    });

    const updated = await this.getOrCreateList(eventId);
    return this.formatList(updated, userId);
  }

  async updateItem(
    userId: string,
    eventId: string,
    itemId: string,
    dto: UpdateItemDto,
  ) {
    const event = await this.checkAccess(userId, eventId);

    const item = await this.prisma.eventItem.findUnique({
      where: { id: itemId },
      include: { list: { select: { eventId: true } } },
    });

    if (!item || item.list.eventId !== eventId) {
      throw new NotFoundException('Article introuvable');
    }

    if (event.organizerId !== userId && item.addedById !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que les articles que vous avez ajoutés',
      );
    }

    if (
      item.status === ItemStatus.CLAIMED &&
      item.claimedById !== userId &&
      event.organizerId !== userId
    ) {
      throw new ForbiddenException(
        "Vous ne pouvez pas modifier un article pris en charge par quelqu'un d'autre",
      );
    }

    await this.prisma.eventItem.update({
      where: { id: itemId },
      data: dto,
    });

    const updated = await this.getOrCreateList(eventId);
    return this.formatList(updated, userId);
  }

  async deleteItem(userId: string, eventId: string, itemId: string) {
    const event = await this.checkAccess(userId, eventId);

    const item = await this.prisma.eventItem.findUnique({
      where: { id: itemId },
      include: { list: { select: { eventId: true } } },
    });

    if (!item || item.list.eventId !== eventId) {
      throw new NotFoundException('Article introuvable');
    }

    if (event.organizerId !== userId && item.addedById !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que les articles que vous avez ajoutés',
      );
    }

    await this.prisma.eventItem.delete({ where: { id: itemId } });

    const updated = await this.getOrCreateList(eventId);
    return this.formatList(updated, userId);
  }

  async claimItem(userId: string, eventId: string, itemId: string) {
    await this.checkAccess(userId, eventId);

    const item = await this.prisma.eventItem.findUnique({
      where: { id: itemId },
      include: { list: { select: { eventId: true } } },
    });

    if (!item || item.list.eventId !== eventId) {
      throw new NotFoundException('Article introuvable');
    }

    if (item.status === ItemStatus.CLAIMED && item.claimedById !== userId) {
      throw new ConflictException('Item already claimed by someone else');
    }

    const unclaiming =
      item.status === ItemStatus.CLAIMED && item.claimedById === userId;

    await this.prisma.eventItem.update({
      where: { id: itemId },
      data: unclaiming
        ? { status: ItemStatus.UNCLAIMED, claimedById: null }
        : { status: ItemStatus.CLAIMED, claimedById: userId },
    });

    const updated = await this.getOrCreateList(eventId);
    return this.formatList(updated, userId);
  }
}
