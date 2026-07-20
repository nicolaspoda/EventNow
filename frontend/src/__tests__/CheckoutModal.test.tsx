import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CheckoutModal from '../components/orders/CheckoutModal';
import type { TicketCategory } from '../types/event.types';

const category: TicketCategory = {
  id: 'c1',
  name: 'Standard',
  description: 'Accès général',
  price: 10,
  initialStock: 100,
  currentStock: 3,
};

function renderModal(props: Partial<React.ComponentProps<typeof CheckoutModal>> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  const utils = render(
    <CheckoutModal
      category={category}
      eventTitle="Concert de jazz"
      onClose={onClose}
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { ...utils, onClose, onConfirm };
}

describe('CheckoutModal', () => {
  it('shows the event, category and unit price', () => {
    renderModal();

    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getAllByText('10.00 €').length).toBeGreaterThan(0);
  });

  it('increments and decrements the quantity within stock limits', () => {
    renderModal();

    const quantityInput = screen.getByLabelText('Quantité de billets');
    expect(quantityInput).toHaveValue(1);
    expect(screen.getByRole('button', { name: 'Diminuer la quantité' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Augmenter la quantité' }));
    fireEvent.click(screen.getByRole('button', { name: 'Augmenter la quantité' }));
    expect(quantityInput).toHaveValue(3);
    expect(screen.getByRole('button', { name: 'Augmenter la quantité' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Diminuer la quantité' }));
    expect(quantityInput).toHaveValue(2);
  });

  it('updates the total price as quantity changes', () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Quantité de billets'), { target: { value: '3' } });

    expect(screen.getByText('30.00 €')).toBeInTheDocument();
  });

  it('submits the chosen quantity and closes on success', async () => {
    const { onConfirm, onClose } = renderModal();

    fireEvent.change(screen.getByLabelText('Quantité de billets'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Procéder au paiement' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(2));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an error message and does not close when the order fails', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('boom'));
    const { onClose } = renderModal({ onConfirm });

    fireEvent.click(screen.getByRole('button', { name: 'Procéder au paiement' }));

    expect(
      await screen.findByText('Une erreur est survenue lors de la commande'),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the backdrop or close button is clicked, without propagating from the panel', () => {
    const { onClose, container } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Concert de jazz'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('[role="dialog"]')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
