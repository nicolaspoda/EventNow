import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OrderSummary from '../components/orders/OrderSummary';
import type { Order } from '../types/order.types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-12345678',
    userId: 'u1',
    totalAmount: 40,
    status: 'PAID',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ticketCategory: { id: 'c1', name: 'Standard', price: 20, initialStock: 100, currentStock: 50 },
    quantity: 2,
    ...overrides,
  };
}

describe('OrderSummary', () => {
  it('shows the order number, category, quantity and total', () => {
    render(<OrderSummary order={makeOrder()} />);

    expect(screen.getByText('#order-12')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('2 billets')).toBeInTheDocument();
    expect(screen.getByText('40.00 €')).toBeInTheDocument();
  });

  it('uses singular "billet" for a quantity of 1', () => {
    render(<OrderSummary order={makeOrder({ quantity: 1 })} />);

    expect(screen.getByText('1 billet')).toBeInTheDocument();
  });

  it('does not render a category row when there is no ticket category', () => {
    render(<OrderSummary order={makeOrder({ ticketCategory: undefined, quantity: 0 })} />);

    expect(screen.queryByText('Catégorie')).not.toBeInTheDocument();
  });

  it('falls back to the tickets array to derive the category and quantity', () => {
    render(
      <OrderSummary
        order={makeOrder({
          ticketCategory: undefined,
          quantity: undefined,
          tickets: [
            { id: 't1', orderId: 'order-12345678', ticketCategory: { id: 'c2', name: 'VIP', price: 50, initialStock: 10, currentStock: 5 }, qrCode: 'q1', createdAt: '2026-01-01T00:00:00.000Z' },
            { id: 't2', orderId: 'order-12345678', ticketCategory: { id: 'c2', name: 'VIP', price: 50, initialStock: 10, currentStock: 5 }, qrCode: 'q2', createdAt: '2026-01-01T00:00:00.000Z' },
          ],
        })}
      />,
    );

    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('2 billets')).toBeInTheDocument();
  });

  it('applies a custom className', () => {
    const { container } = render(<OrderSummary order={makeOrder()} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
