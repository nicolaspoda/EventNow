import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyOrdersPage from '../pages/MyOrdersPage';
import { orderService } from '../services/orderService';
import type { Order } from '../types/order.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/orderService', () => ({
  orderService: {
    getMyOrders: vi.fn(),
  },
}));

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    userId: 'u1',
    totalAmount: 40,
    status: 'PAID',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    quantity: 2,
    tickets: [
      {
        id: 't1',
        orderId: 'o1',
        qrCode: 'qr1',
        createdAt: '2026-01-01T00:00:00.000Z',
        ticketCategory: {
          id: 'cat1',
          name: 'Standard',
          price: 20,
          initialStock: 100,
          currentStock: 90,
          event: {
            id: 'e1',
            title: 'Concert de jazz',
            eventDate: '2099-06-01T20:00:00.000Z',
            location: 'Paris',
          },
        },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <MyOrdersPage />
    </MemoryRouter>,
  );
}

describe('MyOrdersPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(orderService.getMyOrders).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement de vos commandes...')).toBeInTheDocument();
  });

  it('shows an error message and allows retrying', async () => {
    vi.mocked(orderService.getMyOrders)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([]);

    renderPage();

    expect(
      await screen.findByText('Impossible de charger vos commandes'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() => expect(orderService.getMyOrders).toHaveBeenCalledTimes(2));
  });

  it('shows an empty state and navigates to events', async () => {
    vi.mocked(orderService.getMyOrders).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucune commande')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Découvrir les événements' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  it('lists orders and navigates to tickets', async () => {
    vi.mocked(orderService.getMyOrders).mockResolvedValue([makeOrder()]);

    renderPage();

    expect(await screen.findByText(/Commande #o1/)).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Voir mes billets' })[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/my-tickets');
  });
});
