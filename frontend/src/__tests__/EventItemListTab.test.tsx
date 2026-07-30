import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventItemListTab from '../components/events/EventItemListTab';
import { eventItemsService } from '../services/eventItemsService';
import { socketService } from '../services/socketService';
import type { EventItem, EventItemList } from '../services/eventItemsService';

vi.mock('../services/eventItemsService', () => ({
  eventItemsService: {
    getList: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    claimItem: vi.fn(),
  },
}));

vi.mock('../services/socketService', () => ({
  socketService: {
    isConnected: vi.fn(),
    connect: vi.fn(),
    joinEventRoom: vi.fn(),
    leaveEventRoom: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

function makeItem(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'i1',
    listId: 'l1',
    name: 'Chips',
    quantity: 2,
    unit: 'kg',
    note: null,
    status: 'UNCLAIMED',
    claimedById: null,
    claimedBy: null,
    addedById: 'owner-1',
    addedBy: { id: 'owner-1', username: 'bob' },
    isClaimedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeList(items: EventItem[]): EventItemList {
  return { id: 'l1', eventId: 'e1', items, createdAt: '', updatedAt: '' };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(socketService.isConnected).mockReturnValue(true);
  vi.mocked(socketService.joinEventRoom).mockResolvedValue(undefined);
});

function renderTab(props: Partial<React.ComponentProps<typeof EventItemListTab>> = {}) {
  return render(
    <EventItemListTab eventId="e1" currentUserId="user-1" isOrganizer={false} {...props} />,
  );
}

describe('EventItemListTab', () => {
  it('shows a loading state before the list arrives', () => {
    vi.mocked(eventItemsService.getList).mockReturnValue(new Promise(() => {}));

    renderTab();

    expect(screen.getByLabelText('Chargement...')).toBeInTheDocument();
  });

  it('shows an error message when loading fails', async () => {
    vi.mocked(eventItemsService.getList).mockRejectedValue(new Error('boom'));

    renderTab();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erreur lors du chargement de la liste',
    );
  });

  it('shows an empty state when the list has no items', async () => {
    vi.mocked(eventItemsService.getList).mockResolvedValue(makeList([]));

    renderTab();

    expect(await screen.findByText("Aucun article pour l'instant.")).toBeInTheDocument();
  });

  it('splits items into "À apporter" and "Pris en charge" sections', async () => {
    vi.mocked(eventItemsService.getList).mockResolvedValue(
      makeList([
        makeItem({ id: 'i1', name: 'Chips', status: 'UNCLAIMED' }),
        makeItem({ id: 'i2', name: 'Boissons', status: 'CLAIMED', isClaimedByMe: false }),
      ]),
    );

    renderTab();

    expect(await screen.findByText('À apporter (1)')).toBeInTheDocument();
    expect(screen.getByText('Pris en charge (1)')).toBeInTheDocument();
    expect(screen.getByText('Chips')).toBeInTheDocument();
    expect(screen.getByText('Boissons')).toBeInTheDocument();
  });

  it('claims an unclaimed item and updates the list from the response', async () => {
    vi.mocked(eventItemsService.getList).mockResolvedValue(
      makeList([makeItem({ id: 'i1', status: 'UNCLAIMED' })]),
    );
    vi.mocked(eventItemsService.claimItem).mockResolvedValue(
      makeList([makeItem({ id: 'i1', status: 'CLAIMED', isClaimedByMe: true })]),
    );

    renderTab();
    await screen.findByText('Chips');

    fireEvent.click(screen.getByRole('button', { name: "Je m'en charge" }));

    await waitFor(() => expect(eventItemsService.claimItem).toHaveBeenCalledWith('e1', 'i1'));
    expect(await screen.findByText('Vous apportez cet article')).toBeInTheDocument();
  });

  it('shows an action error when claiming fails, without crashing the list', async () => {
    vi.mocked(eventItemsService.getList).mockResolvedValue(
      makeList([makeItem({ id: 'i1', status: 'UNCLAIMED' })]),
    );
    vi.mocked(eventItemsService.claimItem).mockRejectedValue(new Error('boom'));

    renderTab();
    await screen.findByText('Chips');

    fireEvent.click(screen.getByRole('button', { name: "Je m'en charge" }));

    expect(await screen.findByText('Erreur lors de la mise à jour')).toBeInTheDocument();
  });

  it('shows edit/delete actions only when the current user can manage the item', async () => {
    vi.mocked(eventItemsService.getList).mockResolvedValue(
      makeList([makeItem({ id: 'i1', addedById: 'owner-1' })]),
    );

    renderTab({ currentUserId: 'someone-else', isOrganizer: false });
    await screen.findByText('Chips');

    expect(screen.queryByRole('button', { name: "Modifier l'article" })).not.toBeInTheDocument();
  });

  it('shows edit/delete actions for the organizer and deletes an item', async () => {
    vi.mocked(eventItemsService.getList).mockResolvedValue(
      makeList([makeItem({ id: 'i1', addedById: 'owner-1' })]),
    );
    vi.mocked(eventItemsService.deleteItem).mockResolvedValue(makeList([]));

    renderTab({ currentUserId: 'someone-else', isOrganizer: true });
    await screen.findByText('Chips');

    fireEvent.click(screen.getByRole('button', { name: "Supprimer l'article" }));

    await waitFor(() => expect(eventItemsService.deleteItem).toHaveBeenCalledWith('e1', 'i1'));
    await waitFor(() => expect(screen.queryByText('Chips')).not.toBeInTheDocument());
  });

  it('opens the add-item modal, submits it and refreshes the list', async () => {
    vi.mocked(eventItemsService.getList).mockResolvedValue(makeList([]));
    vi.mocked(eventItemsService.addItem).mockResolvedValue(
      makeList([makeItem({ id: 'i2', name: 'Nappes' })]),
    );

    renderTab();
    await screen.findByText("Aucun article pour l'instant.");

    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un article' }));
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Nappes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter à la liste' }));

    await waitFor(() => expect(eventItemsService.addItem).toHaveBeenCalled());
    expect(await screen.findByText('Nappes')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the edit-item modal for an editable item and submits changes', async () => {
    vi.mocked(eventItemsService.getList).mockResolvedValue(
      makeList([makeItem({ id: 'i1', name: 'Chips', addedById: 'user-1' })]),
    );
    vi.mocked(eventItemsService.updateItem).mockResolvedValue(
      makeList([makeItem({ id: 'i1', name: 'Nachos', addedById: 'user-1' })]),
    );

    renderTab({ currentUserId: 'user-1' });
    await screen.findByText('Chips');

    fireEvent.click(screen.getByRole('button', { name: "Modifier l'article" }));
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Nachos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    await waitFor(() =>
      expect(eventItemsService.updateItem).toHaveBeenCalledWith('e1', 'i1', expect.objectContaining({ name: 'Nachos' })),
    );
    expect(await screen.findByText('Nachos')).toBeInTheDocument();
  });

  it('shows the claim progress percentage', async () => {
    vi.mocked(eventItemsService.getList).mockResolvedValue(
      makeList([
        makeItem({ id: 'i1', status: 'CLAIMED' }),
        makeItem({ id: 'i2', status: 'UNCLAIMED' }),
      ]),
    );

    renderTab();

    expect(await screen.findByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
