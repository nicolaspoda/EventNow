export interface EventStats {
  totalCapacity: number;
  totalSold?: number;
  totalParticipants?: number;
  revenue?: number;
  fillRate: number;
  status: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  price: number;
  initialStock: number;
  currentStock: number;
}

export interface DashboardEvent {
  id: string;
  title: string;
  description?: string;
  location: string;
  imageUrl?: string;
  eventDate: string;
  organizerId: string;
  type: 'PROFESSIONAL' | 'COMMUNITY';
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  ticketCategories: TicketCategory[];
  stats: EventStats;
}

export interface OrganizerOverview {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  averageTicketPrice: number;
}

export interface UserOverview {
  totalEvents: number;
  upcomingEvents: number;
  totalParticipants: number;
  averageParticipants: number;
}

export interface EventStatsDetail {
  event: {
    id: string;
    title: string;
    eventDate: string;
  };
  categoriesStats: Array<{
    id: string;
    name: string;
    price: number;
    initialStock: number;
    currentStock: number;
    sold: number;
    revenue: number;
    fillRate: number;
  }>;
  salesByDay: Record<string, number>;
  totalRevenue: number;
  totalSold: number;
}

export interface EventParticipant {
  userId: string;
  email: string;
  username?: string | null;
  quantity: number;
  status: string;
  bookedAt: string;
}

export interface EventParticipantsResponse {
  event: {
    id: string;
    title: string;
    eventDate: string;
  };
  participants: EventParticipant[];
  totalParticipants: number;
}

export type EventCategory =
  | 'CONCERT'
  | 'CONFERENCE'
  | 'FESTIVAL'
  | 'SPORT'
  | 'THEATER'
  | 'EXHIBITION'
  | 'OTHER';

interface UpcomingEventOrganizer {
  id: string;
  email: string;
  username?: string | null;
}

interface UpcomingEventBase {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  location: string;
  imageUrl?: string;
  type: 'PROFESSIONAL' | 'COMMUNITY';
  category: EventCategory;
  organizer?: UpcomingEventOrganizer;
}

export interface UpcomingTicketEvent extends UpcomingEventBase {
  participationType: 'TICKET';
  ticketCount: number;
  categoryName: string;
}

export interface UpcomingParticipationEvent extends UpcomingEventBase {
  participationType: 'PARTICIPATION';
  acceptedAt?: string;
}

export interface UpcomingOrganizedEvent extends UpcomingEventBase {
  participationType: 'ORGANIZER';
}

export type UpcomingEvent =
  | UpcomingTicketEvent
  | UpcomingParticipationEvent
  | UpcomingOrganizedEvent;

export type ParticipatedEvent = UpcomingEvent & { isPast: boolean };
