import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto';

@Injectable()
export class EventsService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async create(userId: string, createEventDto: CreateEventDto) {
    const eventDate = new Date(createEventDto.event_date);
    if (eventDate <= new Date()) {
      throw new BadRequestException(
        "La date de l'événement doit être dans le futur",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title: createEventDto.title,
          description: createEventDto.description,
          location: createEventDto.location,
          imageUrl: createEventDto.image_url,
          eventDate: eventDate,
          organizerId: userId,
          type: createEventDto.type || 'PROFESSIONAL',
          ticketCategories: {
            create: createEventDto.ticket_categories.map((category) => ({
              name: category.name,
              description: category.description,
              price: category.price,
              initialStock: category.initial_stock,
              currentStock: category.initial_stock,
            })),
          },
        },
        include: {
          ticketCategories: true,
          organizer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        ...event,
        ticketCategories: event.ticketCategories.map((c) => ({
          ...c,
          price: Number(c.price),
        })),
      };
    });
  }

  async findAll(filters?: {
    search?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const now = new Date();
    const andConditions: Array<Record<string, unknown>> = [
      { eventDate: { gte: now } },
    ];

    if (filters?.search?.trim()) {
      const term = filters.search.trim();
      andConditions.push({
        OR: [
          { title: { contains: term, mode: 'insensitive' as const } },
          { description: { contains: term, mode: 'insensitive' as const } },
        ],
      });
    }

    if (filters?.location?.trim()) {
      andConditions.push({
        location: {
          contains: filters.location.trim(),
          mode: 'insensitive' as const,
        },
      });
    }

    if (filters?.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      if (!isNaN(dateFrom.getTime())) {
        andConditions.push({ eventDate: { gte: dateFrom } });
      }
    }

    if (filters?.dateTo) {
      const dateTo = new Date(filters.dateTo);
      if (!isNaN(dateTo.getTime())) {
        andConditions.push({ eventDate: { lte: dateTo } });
      }
    }

    return this.prisma.event
      .findMany({
        where: { AND: andConditions },
        include: {
          ticketCategories: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              currentStock: true,
            },
          },
          organizer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          eventDate: 'asc',
        },
      })
      .then((events) =>
        events.map((e) => ({
          ...e,
          ticketCategories: e.ticketCategories.map((c) => ({
            ...c,
            price: Number(c.price),
          })),
        })),
      );
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        ticketCategories: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            initialStock: true,
            currentStock: true,
          },
        },
        organizer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Événement avec l'ID ${id} introuvable`);
    }

    return {
      ...event,
      ticketCategories: event.ticketCategories.map((c) => ({
        ...c,
        price: Number(c.price),
      })),
    };
  }

  async update(id: string, userId: string, updateEventDto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Événement avec l'ID ${id} introuvable`);
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres événements',
      );
    }

    if (updateEventDto.event_date) {
      const eventDate = new Date(updateEventDto.event_date);
      if (eventDate <= new Date()) {
        throw new BadRequestException(
          "La date de l'événement doit être dans le futur",
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (updateEventDto.ticket_categories) {
        await tx.ticketCategory.deleteMany({
          where: { eventId: id },
        });
      }

      const updatedEvent = await tx.event.update({
        where: { id },
        data: {
          ...(updateEventDto.title && { title: updateEventDto.title }),
          ...(updateEventDto.description !== undefined && {
            description: updateEventDto.description,
          }),
          ...(updateEventDto.location && { location: updateEventDto.location }),
          ...(updateEventDto.image_url !== undefined && {
            imageUrl: updateEventDto.image_url,
          }),
          ...(updateEventDto.event_date && {
            eventDate: new Date(updateEventDto.event_date),
          }),
          ...(updateEventDto.ticket_categories && {
            ticketCategories: {
              create: updateEventDto.ticket_categories.map((category) => ({
                name: category.name,
                description: category.description,
                price: category.price,
                initialStock: category.initial_stock,
                currentStock:
                  category.current_stock ?? category.initial_stock,
              })),
            },
          }),
        },
        include: {
          ticketCategories: true,
          organizer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        ...updatedEvent,
        ticketCategories: updatedEvent.ticketCategories.map((c) => ({
          ...c,
          price: Number(c.price),
        })),
      };
    });
  }

  async remove(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Événement avec l'ID ${id} introuvable`);
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres événements',
      );
    }

    await this.prisma.event.delete({
      where: { id },
    });

    return { message: 'Événement supprimé avec succès' };
  }
}
