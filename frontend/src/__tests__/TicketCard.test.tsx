import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import TicketCard from '../components/tickets/TicketCard';
import type { Ticket } from '../types/order.types';

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-12345678',
    orderId: 'order-1',
    qrCode: 'qr-1',
    isValidated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ticketCategory: {
      id: 'c1',
      name: 'Standard',
      description: 'Accès général',
      price: 20,
      initialStock: 100,
      currentStock: 50,
      event: {
        id: 'e1',
        title: 'Concert de jazz',
        eventDate: '2026-06-15T20:00:00.000Z',
        location: 'Paris',
      } as never,
    },
    ...overrides,
  };
}

function renderCard(props: Partial<React.ComponentProps<typeof TicketCard>> = {}) {
  return render(
    <MemoryRouter>
      <TicketCard
        ticket={makeTicket()}
        onViewQRCode={vi.fn()}
        onDownload={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('TicketCard', () => {
  it('shows the ticket id, event and category', () => {
    renderCard();

    expect(screen.getByText('Billet #ticket-1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Concert de jazz' })).toHaveAttribute(
      'href',
      '/events/e1',
    );
    expect(screen.getByText('Standard')).toBeInTheDocument();
  });

  it('shows an "Actif" badge and enabled actions for an unvalidated ticket', () => {
    renderCard();

    expect(screen.getByText('Actif')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Afficher le QR code/ })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Télécharger' })).toBeInTheDocument();
  });

  it('shows a "Validé" badge and disables actions for a validated ticket', () => {
    renderCard({ ticket: makeTicket({ isValidated: true, validatedAt: '2026-06-15T20:05:00.000Z' }) });

    expect(screen.getByText('Validé')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Billet utilisé/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Télécharger' })).not.toBeInTheDocument();
  });

  it('shows an "ANNULÉ" badge and a cancellation notice for a cancelled event', () => {
    renderCard({
      ticket: makeTicket({
        ticketCategory: {
          id: 'c1',
          name: 'Standard',
          price: 20,
          initialStock: 100,
          currentStock: 50,
          event: { id: 'e1', title: 'Concert', eventDate: '2026-06-15T20:00:00.000Z', location: 'Paris', cancelledAt: '2026-01-05T00:00:00.000Z' } as never,
        },
      }),
    });

    expect(screen.getByText('ANNULÉ')).toBeInTheDocument();
    expect(screen.getByText(/Cet événement a été annulé/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /QR code/ })).not.toBeInTheDocument();
  });

  it('calls onViewQRCode and onDownload', () => {
    const onViewQRCode = vi.fn();
    const onDownload = vi.fn();
    renderCard({ onViewQRCode, onDownload });

    fireEvent.click(screen.getByRole('button', { name: /Afficher le QR code/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }));

    expect(onViewQRCode).toHaveBeenCalledWith(expect.objectContaining({ id: 'ticket-12345678' }));
    expect(onDownload).toHaveBeenCalledWith(expect.objectContaining({ id: 'ticket-12345678' }));
  });
});
