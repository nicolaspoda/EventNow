export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  price: number | string;
  initialStock: number;
  currentStock: number;
  event?: { id: string; title: string; eventDate: string; location: string };
}

export interface Organizer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  location: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  eventDate: string;
  organizerId: string;
  type?: EventTypeCreate;
  ticketCategories: TicketCategory[];
  organizer?: Organizer;
  createdAt: string;
  updatedAt: string;
}

export interface EventFilters {
  search?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type EventTypeCreate = 'PROFESSIONAL' | 'COMMUNITY';

export interface CreateTicketCategoryPayload {
  name: string;
  description?: string;
  price: number;
  initial_stock: number;
  current_stock?: number;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  location: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  image_public_id?: string;
  event_date: string;
  type?: EventTypeCreate;
  ticket_categories: CreateTicketCategoryPayload[];
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  location?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  image_public_id?: string;
  event_date?: string;
  ticket_categories?: CreateTicketCategoryPayload[];
}
