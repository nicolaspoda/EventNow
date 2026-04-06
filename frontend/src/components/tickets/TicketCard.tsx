import React from 'react';
import { Link } from 'react-router-dom';
import type { Ticket } from '../../types/order.types';
import { safeFormat } from '../../utils/date';
import Button from '../ui/Button';

interface TicketCardProps {
  ticket: Ticket;
  onViewQRCode: (ticket: Ticket) => void;
  onDownload: (ticket: Ticket) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onViewQRCode, onDownload }) => {
  const category = ticket.ticketCategory ?? ticket.order?.ticketCategory;
  const event = category?.event;
  const eventDateRaw =
    event?.eventDate ??
    (event as { event_date?: string } | undefined)?.event_date;

  return (
    <div className="glass-card overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Billet #{ticket.id.slice(0, 8)}
          </h3>
          {(ticket.isValidated ?? !!ticket.validatedAt) ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
              Validé
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300">
              Actif
            </span>
          )}
        </div>

        {event && (
          <div className="mb-3">
            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {event.id ? (
                <Link
                  to={`/events/${event.id}`}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                >
                  {event.title}
                </Link>
              ) : (
                event.title
              )}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {safeFormat(eventDateRaw, "EEE d MMM yyyy 'à' HH:mm")}
            </p>
          </div>
        )}

        {category && (
          <div className="mb-4">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {category.name}
            </p>
            {category.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {category.description}
              </p>
            )}
          </div>
        )}

        {ticket.isValidated && ticket.validatedAt && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
            Validé le {new Date(ticket.validatedAt).toLocaleDateString('fr-FR')}
          </p>
        )}

        <div className="space-y-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onViewQRCode(ticket)}
            disabled={ticket.isValidated ?? !!ticket.validatedAt}
            className="w-full"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            {(ticket.isValidated ?? ticket.validatedAt) ? 'Billet utilisé' : 'Afficher le QR code'}
          </Button>
          {!(ticket.isValidated ?? ticket.validatedAt) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(ticket)}
              className="w-full"
            >
              Télécharger
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
