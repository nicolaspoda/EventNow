import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventItemsService } from '../services/eventItemsService';
import { api } from '../services/api';
import type { EventItemList } from '../services/eventItemsService';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const list: EventItemList = {
  id: 'l1',
  eventId: 'e1',
  items: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('eventItemsService', () => {
  it('getList fetches the item list for an event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: list });

    const result = await eventItemsService.getList('e1');

    expect(api.get).toHaveBeenCalledWith('/events/e1/items');
    expect(result).toEqual(list);
  });

  it('addItem posts the new item dto', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: list });
    const dto = { name: 'Chaises', quantity: 4 };

    const result = await eventItemsService.addItem('e1', dto);

    expect(api.post).toHaveBeenCalledWith('/events/e1/items', dto);
    expect(result).toEqual(list);
  });

  it('updateItem patches the item with the given dto', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: list });
    const dto = { quantity: 6 };

    const result = await eventItemsService.updateItem('e1', 'i1', dto);

    expect(api.patch).toHaveBeenCalledWith('/events/e1/items/i1', dto);
    expect(result).toEqual(list);
  });

  it('deleteItem deletes the item by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: list });

    const result = await eventItemsService.deleteItem('e1', 'i1');

    expect(api.delete).toHaveBeenCalledWith('/events/e1/items/i1');
    expect(result).toEqual(list);
  });

  it('claimItem patches the claim endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: list });

    const result = await eventItemsService.claimItem('e1', 'i1');

    expect(api.patch).toHaveBeenCalledWith('/events/e1/items/i1/claim');
    expect(result).toEqual(list);
  });
});
