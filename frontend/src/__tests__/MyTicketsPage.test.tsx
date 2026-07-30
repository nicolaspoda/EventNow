import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyTicketsPage from '../pages/MyTicketsPage';
import { ticketService } from '../services/ticketService';
import type { Ticket } from '../types/order.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/ticketService', () => ({
  ticketService: {
    getMyTickets: vi.fn(),
    downloadTicketPDF: vi.fn(),
  },
}));

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 't1',
    orderId: 'o1',
    qrCode: 'qr-1',
    isValidated: false,
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
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <MyTicketsPage />
    </MemoryRouter>,
  );
}

describe('MyTicketsPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(ticketService.getMyTickets).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement de vos billets...')).toBeInTheDocument();
  });

  it('shows an error message and allows retrying', async () => {
    vi.mocked(ticketService.getMyTickets)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([]);

    renderPage();

    expect(await screen.findByText('Impossible de charger vos billets')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() => expect(ticketService.getMyTickets).toHaveBeenCalledTimes(2));
  });

  it('shows an empty state and navigates to events', async () => {
    vi.mocked(ticketService.getMyTickets).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucun billet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Découvrir les événements' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  it('lists tickets and opens the QR code modal', async () => {
    vi.mocked(ticketService.getMyTickets).mockResolvedValue([makeTicket()]);

    renderPage();

    expect(await screen.findByText('Concert de jazz')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /QR code/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('downloads the ticket PDF and shows an alert on failure', async () => {
    vi.mocked(ticketService.getMyTickets).mockResolvedValue([makeTicket()]);
    vi.mocked(ticketService.downloadTicketPDF).mockRejectedValue(new Error('boom'));
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Télécharger/i }));

    await waitFor(() => expect(ticketService.downloadTicketPDF).toHaveBeenCalledWith('t1'));
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Erreur lors du téléchargement du billet'),
    );
  });
});
