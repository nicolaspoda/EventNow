import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AddItemModal from '../components/events/AddItemModal';

describe('AddItemModal', () => {
  it('disables the submit button until a name is entered', () => {
    render(<AddItemModal onSubmit={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Ajouter à la liste' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Chips' } });

    expect(screen.getByRole('button', { name: 'Ajouter à la liste' })).not.toBeDisabled();
  });

  it('submits the trimmed name, quantity, unit and note, then closes', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<AddItemModal onSubmit={onSubmit} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: '  Chips  ' } });
    fireEvent.change(screen.getByLabelText('Quantité'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Unité'), { target: { value: 'kg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter à la liste' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Chips',
        quantity: 3,
        unit: 'kg',
        note: undefined,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an error message and does not close when the submission fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    const onClose = vi.fn();
    render(<AddItemModal onSubmit={onSubmit} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Chips' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter à la liste' }));

    expect(await screen.findByText("Erreur lors de l'ajout de l'article")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clamps the quantity to a minimum of 1', () => {
    render(<AddItemModal onSubmit={vi.fn()} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Quantité'), { target: { value: '0' } });

    expect(screen.getByLabelText('Quantité')).toHaveValue(1);
  });

  it('calls onClose when the backdrop or the cancel button is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<AddItemModal onSubmit={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('.absolute.inset-0')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
