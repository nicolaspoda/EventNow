import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrderCard from '../components/orders/OrderCard';
import type { Order } from '../types/order.types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-12345678',
    userId: 'u1',
    totalAmount: 40,
    status: 'PAID',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ticketCategory: { id: 'c1', name: 'Standard', description: 'Accès général', price: 20, initialStock: 100, currentStock: 50 },
    quantity: 2,
    ...overrides,
  };
}

describe('OrderCard', () => {
  it('shows the order id, date, category and total', () => {
    render(<OrderCard order={makeOrder()} />);

    expect(screen.getByText('Commande #order-12')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('40.00 €')).toBeInTheDocument();
  });

  it.each([
    ['PAID', 'Payée'],
    ['PENDING', 'En attente'],
    ['REFUNDED', 'Remboursée'],
    ['REFUND_REQUESTED', 'Remboursement demandé'],
  ] as const)('shows the %s status badge', (status, label) => {
    render(<OrderCard order={makeOrder({ status })} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('shows a cancelled-event badge and message regardless of order status', () => {
    render(
      <OrderCard
        order={makeOrder({
          tickets: [
            {
              id: 't1',
              orderId: 'order-12345678',
              ticketCategory: {
                id: 'c1',
                name: 'Standard',
                price: 20,
                initialStock: 100,
                currentStock: 50,
                event: { id: 'e1', title: 'Concert', eventDate: '2026-01-01T00:00:00.000Z', location: 'Paris', cancelledAt: '2026-01-05T00:00:00.000Z' } as never,
              },
              qrCode: 'qr1',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        })}
      />,
    );

    expect(screen.getByText('ANNULÉ')).toBeInTheDocument();
    expect(screen.getByText('Événement annulé')).toBeInTheDocument();
  });

  it('shows a "view tickets" button for a paid, non-cancelled order and calls the handler', () => {
    const onViewTickets = vi.fn();
    render(<OrderCard order={makeOrder()} onViewTickets={onViewTickets} />);

    fireEvent.click(screen.getByRole('button', { name: /Voir mes billets/ }));

    expect(onViewTickets).toHaveBeenCalledWith('order-12345678');
  });

  it('does not show a "view tickets" button for a pending order', () => {
    render(<OrderCard order={makeOrder({ status: 'PENDING' })} onViewTickets={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Voir mes billets/ })).not.toBeInTheDocument();
  });

  it('renders the CancelOrderButton for a cancellable paid order when onCancelSuccess is provided', () => {
    render(<OrderCard order={makeOrder()} onCancelSuccess={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Annuler la commande' })).toBeInTheDocument();
  });

  it('shows a refunded message with the refunded amount', () => {
    render(<OrderCard order={makeOrder({ status: 'REFUNDED' })} />);

    expect(screen.getByText('Commande remboursée')).toBeInTheDocument();
    expect(screen.getAllByText('40.00 €').length).toBeGreaterThan(0);
  });
});
