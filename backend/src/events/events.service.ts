import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  OrderStatus,
  BookingStatus,
  ParticipationRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { FollowsService } from '../follows/follows.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentService } from '../payment/payment.service';
import { MailService } from '../mail/mail.service';
import { CreateEventDto, UpdateEventDto } from './dto';
import { EventType } from './dto/create-event.dto';
import { SearchEventsDto, SortBy, PriceRange } from './dto/search-events.dto';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly followsService: FollowsService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentService: PaymentService,
    private readonly mailService: MailService,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(
    userId: string,
    createEventDto: CreateEventDto,
    userRole?: string,
  ) {
    const requestedType =
      createEventDto.type === EventType.COMMUNITY
        ? EventType.COMMUNITY
        : EventType.PROFESSIONAL;
    if (userRole === 'CLIENT' && requestedType === EventType.PROFESSIONAL) {
      throw new ForbiddenException(
        'Seuls les organisateurs peuvent créer des événements professionnels.',
      );
    }

    const eventDate = new Date(createEventDto.event_date);
    const endDate = createEventDto.end_date
      ? new Date(createEventDto.end_date)
      : null;
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && eventDate <= new Date()) {
      throw new BadRequestException(
        "La date de l'événement doit être dans le futur",
      );
    }

    if (requestedType === EventType.PROFESSIONAL) {
      if (!endDate) {
        throw new BadRequestException(
          "L'heure de fin est obligatoire pour les événements professionnels",
        );
      }
      if (endDate <= eventDate) {
        throw new BadRequestException(
          "L'heure de fin doit être postérieure à l'heure de début",
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title: createEventDto.title,
          description: createEventDto.description,
          location: createEventDto.location,
          address: createEventDto.address,
          city: createEventDto.city,
          postalCode: createEventDto.postal_code,
          country: createEventDto.country,
          latitude: createEventDto.latitude,
          longitude: createEventDto.longitude,
          imageUrl: createEventDto.image_url,
          imagePublicId: createEventDto.image_public_id,
          eventDate: eventDate,
          endDate: endDate,
          organizerId: userId,
          type:
            createEventDto.type === EventType.COMMUNITY
              ? EventType.COMMUNITY
              : requestedType,
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
              username: true,
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

    const organizerName =
      result.organizer?.username ||
      result.organizer?.email?.split('@')[0] ||
      'Un organisateur';
    const [followerIds, friendIds] = await Promise.all([
      this.followsService.getFollowerIds(userId),
      this.followsService.getFriendIds(userId),
    ]);
    const friendIdSet = new Set(friendIds);
    const followersNotFriends = followerIds.filter(
      (id) => !friendIdSet.has(id),
    );
    const friendsWithNotif = friendIds.filter((id) => followerIds.includes(id));
    if (followersNotFriends.length > 0) {
      await this.notificationsService.createForManyUsers(followersNotFriends, {
        type: 'NEW_EVENT_FROM_FOLLOWED',
        title: 'Nouvel événement',
        body: `${organizerName} a créé un événement : ${createEventDto.title}`,
        relatedId: result.id,
      });
    }
    if (friendsWithNotif.length > 0) {
      await this.notificationsService.createForManyUsers(friendsWithNotif, {
        type: 'NEW_EVENT_FROM_FRIEND',
        title: 'Un ami a créé un événement',
        body: `${organizerName} (ami) a créé un événement : ${createEventDto.title}`,
        relatedId: result.id,
      });
    }
    return result;
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
            username: true,
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
            username: true,
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

    const endDate =
      event.endDate instanceof Date
        ? event.endDate.toISOString()
        : typeof event.endDate === 'string'
          ? event.endDate
          : null;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      address: event.address,
      city: event.city,
      postalCode: event.postalCode,
      country: event.country,
      latitude: event.latitude,
      longitude: event.longitude,
      imageUrl: event.imageUrl,
      imagePublicId: event.imagePublicId,
      eventDate: eventDate ?? undefined,
      endDate: endDate ?? undefined,
      cancelledAt:
        event.cancelledAt instanceof Date
          ? event.cancelledAt.toISOString()
          : (event.cancelledAt ?? null),
      cancelReason: event.cancelReason ?? null,
      organizerId: event.organizerId,
      type: event.type,
      category: event.category,
      createdAt:
        event.createdAt instanceof Date
          ? event.createdAt.toISOString()
          : event.createdAt,
      updatedAt:
        event.updatedAt instanceof Date
          ? event.updatedAt.toISOString()
          : event.updatedAt,
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

    if (updateEventDto.event_date || updateEventDto.end_date) {
      const newStart = updateEventDto.event_date
        ? new Date(updateEventDto.event_date)
        : event.eventDate;
      const newEnd = updateEventDto.end_date
        ? new Date(updateEventDto.end_date)
        : (event.endDate ?? null);

      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction && newStart <= new Date()) {
        throw new BadRequestException(
          "La date de l'événement doit être dans le futur",
        );
      }

      if (event.type === 'PROFESSIONAL') {
        if (!newEnd) {
          throw new BadRequestException(
            "L'heure de fin est obligatoire pour les événements professionnels",
          );
        }
        if (newEnd <= newStart) {
          throw new BadRequestException(
            "L'heure de fin doit être postérieure à l'heure de début",
          );
        }
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
        this.logger.error(
          `Erreur suppression ancienne image: ${(err as Error).message}`,
          (err as Error).stack,
          'EventsService',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      let soldByCategoryIndex: number[] = [];

      const paidTicketsCount = await tx.ticket.count({
        where: {
          ticketCategory: { eventId: id },
          order: { status: OrderStatus.PAID },
        },
      });
      const hasPaidTickets = paidTicketsCount > 0;
      if (
        process.env.NODE_ENV !== 'production' &&
        updateEventDto.ticket_categories
      ) {
        this.logger.debug(
          `[events.update] ticket_categories envoyées, billets payants: ${paidTicketsCount} → on ne supprime pas les catégories: ${hasPaidTickets}`,
          'EventsService',
        );
      }

      if (updateEventDto.ticket_categories && !hasPaidTickets) {
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
                },
                _count: { id: true },
              })
            : [];

        const soldMap = new Map(
          soldCounts.map((s) => [s.ticketCategoryId, s._count.id]),
        );
        soldByCategoryIndex = categoryIds.map((id) => soldMap.get(id) ?? 0);
      }

      if (updateEventDto.ticket_categories && !hasPaidTickets) {
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
          ...(updateEventDto.address !== undefined && {
            address: updateEventDto.address,
          }),
          ...(updateEventDto.city !== undefined && {
            city: updateEventDto.city,
          }),
          ...(updateEventDto.postal_code !== undefined && {
            postalCode: updateEventDto.postal_code,
          }),
          ...(updateEventDto.country !== undefined && {
            country: updateEventDto.country,
          }),
          ...(updateEventDto.latitude !== undefined && {
            latitude: updateEventDto.latitude,
          }),
          ...(updateEventDto.longitude !== undefined && {
            longitude: updateEventDto.longitude,
          }),
          ...(updateEventDto.image_url !== undefined && {
            imageUrl: updateEventDto.image_url,
          }),
          ...(updateEventDto.image_public_id !== undefined && {
            imagePublicId: updateEventDto.image_public_id,
          }),
          ...(updateEventDto.event_date && {
            eventDate: new Date(updateEventDto.event_date),
          }),
          ...(updateEventDto.end_date && {
            endDate: new Date(updateEventDto.end_date),
          }),
          ...(updateEventDto.category && { category: updateEventDto.category }),
          ...(updateEventDto.ticket_categories &&
            !hasPaidTickets && {
              ticketCategories: {
                create: updateEventDto.ticket_categories.map(
                  (category, index) => {
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
                  },
                ),
              },
            }),
        },
        include: {
          ticketCategories: true,
          organizer: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      const hasSignificantChanges =
        updateEventDto.event_date ||
        updateEventDto.location ||
        updateEventDto.title;

      if (hasSignificantChanges) {
        const participantUserIds = await tx.ticket.findMany({
          where: {
            ticketCategory: { eventId: id },
            order: { status: OrderStatus.PAID },
          },
          select: { order: { select: { userId: true } } },
          distinct: ['orderId'],
        });

        const uniqueUserIds = [
          ...new Set(participantUserIds.map((t) => t.order.userId)),
        ];

        if (uniqueUserIds.length > 0) {
          await this.notificationsService.createForManyUsers(uniqueUserIds, {
            type: 'EVENT_UPDATED',
            title: 'Événement modifié',
            body: `L'événement "${updatedEvent.title}" a été modifié`,
            relatedId: id,
          });
        }
      }

      return {
        ...updatedEvent,
        ticketCategories: updatedEvent.ticketCategories.map((c) => ({
          ...c,
          price: Number(c.price),
        })),
      };
    });
  }

  async cancelEvent(userId: string, eventId: string, reason?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Événement avec l'ID ${eventId} introuvable`);
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez annuler que vos propres événements',
      );
    }

    if (event.cancelledAt) {
      throw new BadRequestException('Event is already cancelled');
    }

    if (event.eventDate <= new Date()) {
      throw new BadRequestException(
        'Cannot cancel an event that has already started',
      );
    }

    // Get all PAID/REFUND_REQUESTED orders for this event
    const confirmedOrders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.REFUND_REQUESTED] },
        tickets: { some: { ticketCategory: { eventId } } },
      },
      include: {
        user: {
          select: { id: true, email: true, username: true },
        },
      },
    });

    // Process Stripe refunds outside the DB transaction
    const refundResults = await Promise.all(
      confirmedOrders.map(async (order) => {
        if (!order.paymentIntentId) {
          return {
            orderId: order.id,
            userId: order.userId,
            user: order.user,
            success: true,
            refundAmount: 0,
            isFree: true,
          };
        }
        try {
          const result = await this.paymentService.refundPayment(
            order.paymentIntentId,
            order.id,
          );
          return {
            orderId: order.id,
            userId: order.userId,
            user: order.user,
            success: true,
            refundAmount: result.amount,
            isFree: false,
          };
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Erreur inconnue';
          this.logger.error(
            `Échec remboursement commande ${order.id}: ${message}`,
            err instanceof Error ? err.stack : undefined,
            'EventsService',
          );
          return {
            orderId: order.id,
            userId: order.userId,
            user: order.user,
            success: false,
            refundAmount: 0,
            isFree: false,
            error: message,
          };
        }
      }),
    );

    const failedRefunds = refundResults.filter((r) => !r.success);
    const successfulRefunds = refundResults.filter((r) => r.success);

    // DB updates in a single transaction
    await this.prisma.$transaction(async (tx) => {
      // Update orders and invalidate tickets for successful refunds
      for (const result of successfulRefunds) {
        await tx.order.update({
          where: { id: result.orderId },
          data: { status: OrderStatus.REFUNDED },
        });
        await tx.ticket.updateMany({
          where: { orderId: result.orderId },
          data: { validatedAt: null },
        });
      }

      // Cancel PENDING bookings and restore stock
      const pendingBookings = await tx.booking.findMany({
        where: {
          status: BookingStatus.PENDING,
          ticketCategory: { eventId },
        },
        select: { id: true, ticketCategoryId: true, quantity: true },
      });

      for (const booking of pendingBookings) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.CANCELLED },
        });
        await tx.ticketCategory.update({
          where: { id: booking.ticketCategoryId },
          data: { currentStock: { increment: booking.quantity } },
        });
      }

      // Mark event as cancelled
      await tx.event.update({
        where: { id: eventId },
        data: {
          cancelledAt: new Date(),
          cancelReason: reason ?? null,
        },
      });
    });

    // Get accepted participation requests (for community events)
    const acceptedParticipants =
      await this.prisma.participationRequest.findMany({
        where: { eventId, status: ParticipationRequestStatus.ACCEPTED },
        include: {
          user: { select: { id: true, email: true, username: true } },
        },
      });

    // Build the full set of affected user IDs
    const orderUserIds = new Set(confirmedOrders.map((o) => o.userId));
    const allAffectedUserIds = new Set<string>(orderUserIds);
    acceptedParticipants.forEach((p) => allAffectedUserIds.add(p.user.id));

    // Create in-app notifications
    if (allAffectedUserIds.size > 0) {
      const reasonSuffix = reason ? ` Raison : ${reason}` : '';
      const notifBody =
        event.type === 'COMMUNITY'
          ? `L'événement "${event.title}" a été annulé.${reasonSuffix}`
          : `L'événement "${event.title}" a été annulé. Vous serez remboursé sous 5 à 10 jours ouvrés.${reasonSuffix}`;
      await this.notificationsService.createForManyUsers(
        Array.from(allAffectedUserIds),
        {
          type: 'EVENT_CANCELLED',
          title: 'Événement annulé',
          body: notifBody,
          relatedId: eventId,
        },
      );
    }

    // Send cancellation emails
    const eventDateFormatted = new Date(event.eventDate).toLocaleDateString(
      'fr-FR',
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    );

    const refundByUserId = new Map(
      refundResults.map((r) => [r.userId, r.refundAmount]),
    );

    // Collect all affected users (order owners + participation-only users)
    const participationOnlyUsers = acceptedParticipants
      .filter((p) => !orderUserIds.has(p.user.id))
      .map((p) => p.user);

    const emailTargets = [
      ...confirmedOrders.map((o) => o.user),
      ...participationOnlyUsers,
    ];

    await Promise.all(
      emailTargets.map(async (user) => {
        if (!user?.email) return;
        const refundAmount = refundByUserId.get(user.id);
        await this.mailService.sendEventCancellation({
          userEmail: user.email,
          userName: user.username ?? user.email.split('@')[0],
          eventTitle: event.title,
          eventDate: eventDateFormatted,
          refundAmount:
            refundAmount && refundAmount > 0 ? refundAmount : undefined,
          cancelReason: reason,
        });
      }),
    );

    // Clean up staff invitation notifications then delete the event (cascades all related data)
    const staffInvitations = await this.prisma.staffInvitation.findMany({
      where: { eventId },
      select: { token: true },
    });
    const tokens = staffInvitations.map((inv) => inv.token);
    if (tokens.length > 0) {
      await this.notificationsService.deleteByTypeAndRelatedIds(
        'STAFF_INVITATION',
        tokens,
      );
    }
    await this.prisma.event.delete({ where: { id: eventId } });

    return {
      cancelledOrders: successfulRefunds.length,
      failedRefunds: failedRefunds.length,
      totalRefunded: successfulRefunds.reduce(
        (sum, r) => sum + r.refundAmount,
        0,
      ),
      notifiedUsers: allAffectedUserIds.size,
      ...(failedRefunds.length > 0 && {
        failedOrderIds: failedRefunds.map((r) => r.orderId),
      }),
    };
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

    // Supprimer les notifications d'invitation staff pour cet événement
    const staffInvitations = await this.prisma.staffInvitation.findMany({
      where: { eventId: id },
      select: { token: true },
    });
    const tokens = staffInvitations.map((inv) => inv.token);
    if (tokens.length > 0) {
      await this.notificationsService.deleteByTypeAndRelatedIds(
        'STAFF_INVITATION',
        tokens,
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
      city,
      dateFrom,
      dateTo,
      priceRanges,
      availableOnly,
      myEvents,
      followedOnly,
      friendsOnly,
      sortBy = SortBy.DATE_ASC,
      page: pageParam = 1,
      limit: limitParam = 20,
      latitude: userLat,
      longitude: userLon,
      radiusKm,
    } = searchDto;

    const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Math.floor(Number(limitParam)) || 20),
    );

    const useDistancePath =
      userLat != null &&
      userLon != null &&
      !Number.isNaN(userLat) &&
      !Number.isNaN(userLon) &&
      (sortBy === SortBy.DISTANCE_ASC || (radiusKm != null && radiusKm > 0));

    const sortByDistance = useDistancePath;

    const where: any = {
      AND: [],
    };

    // Par défaut : uniquement les événements à venir dans le catalogue
    where.AND.push({ eventDate: { gte: new Date() } });

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

    if (city) {
      where.AND.push({
        city: { contains: city, mode: 'insensitive' },
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

    if (availableOnly === true) {
      where.AND.push({
        ticketCategories: {
          some: { currentStock: { gt: 0 } },
        },
      });
    }

    if (myEvents === true && userId) {
      where.AND.push({ organizerId: userId });
    }

    if (myEvents === true && !userId) {
      return {
        events: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    if (followedOnly === true && userId) {
      const followingIds = await this.followsService.getFollowingIds(userId);
      if (followingIds.length === 0) {
        return {
          events: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
      where.AND.push({ organizerId: { in: followingIds } });
    }

    if (followedOnly === true && !userId) {
      return {
        events: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    if (friendsOnly === true && userId) {
      const friendIds = await this.followsService.getFriendIds(userId);
      if (friendIds.length === 0) {
        return {
          events: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
      where.AND.push({ organizerId: { in: friendIds } });
    }

    if (friendsOnly === true && !userId) {
      return {
        events: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    if (sortByDistance) {
      where.AND.push({ latitude: { not: null } });
      where.AND.push({ longitude: { not: null } });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const orderBy = sortByDistance
      ? { eventDate: 'asc' as const }
      : this.buildOrderBy(sortBy);
    const skip = (page - 1) * limit;

    if (sortByDistance) {
      const maxFetch = 500;
      const eventsRaw = await this.prisma.event.findMany({
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
              id: true,
              email: true,
              username: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: { eventDate: 'asc' },
        take: maxFetch,
      });

      let withDistance = eventsRaw
        .filter(
          (e) =>
            e.latitude != null &&
            e.longitude != null &&
            !Number.isNaN(e.latitude) &&
            !Number.isNaN(e.longitude),
        )
        .map((event) => {
          const dist = this.haversineDistance(
            userLat,
            userLon,
            event.latitude!,
            event.longitude!,
          );
          return { event, distance: dist };
        })
        .sort((a, b) => a.distance - b.distance);

      if (radiusKm != null && radiusKm > 0) {
        withDistance = withDistance.filter(
          ({ distance }) => distance <= radiusKm,
        );
      }

      const total = withDistance.length;
      const paginated = withDistance.slice(skip, skip + limit);

      const enrichedEvents = paginated.map(({ event, distance }) => {
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
          address: ev.address,
          city: ev.city,
          postalCode: ev.postalCode,
          country: ev.country,
          latitude: ev.latitude,
          longitude: ev.longitude,
          imageUrl: ev.imageUrl,
          imagePublicId: ev.imagePublicId,
          eventDate: eventDate ?? undefined,
          organizerId: ev.organizerId,
          type: ev.type,
          category: ev.category,
          createdAt:
            ev.createdAt instanceof Date
              ? ev.createdAt.toISOString()
              : ev.createdAt,
          updatedAt:
            ev.updatedAt instanceof Date
              ? ev.updatedAt.toISOString()
              : ev.updatedAt,
          organizer: ev.organizer,
          averageRating,
          totalReviews: ev.reviews.length,
          ticketCategories: ev.ticketCategories.map((c) => ({
            ...c,
            price: Number(c.price),
          })),
          stats: this.calculateEventStats(ev),
          distance: Math.round(distance * 10) / 10,
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
              id: true,
              email: true,
              username: true,
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

      const distance =
        userLat != null &&
        userLon != null &&
        ev.latitude != null &&
        ev.longitude != null
          ? Math.round(
              this.haversineDistance(
                userLat,
                userLon,
                ev.latitude,
                ev.longitude,
              ) * 10,
            ) / 10
          : undefined;

      return {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        location: ev.location,
        address: ev.address,
        city: ev.city,
        postalCode: ev.postalCode,
        country: ev.country,
        latitude: ev.latitude,
        longitude: ev.longitude,
        imageUrl: ev.imageUrl,
        imagePublicId: ev.imagePublicId,
        eventDate: eventDate ?? undefined,
        organizerId: ev.organizerId,
        type: ev.type,
        category: ev.category,
        createdAt:
          ev.createdAt instanceof Date
            ? ev.createdAt.toISOString()
            : ev.createdAt,
        updatedAt:
          ev.updatedAt instanceof Date
            ? ev.updatedAt.toISOString()
            : ev.updatedAt,
        organizer: ev.organizer,
        averageRating,
        totalReviews: ev.reviews.length,
        ticketCategories: ev.ticketCategories.map((c) => ({
          ...c,
          price: Number(c.price),
        })),
        stats: this.calculateEventStats(ev),
        ...(distance !== undefined && { distance }),
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

  private buildOrderBy(sortBy: SortBy): {
    eventDate?: 'asc' | 'desc';
    createdAt?: 'asc' | 'desc';
  } {
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
      case SortBy.DISTANCE_ASC:
        return { eventDate: 'asc' };
      default:
        return { eventDate: 'asc' };
    }
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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

  async getAvailableCities() {
    const cities = await this.prisma.event.groupBy({
      by: ['city'],
      where: {
        city: {
          not: null,
        },
      },
      _count: {
        city: true,
      },
      orderBy: {
        _count: {
          city: 'desc',
        },
      },
    });

    return cities
      .filter((c) => c.city !== null)
      .map((c) => ({
        name: c.city as string,
        count: c._count.city,
      }));
  }
}
