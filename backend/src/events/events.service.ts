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
  constructor(private prisma: PrismaService) {}

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

      return event;
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      where: {
        eventDate: {
          gte: new Date(),
        },
      },
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
    });
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

    return event;
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
                currentStock: category.initial_stock,
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

      return updatedEvent;
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
