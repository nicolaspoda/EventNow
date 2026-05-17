import { api } from './api';

export type ItemStatus = 'UNCLAIMED' | 'CLAIMED';

export interface EventItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string | null;
  note: string | null;
  status: ItemStatus;
  claimedById: string | null;
  claimedBy: { id: string; username: string | null; avatarUrl: string | null } | null;
  addedById: string;
  addedBy: { id: string; username: string | null };
  isClaimedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventItemList {
  id: string;
  eventId: string;
  items: EventItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemDto {
  name: string;
  quantity?: number;
  unit?: string;
  note?: string;
}

export interface UpdateItemDto {
  name?: string;
  quantity?: number;
  unit?: string;
  note?: string;
}

export const eventItemsService = {
  async getList(eventId: string): Promise<EventItemList> {
    const response = await api.get<EventItemList>(`/events/${eventId}/items`);
    return response.data;
  },

  async addItem(eventId: string, dto: CreateItemDto): Promise<EventItemList> {
    const response = await api.post<EventItemList>(`/events/${eventId}/items`, dto);
    return response.data;
  },

  async updateItem(
    eventId: string,
    itemId: string,
    dto: UpdateItemDto,
  ): Promise<EventItemList> {
    const response = await api.patch<EventItemList>(
      `/events/${eventId}/items/${itemId}`,
      dto,
    );
    return response.data;
  },

  async deleteItem(eventId: string, itemId: string): Promise<EventItemList> {
    const response = await api.delete<EventItemList>(
      `/events/${eventId}/items/${itemId}`,
    );
    return response.data;
  },

  async claimItem(eventId: string, itemId: string): Promise<EventItemList> {
    const response = await api.patch<EventItemList>(
      `/events/${eventId}/items/${itemId}/claim`,
    );
    return response.data;
  },
};
