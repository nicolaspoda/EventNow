import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import type { Ticket } from '../types/order.types';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { generateQRCodeDataUrl } from '../utils/qrCode';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import TicketCard from '../components/tickets/TicketCard';
import QRCodeModal from '../components/tickets/QRCodeModal';

const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ticketService.getMyTickets();
      setTickets(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger vos billets'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewQRCode = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
  };

  const handleDownloadQRCode = async (ticket: Ticket) => {
    try {
      const dataUrl = await generateQRCodeDataUrl(ticket.qrCode);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ticket-${ticket.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes billets</h1>
          <LoadingState message="Chargement de vos billets..." />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes billets</h1>
          <ErrorState message={error} onRetry={fetchTickets} />
        </div>
      </main>
    );
  }

  if (tickets.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes billets</h1>
          <EmptyState
            icon={
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            }
            title="Aucun billet"
            message="Vous n'avez pas encore de billets. Explorez nos événements et réservez maintenant !"
            actionLabel="Découvrir les événements"
            onAction={() => navigate('/events')}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes billets</h1>
          <Button variant="ghost" onClick={() => navigate('/events')}>
            ← Retour aux événements
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onViewQRCode={handleViewQRCode}
              onDownload={handleDownloadQRCode}
            />
          ))}
        </div>
      </div>

      {selectedTicket && (
        <QRCodeModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
          onDownload={handleDownloadQRCode}
        />
      )}
    </main>
  );
};

export default MyTicketsPage;
