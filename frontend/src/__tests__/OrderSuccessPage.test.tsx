import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrderSuccessPage from '../pages/OrderSuccessPage';
import { orderService } from '../services/orderService';
import type { Order } from '../types/order.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/orderService', () => ({
  orderService: {
    getOrderById: vi.fn(),
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
    ticketCategory: {
      id: 'cat1',
      name: 'Standard',
      price: 20,
      initialStock: 100,
      currentStock: 90,
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage(orderId = 'o1') {
  return render(
    <MemoryRouter initialEntries={[`/orders/${orderId}/success`]}>
      <Routes>
        <Route path="/orders/:orderId/success" element={<OrderSuccessPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OrderSuccessPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(orderService.getOrderById).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows the backend error message on failure', async () => {
    vi.mocked(orderService.getOrderById).mockRejectedValue({
      response: { data: { message: 'Commande introuvable' } },
    });

    renderPage();

    expect(await screen.findByText('Commande introuvable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux événements' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  it('shows the success message and order summary once loaded', async () => {
    vi.mocked(orderService.getOrderById).mockResolvedValue(makeOrder());

    renderPage();

    expect(await screen.findByText('Paiement réussi !')).toBeInTheDocument();
    expect(screen.getByText('40.00 €')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Voir mes billets/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-tickets');
  });
});
