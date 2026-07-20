import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BookingModal from '../components/bookings/BookingModal';
import type { TicketCategory } from '../types/event.types';

const category: TicketCategory = {
  id: 'c1',
  name: 'Standard',
  description: 'Accès général',
  price: 15,
  initialStock: 100,
  currentStock: 5,
};

function renderModal(props: Partial<React.ComponentProps<typeof BookingModal>> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  const utils = render(
    <BookingModal
      category={category}
      eventTitle="Concert de jazz"
      onClose={onClose}
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { ...utils, onClose, onConfirm };
}

describe('BookingModal', () => {
  it('shows the event, category and unit price', () => {
    renderModal();

    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getAllByText('15.00 €').length).toBeGreaterThan(0);
  });

  it('caps the max quantity at the lesser of stock and 10', () => {
    renderModal();

    expect(screen.getByText('Maximum 5 billets par réservation')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de billets')).toHaveAttribute('max', '5');
  });

  it('caps the max quantity at 10 when stock is higher', () => {
    renderModal({ category: { ...category, currentStock: 50 } });

    expect(screen.getByText('Maximum 10 billets par réservation')).toBeInTheDocument();
  });

  it('updates the total price as quantity changes', () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Nombre de billets'), { target: { value: '3' } });

    expect(screen.getByText('45.00 €')).toBeInTheDocument();
  });

  it('clamps the quantity between 1 and the max', () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Nombre de billets'), { target: { value: '99' } });
    expect(screen.getByLabelText('Nombre de billets')).toHaveValue(5);

    fireEvent.change(screen.getByLabelText('Nombre de billets'), { target: { value: '0' } });
    expect(screen.getByLabelText('Nombre de billets')).toHaveValue(1);
  });

  it('submits the chosen quantity', async () => {
    const { onConfirm } = renderModal();

    fireEvent.change(screen.getByLabelText('Nombre de billets'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Réserver' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(2));
  });

  it('shows an error message when the booking fails', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('boom'));
    renderModal({ onConfirm });

    fireEvent.click(screen.getByRole('button', { name: 'Réserver' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erreur lors de la réservation');
  });

  it('disables the submit button when stock is 0', () => {
    renderModal({ category: { ...category, currentStock: 0 } });

    expect(screen.getByRole('button', { name: 'Réserver' })).toBeDisabled();
  });

  it('calls onClose when the close button or cancel button is clicked', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
