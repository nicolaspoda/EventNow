import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateEventDto, UpdateEventDto } from './dto';
import { EventType } from './dto/create-event.dto';
import {
  SearchEventsDto,
  SortBy,
  PriceRange,
} from './dto/search-events.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(userId: string, createEventDto: CreateEventDto) {
    const eventDate = new Date(createEventDto.event_date);
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && eventDate <= new Date()) {
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
          imagePublicId: createEventDto.image_public_id,
          eventDate: eventDate,
          organizerId: userId,
          type:
            createEventDto.type === 'COMMUNITY'
              ? 'COMMUNITY'
              : 'PROFESSIONAL',
          category: createEventDto.category || 'OTHER',
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

      const ev = event as typeof event & {
        ticketCategories: Array<{
          price: unknown;
          [key: string]: unknown;
        }>;
      };
      return {
        ...ev,
        ticketCategories: ev.ticketCategories.map((c) => ({
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

    const events = await this.prisma.event.findMany({
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
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        eventDate: 'asc',
      },
    });

    return events.map((e) => {
      const averageRating =
        e.reviews.length > 0
          ? Math.round(
              (e.reviews.reduce((sum, r) => sum + r.rating, 0) /
                e.reviews.length) *
                10,
            ) / 10
          : null;

      return {
        ...e,
        averageRating,
        totalReviews: e.reviews.length,
        reviews: undefined,
        ticketCategories: e.ticketCategories.map((c) => ({
          ...c,
          price: Number(c.price),
        })),
      };
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        ticketCategories: {
          orderBy: { createdAt: 'asc' },
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
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Événement avec l'ID ${id} introuvable`);
    }

    const averageRating =
      event.reviews.length > 0
        ? Math.round(
            (event.reviews.reduce((sum, r) => sum + r.rating, 0) /
              event.reviews.length) *
              10,
          ) / 10
        : null;

    const eventDate =
      event.eventDate instanceof Date
        ? event.eventDate.toISOString()
        : typeof event.eventDate === 'string'
          ? event.eventDate
          : null;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      imageUrl: event.imageUrl,
      imagePublicId: event.imagePublicId,
      eventDate: eventDate ?? undefined,
      organizerId: event.organizerId,
      type: event.type,
      category: event.category,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
      updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
      organizer: event.organizer,
      averageRating,
      totalReviews: event.reviews.length,
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
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction && eventDate <= new Date()) {
        throw new BadRequestException(
          "La date de l'événement doit être dans le futur",
        );
      }
    }

    if (
      updateEventDto.image_url !== undefined &&
      event.imagePublicId &&
      updateEventDto.image_url !== event.imageUrl
    ) {
      try {
        await this.uploadService.deleteImage(event.imagePublicId);
      } catch (err) {
        console.error('Erreur suppression ancienne image:', err);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      let soldByCategoryIndex: number[] = [];

      if (updateEventDto.ticket_categories) {
        const existingCategories = await tx.ticketCategory.findMany({
          where: { eventId: id },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });

        const categoryIds = existingCategories.map((c) => c.id);
        const soldCounts =
          categoryIds.length > 0
            ? await tx.ticket.groupBy({
                by: ['ticketCategoryId'],
                where: {
                  ticketCategoryId: { in: categoryIds },
                  order: { status: OrderStatus.PAID },
                },
                _count: { id: true },
              })
            : [];

        const soldMap = new Map(
          soldCounts.map((s) => [s.ticketCategoryId, s._count.id]),
        );
        soldByCategoryIndex = categoryIds.map((id) => soldMap.get(id) ?? 0);

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
          ...(updateEventDto.image_public_id !== undefined && {
            imagePublicId: updateEventDto.image_public_id,
          }),
          ...(updateEventDto.event_date && {
            eventDate: new Date(updateEventDto.event_date),
          }),
          ...(updateEventDto.category && { category: updateEventDto.category }),
          ...(updateEventDto.ticket_categories && {
            ticketCategories: {
              create: updateEventDto.ticket_categories.map((category, index) => {
                const initial = category.initial_stock;
                const soldCount = soldByCategoryIndex[index] ?? 0;
                const currentStock = Math.max(0, initial - soldCount);
                return {
                  name: category.name,
                  description: category.description,
                  price: category.price,
                  initialStock: initial,
                  currentStock,
                };
              }),
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

  async searchEvents(searchDto: SearchEventsDto, userId?: string) {
    const {
      query,
      type,
      categories,
      location,
      dateFrom,
      dateTo,
      priceRanges,
      availableOnly,
      myEvents,
      sortBy = SortBy.DATE_ASC,
      page = 1,
      limit = 20,
    } = searchDto;

    const where: any = {
      AND: [],
    };

    if (query) {
      where.AND.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    if (type && type !== EventType.ALL) {
      where.AND.push({ type });
    }

    if (categories && categories.length > 0) {
      where.AND.push({
        category: { in: categories },
      });
    }

    if (location) {
      where.AND.push({
        location: { contains: location, mode: 'insensitive' },
      });
    }

    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.AND.push({ eventDate: dateFilter });
    }

    if (priceRanges && priceRanges.length > 0) {
      const priceConditions = this.buildPriceConditions(priceRanges);
      where.AND.push({
        ticketCategories: {
          some: { OR: priceConditions },
        },
      });
    }

    if (availableOnly) {
      where.AND.push({
        ticketCategories: {
          some: { currentStock: { gt: 0 } },
        },
      });
    }

    if (myEvents && userId) {
      where.AND.push({ organizerId: userId });
    }

    if (myEvents && !userId) {
      return {
        events: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const orderBy = this.buildOrderBy(sortBy);
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          ticketCategories: {
            select: {
              name: true,
              price: true,
              currentStock: true,
              initialStock: true,
            },
          },
          organizer: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    const enrichedEvents = events.map((event) => {
      const ev = event as typeof event & {
        ticketCategories: Array<{
          name: string;
          price: unknown;
          currentStock: number;
          initialStock: number;
        }>;
        reviews: Array<{ rating: number }>;
      };

      const averageRating =
        ev.reviews.length > 0
          ? Math.round(
              (ev.reviews.reduce((sum, r) => sum + r.rating, 0) /
                ev.reviews.length) *
                10,
            ) / 10
          : null;

      const eventDate =
        ev.eventDate instanceof Date
          ? ev.eventDate.toISOString()
          : typeof ev.eventDate === 'string'
            ? ev.eventDate
            : null;

      return {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        location: ev.location,
        imageUrl: ev.imageUrl,
        imagePublicId: ev.imagePublicId,
        eventDate: eventDate ?? undefined,
        organizerId: ev.organizerId,
        type: ev.type,
        category: ev.category,
        createdAt: ev.createdAt instanceof Date ? ev.createdAt.toISOString() : ev.createdAt,
        updatedAt: ev.updatedAt instanceof Date ? ev.updatedAt.toISOString() : ev.updatedAt,
        organizer: ev.organizer,
        averageRating,
        totalReviews: ev.reviews.length,
        ticketCategories: ev.ticketCategories.map((c) => ({
          ...c,
          price: Number(c.price),
        })),
        stats: this.calculateEventStats(ev),
      };
    });

    return {
      events: enrichedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildPriceConditions(priceRanges: PriceRange[]) {
    const conditions: any[] = [];

    priceRanges.forEach((range) => {
      switch (range) {
        case PriceRange.FREE:
          conditions.push({ price: { equals: 0 } });
          break;
        case PriceRange.LOW:
          conditions.push({ price: { gte: 0, lte: 20 } });
          break;
        case PriceRange.MEDIUM:
          conditions.push({ price: { gte: 20, lte: 50 } });
          break;
        case PriceRange.HIGH:
          conditions.push({ price: { gte: 50, lte: 100 } });
          break;
        case PriceRange.PREMIUM:
          conditions.push({ price: { gte: 100 } });
          break;
      }
    });

    return conditions;
  }

  private buildOrderBy(sortBy: SortBy): { eventDate?: 'asc' | 'desc'; createdAt?: 'asc' | 'desc' } {
    switch (sortBy) {
      case SortBy.DATE_ASC:
        return { eventDate: 'asc' };
      case SortBy.DATE_DESC:
        return { eventDate: 'desc' };
      case SortBy.PRICE_ASC:
      case SortBy.PRICE_DESC:
        return { createdAt: 'desc' };
      case SortBy.POPULARITY:
        return { createdAt: 'desc' };
      default:
        return { eventDate: 'asc' };
    }
  }

  private calculateEventStats(event: any) {
    let totalCapacity = 0;
    let totalSold = 0;
    let minPrice = Infinity;
    let maxPrice = 0;

    event.ticketCategories.forEach((cat: any) => {
      totalCapacity += cat.initialStock;
      totalSold += cat.initialStock - cat.currentStock;
      const price = Number(cat.price);
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    });

    return {
      totalCapacity,
      totalSold,
      availableTickets: totalCapacity - totalSold,
      fillRate: totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0,
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice,
      },
    };
  }

  async getSearchSuggestions(query: string) {
    if (!query || query.length < 2) {
      return [];
    }

    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        location: true,
      },
      take: 5,
    });

    return events.map((event) => ({
      id: event.id,
      label: event.title,
      sublabel: event.location,
    }));
  }

  async getAvailableLocations() {
    const locations = await this.prisma.event.groupBy({
      by: ['location'],
      _count: {
        location: true,
      },
      orderBy: {
        _count: {
          location: 'desc',
        },
      },
    });

    return locations.map((loc) => ({
      name: loc.location,
      count: loc._count.location,
    }));
  }
}
