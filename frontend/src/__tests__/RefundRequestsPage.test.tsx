import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefundRequestsPage } from '../pages/RefundRequestsPage';
import { orderService } from '../services/orderService';
import type { OrderWithUser } from '../types/order.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/orderService', () => ({
  orderService: {
    getRefundRequests: vi.fn(),
    approveRefund: vi.fn(),
    rejectRefund: vi.fn(),
  },
}));

function makeOrder(overrides: Partial<OrderWithUser> = {}): OrderWithUser {
  return {
    id: 'order-12345678',
    userId: 'u1',
    totalAmount: 40,
    status: 'REFUND_REQUESTED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    user: { id: 'u1', email: 'alice@example.com', username: 'alice' },
    tickets: [
      {
        id: 't1',
        orderId: 'order-12345678',
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
      <RefundRequestsPage />
    </MemoryRouter>,
  );
}

describe('RefundRequestsPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(orderService.getRefundRequests).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('shows an error message and allows retrying', async () => {
    vi.mocked(orderService.getRefundRequests)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([]);

    renderPage();

    expect(
      await screen.findByText('Impossible de charger les demandes de remboursement'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() => expect(orderService.getRefundRequests).toHaveBeenCalledTimes(2));
  });

  it('shows an empty state', async () => {
    vi.mocked(orderService.getRefundRequests).mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText('Aucune demande de remboursement en attente.'),
    ).toBeInTheDocument();
  });

  it('navigates back to the organizer dashboard', async () => {
    vi.mocked(orderService.getRefundRequests).mockResolvedValue([]);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Retour au tableau de bord/ }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/organizer');
  });

  it('lists a refund request with event, client and amount', async () => {
    vi.mocked(orderService.getRefundRequests).mockResolvedValue([makeOrder()]);

    renderPage();

    expect(await screen.findByText('Commande #order-12')).toBeInTheDocument();
    expect(screen.getByText('Événement : Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText(/Client : alice/)).toBeInTheDocument();
    expect(screen.getByText(/alice@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/Total : 40.00/)).toBeInTheDocument();
  });

  it('approves a refund', async () => {
    vi.mocked(orderService.getRefundRequests).mockResolvedValue([makeOrder()]);
    vi.mocked(orderService.approveRefund).mockResolvedValue({} as never);

    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Approuver le remboursement' }),
    );

    await waitFor(() =>
      expect(orderService.approveRefund).toHaveBeenCalledWith('order-12345678'),
    );
    await waitFor(() => expect(orderService.getRefundRequests).toHaveBeenCalledTimes(2));
  });

  it('shows an alert when approving fails', async () => {
    vi.mocked(orderService.getRefundRequests).mockResolvedValue([makeOrder()]);
    vi.mocked(orderService.approveRefund).mockRejectedValue({
      response: { data: { message: 'Déjà remboursée' } },
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Approuver le remboursement' }),
    );

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Déjà remboursée'));
  });

  it('rejects a refund after confirmation', async () => {
    vi.mocked(orderService.getRefundRequests).mockResolvedValue([makeOrder()]);
    vi.mocked(orderService.rejectRefund).mockResolvedValue({} as never);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Refuser' }));

    await waitFor(() =>
      expect(orderService.rejectRefund).toHaveBeenCalledWith('order-12345678'),
    );
  });

  it('does not reject when the confirmation dialog is cancelled', async () => {
    vi.mocked(orderService.getRefundRequests).mockResolvedValue([makeOrder()]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Refuser' }));

    expect(orderService.rejectRefund).not.toHaveBeenCalled();
  });

  it('shows a fallback user label when the user is missing', async () => {
    vi.mocked(orderService.getRefundRequests).mockResolvedValue([
      makeOrder({ user: undefined, userId: 'u-fallback-id' }),
    ]);

    renderPage();

    expect(await screen.findByText(/Client : u-fallba/)).toBeInTheDocument();
  });
});
