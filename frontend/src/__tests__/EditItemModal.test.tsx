import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EditItemModal from '../components/events/EditItemModal';
import type { EventItem } from '../services/eventItemsService';

const item: EventItem = {
  id: 'i1',
  listId: 'list1',
  name: 'Chips',
  quantity: 2,
  unit: 'kg',
  note: 'Sans gluten',
  status: 'UNCLAIMED',
  claimedById: null,
  claimedBy: null,
  addedById: 'u1',
};

describe('EditItemModal', () => {
  it('pre-fills the form with the item values', () => {
    render(<EditItemModal item={item} onSubmit={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByLabelText(/Nom/)).toHaveValue('Chips');
    expect(screen.getByLabelText('Quantité')).toHaveValue(2);
    expect(screen.getByLabelText('Unité')).toHaveValue('kg');
    expect(screen.getByLabelText('Précisions')).toHaveValue('Sans gluten');
  });

  it('submits the updated values and closes on success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<EditItemModal item={item} onSubmit={onSubmit} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Nachos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Nachos',
        quantity: 2,
        unit: 'kg',
        note: 'Sans gluten',
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when the submission fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    render(<EditItemModal item={item} onSubmit={onSubmit} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(
      await screen.findByText("Erreur lors de la modification de l'article"),
    ).toBeInTheDocument();
  });

  it('disables submit when the name is cleared', () => {
    render(<EditItemModal item={item} onSubmit={vi.fn()} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: '   ' } });

    expect(screen.getByRole('button', { name: 'Modifier' })).toBeDisabled();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<EditItemModal item={item} onSubmit={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
