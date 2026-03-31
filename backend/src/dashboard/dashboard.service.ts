import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async getOrganizerOverview(organizerId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        organizerId,
        type: 'PROFESSIONAL',
      },
      include: {
        ticketCategories: true,
      },
    });

    const totalEvents = events.length;
    const now = new Date();
    const upcomingEvents = events.filter((e) => e.eventDate > now).length;
    const pastEvents = totalEvents - upcomingEvents;

    let totalRevenue = 0;
    let totalTicketsSold = 0;

    for (const event of events) {
      for (const category of event.ticketCategories) {
        const soldTickets = category.initialStock - category.currentStock;
        totalTicketsSold += soldTickets;
        totalRevenue += soldTickets * Number(category.price);
      }
    }

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      totalRevenue,
      totalTicketsSold,
      averageTicketPrice:
        totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0,
    };
  }

  async getOrganizerEvents(organizerId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        organizerId,
        type: 'PROFESSIONAL',
      },
      include: {
        ticketCategories: true,
      },
      orderBy: {
        eventDate: 'desc',
      },
    });

    return events.map((event) => {
      let totalCapacity = 0;
      let totalSold = 0;
      let revenue = 0;

      event.ticketCategories.forEach((cat) => {
        totalCapacity += cat.initialStock;
        const sold = cat.initialStock - cat.currentStock;
        totalSold += sold;
        revenue += sold * Number(cat.price);
      });

      const fillRate =
        totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
      const status = this.getEventStatus(event.eventDate, fillRate);

      return {
        ...event,
        eventDate:
          event.eventDate instanceof Date
            ? event.eventDate.toISOString()
            : event.eventDate,
        ticketCategories: event.ticketCategories.map((c) => ({
          ...c,
          price: Number(c.price),
        })),
        stats: {
          totalCapacity,
          totalSold,
          revenue,
          fillRate: Math.round(fillRate * 100) / 100,
          status,
        },
      };
    });
  }

  async getEventStats(eventId: string, organizerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketCategories: {
          include: {
            bookings: {
              where: { status: { in: ['CONFIRMED', 'PENDING'] } },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Accès non autorisé');
    }

    const categoriesStats = event.ticketCategories.map((cat) => {
      const sold = cat.initialStock - cat.currentStock;
      const revenue = sold * Number(cat.price);
      const fillRate = (sold / cat.initialStock) * 100;

      return {
        id: cat.id,
        name: cat.name,
        price: Number(cat.price),
        initialStock: cat.initialStock,
        currentStock: cat.currentStock,
        sold,
        revenue,
        fillRate: Math.round(fillRate * 100) / 100,
      };
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookings = await this.prisma.booking.findMany({
      where: {
        ticketCategory: {
          eventId,
        },
        status: 'CONFIRMED',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        quantity: true,
      },
    });

    const salesByDay = bookings.reduce(
      (acc, booking) => {
        const date = booking.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += booking.quantity;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
      },
      categoriesStats,
      salesByDay,
      totalRevenue: categoriesStats.reduce((sum, cat) => sum + cat.revenue, 0),
      totalSold: categoriesStats.reduce((sum, cat) => sum + cat.sold, 0),
    };
  }

  async getClientOverview(clientId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        organizerId: clientId,
        type: 'COMMUNITY',
      },
      include: {
        ticketCategories: true,
      },
    });

    const totalEvents = events.length;
    const now = new Date();
    const upcomingEvents = events.filter((e) => e.eventDate > now).length;

    let totalParticipants = 0;

    for (const event of events) {
      for (const category of event.ticketCategories) {
        totalParticipants += category.initialStock - category.currentStock;
      }
    }

    return {
      totalEvents,
      upcomingEvents,
      totalParticipants,
      averageParticipants:
        totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0,
    };
  }

  async getClientEvents(clientId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        organizerId: clientId,
        type: 'COMMUNITY',
      },
      include: {
        ticketCategories: true,
      },
      orderBy: {
        eventDate: 'desc',
      },
    });

    return events.map((event) => {
      let totalCapacity = 0;
      let totalParticipants = 0;

      event.ticketCategories.forEach((cat) => {
        totalCapacity += cat.initialStock || 0;
        totalParticipants += (cat.initialStock || 0) - cat.currentStock;
      });

      const fillRate =
        totalCapacity > 0 ? (totalParticipants / totalCapacity) * 100 : 0;
      const status = this.getEventStatus(event.eventDate, fillRate);

      return {
        ...event,
        eventDate:
          event.eventDate instanceof Date
            ? event.eventDate.toISOString()
            : event.eventDate,
        ticketCategories: event.ticketCategories.map((c) => ({
          ...c,
          price: Number(c.price),
        })),
        stats: {
          totalCapacity,
          totalParticipants,
          fillRate: Math.round(fillRate * 100) / 100,
          status,
        },
      };
    });
  }

  async getEventParticipants(eventId: string, clientId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketCategories: {
          include: {
            bookings: {
              where: { status: { in: ['CONFIRMED', 'PENDING'] } },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    username: true,
                  },
                },
              },
            },
            tickets: {
              where: {
                order: { status: 'PAID' },
              },
              include: {
                order: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        participationRequests: {
          where: { status: 'ACCEPTED' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.organizerId !== clientId) {
      throw new ForbiddenException('Accès non autorisé');
    }

    const participantsMap = new Map<
      string,
      {
        userId: string;
        email: string;
        username: string | null;
        quantity: number;
        status: string;
        bookedAt: Date;
      }
    >();

    for (const cat of event.ticketCategories) {
      for (const booking of cat.bookings) {
        const existing = participantsMap.get(booking.user.id);
        if (existing) {
          existing.quantity += booking.quantity;
        } else {
          participantsMap.set(booking.user.id, {
            userId: booking.user.id,
            email: booking.user.email,
            username: booking.user.username,
            quantity: booking.quantity,
            status: booking.status,
            bookedAt: booking.createdAt,
          });
        }
      }

      for (const ticket of cat.tickets) {
        const user = ticket.order.user;
        const existing = participantsMap.get(user.id);
        if (existing) {
          existing.quantity += 1;
          if (existing.status !== 'CONFIRMED') {
            existing.status = 'CONFIRMED';
          }
        } else {
          participantsMap.set(user.id, {
            userId: user.id,
            email: user.email,
            username: user.username,
            quantity: 1,
            status: 'CONFIRMED',
            bookedAt: ticket.order.createdAt,
          });
        }
      }
    }

    for (const request of event.participationRequests) {
      const existing = participantsMap.get(request.user.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        participantsMap.set(request.user.id, {
          userId: request.user.id,
          email: request.user.email,
          username: request.user.username,
          quantity: 1,
          status: 'CONFIRMED',
          bookedAt: request.createdAt,
        });
      }
    }

    const participants = Array.from(participantsMap.values()).map((p) => ({
      ...p,
      bookedAt: p.bookedAt?.toISOString() ?? null,
    }));

    return {
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate?.toISOString() ?? null,
      },
      participants,
      totalParticipants: participants.reduce((sum, p) => sum + p.quantity, 0),
    };
  }

  /** Date de fin d'événement : endDate si défini, sinon eventDate + 6h. Utilisé pour afficher les billets tant que l'événement n'est pas terminé. */
  private getEventEndDate(event: {
    eventDate: Date;
    endDate?: Date | null;
  }): Date {
    if (event.endDate) return new Date(event.endDate);
    const end = new Date(event.eventDate);
    end.setHours(end.getHours() + 6);
    return end;
  }

  async getMyUpcomingEvents(userId: string) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const ticketsWithEvents = await this.prisma.ticket.findMany({
      where: {
        order: {
          userId,
          status: 'PAID',
        },
        ticketCategory: {
          event: {
            eventDate: { gte: oneDayAgo },
          },
        },
      },
      include: {
        ticketCategory: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                eventDate: true,
                endDate: true,
                location: true,
                imageUrl: true,
                type: true,
                category: true,
                organizer: {
                  select: {
                    id: true,
                    email: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        ticketCategory: {
          event: {
            eventDate: 'asc',
          },
        },
      },
    });

    const acceptedParticipations =
      await this.prisma.participationRequest.findMany({
        where: {
          userId,
          status: 'ACCEPTED',
          event: {
            eventDate: { gte: oneDayAgo },
          },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              eventDate: true,
              endDate: true,
              location: true,
              imageUrl: true,
              type: true,
              category: true,
              organizer: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: {
          event: {
            eventDate: 'asc',
          },
        },
      });

    const ticketEventsMap = new Map<
      string,
      {
        event: (typeof ticketsWithEvents)[0]['ticketCategory']['event'];
        ticketCount: number;
        categoryName: string;
      }
    >();

    for (const ticket of ticketsWithEvents) {
      const event = ticket.ticketCategory.event;
      if (this.getEventEndDate(event) <= now) continue;
      const eventId = event.id;
      const existing = ticketEventsMap.get(eventId);
      if (existing) {
        existing.ticketCount += 1;
      } else {
        ticketEventsMap.set(eventId, {
          event,
          ticketCount: 1,
          categoryName: ticket.ticketCategory.name,
        });
      }
    }

    const professionalEvents = Array.from(ticketEventsMap.values()).map(
      (item) => ({
        id: item.event.id,
        title: item.event.title,
        description: item.event.description,
        eventDate:
          item.event.eventDate instanceof Date
            ? item.event.eventDate.toISOString()
            : item.event.eventDate,
        location: item.event.location,
        imageUrl: item.event.imageUrl,
        type: item.event.type,
        category: item.event.category,
        organizer: (item.event as any).organizer,
        participationType: 'TICKET' as const,
        ticketCount: item.ticketCount,
        categoryName: item.categoryName,
      }),
    );

    const communityEvents = acceptedParticipations
      .filter((p) => this.getEventEndDate(p.event) > now)
      .map((participation) => ({
        id: participation.event.id,
        title: participation.event.title,
        description: participation.event.description,
        eventDate:
          participation.event.eventDate instanceof Date
            ? participation.event.eventDate.toISOString()
            : participation.event.eventDate,
        location: participation.event.location,
        imageUrl: participation.event.imageUrl,
        type: participation.event.type,
        category: participation.event.category,
        organizer: (participation.event as any).organizer,
        participationType: 'PARTICIPATION' as const,
        acceptedAt: participation.respondedAt,
      }));

    const allEvents = [...professionalEvents, ...communityEvents].sort(
      (a, b) => {
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        return dateA.getTime() - dateB.getTime();
      },
    );

    return allEvents;
  }

  /**
   * Retourne tous les événements auxquels l'utilisateur a participé (billets payés ou participation acceptée), passés et à venir.
   */
  async getMyParticipatedEvents(userId: string) {
    const now = new Date();

    const ticketsWithEvents = await this.prisma.ticket.findMany({
      where: {
        order: {
          userId,
          status: 'PAID',
        },
      },
      include: {
        ticketCategory: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                eventDate: true,
                location: true,
                imageUrl: true,
                type: true,
                category: true,
                organizer: {
                  select: {
                    id: true,
                    email: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        ticketCategory: {
          event: {
            eventDate: 'desc',
          },
        },
      },
    });

    const acceptedParticipations =
      await this.prisma.participationRequest.findMany({
        where: {
          userId,
          status: 'ACCEPTED',
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              eventDate: true,
              location: true,
              imageUrl: true,
              type: true,
              category: true,
              organizer: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: {
          event: {
            eventDate: 'desc',
          },
        },
      });

    const ticketEventsMap = new Map<
      string,
      {
        event: (typeof ticketsWithEvents)[0]['ticketCategory']['event'];
        ticketCount: number;
        categoryName: string;
      }
    >();

    for (const ticket of ticketsWithEvents) {
      const eventId = ticket.ticketCategory.event.id;
      const existing = ticketEventsMap.get(eventId);
      if (existing) {
        existing.ticketCount += 1;
      } else {
        ticketEventsMap.set(eventId, {
          event: ticket.ticketCategory.event,
          ticketCount: 1,
          categoryName: ticket.ticketCategory.name,
        });
      }
    }

    const professionalEvents = Array.from(ticketEventsMap.values()).map(
      (item) => {
        const eventDate =
          item.event.eventDate instanceof Date
            ? item.event.eventDate.toISOString()
            : item.event.eventDate;
        return {
          id: item.event.id,
          title: item.event.title,
          description: item.event.description,
          eventDate,
          location: item.event.location,
          imageUrl: item.event.imageUrl,
          type: item.event.type,
          category: item.event.category,
          organizer: (item.event as any).organizer,
          participationType: 'TICKET' as const,
          ticketCount: item.ticketCount,
          categoryName: item.categoryName,
          isPast: new Date(eventDate) < now,
        };
      },
    );

    const communityEvents = acceptedParticipations.map((participation) => {
      const eventDate =
        participation.event.eventDate instanceof Date
          ? participation.event.eventDate.toISOString()
          : participation.event.eventDate;
      return {
        id: participation.event.id,
        title: participation.event.title,
        description: participation.event.description,
        eventDate,
        location: participation.event.location,
        imageUrl: participation.event.imageUrl,
        type: participation.event.type,
        category: participation.event.category,
        organizer: (participation.event as any).organizer,
        participationType: 'PARTICIPATION' as const,
        acceptedAt: participation.respondedAt,
        isPast: new Date(eventDate) < now,
      };
    });

    const allEvents = [...professionalEvents, ...communityEvents].sort(
      (a, b) => {
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        return dateB.getTime() - dateA.getTime();
      },
    );

    return allEvents;
  }

  private getEventStatus(eventDate: Date, fillRate: number): string {
    const now = new Date();
    const eventDateObj = new Date(eventDate);

    if (eventDateObj < now) {
      return 'COMPLETED';
    }

    if (fillRate >= 100) {
      return 'SOLD_OUT';
    }

    const daysUntil = Math.ceil(
      (eventDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntil <= 7) {
      return 'UPCOMING';
    }

    if (fillRate >= 80) {
      return 'ALMOST_FULL';
    }

    return 'ON_SALE';
  }
}
