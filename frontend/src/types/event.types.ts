export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  price: number;
  initialStock: number;
  currentStock: number;
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
  imageUrl?: string;
  eventDate: string;
  organizerId: string;
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
