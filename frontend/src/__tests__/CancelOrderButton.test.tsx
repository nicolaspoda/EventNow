import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CancelOrderButton from '../components/orders/CancelOrderButton';
import { orderService } from '../services/orderService';

vi.mock('../services/orderService', () => ({
  orderService: {
    requestRefund: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CancelOrderButton', () => {
  it('does not show the confirmation dialog initially', () => {
    render(<CancelOrderButton orderId="o1" onSuccess={vi.fn()} />);

    expect(screen.queryByText('Annuler cette commande ?')).not.toBeInTheDocument();
  });

  it('opens the confirmation dialog when clicked', () => {
    render(<CancelOrderButton orderId="o1" onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler la commande' }));

    expect(screen.getByText('Annuler cette commande ?')).toBeInTheDocument();
  });

  it('closes the dialog without cancelling when "Conserver ma commande" is clicked', () => {
    render(<CancelOrderButton orderId="o1" onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler la commande' }));
    fireEvent.click(screen.getByRole('button', { name: 'Conserver ma commande' }));

    expect(screen.queryByText('Annuler cette commande ?')).not.toBeInTheDocument();
    expect(orderService.requestRefund).not.toHaveBeenCalled();
  });

  it('confirms the cancellation and calls onSuccess', async () => {
    vi.mocked(orderService.requestRefund).mockResolvedValue({} as never);
    const onSuccess = vi.fn();
    render(<CancelOrderButton orderId="o1" onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler la commande' }));
    fireEvent.click(screen.getByRole('button', { name: "Confirmer l'annulation" }));

    await waitFor(() => expect(orderService.requestRefund).toHaveBeenCalledWith('o1'));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Annuler cette commande ?')).not.toBeInTheDocument();
  });

  it('shows an error message and keeps the dialog open when cancellation fails', async () => {
    vi.mocked(orderService.requestRefund).mockRejectedValue(new Error('boom'));
    const onSuccess = vi.fn();
    render(<CancelOrderButton orderId="o1" onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler la commande' }));
    fireEvent.click(screen.getByRole('button', { name: "Confirmer l'annulation" }));

    expect(await screen.findByText("Erreur lors de l'annulation")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
