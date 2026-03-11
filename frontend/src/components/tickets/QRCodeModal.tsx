import React, { useState, useEffect } from 'react';
import type { Ticket } from '../../types/order.types';
import { generateQRCodeDataUrl } from '../../utils/qrCode';
import Button from '../ui/Button';

interface QRCodeModalProps {
  ticket: Ticket;
  onClose: () => void;
  onDownload: (ticket: Ticket) => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ ticket, onClose, onDownload }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      setLoading(true);
      setError(null);
      try {
        const dataUrl = await generateQRCodeDataUrl(ticket.qrCode);
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch {
        if (!cancelled) {
          setError('Impossible de générer le QR code');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    generate();
    return () => {
      cancelled = true;
    };
  }, [ticket.qrCode]);

  const handleDownload = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `ticket-${ticket.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      onDownload(ticket);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        className="glass-card shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 id="qr-modal-title" className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Votre billet
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label="Fermer"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Présentez ce QR code à l'entrée de l'événement
          </p>
          <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg border-2 border-neutral-200 dark:border-neutral-600 flex items-center justify-center min-h-[256px]">
            {loading && (
              <div className="flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 dark:border-primary-400 mb-2" />
                <span className="text-sm">Génération du QR code...</span>
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            {!loading && qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR Code du billet"
                className="w-64 h-64"
              />
            )}
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Important :</strong> Ce QR code est unique et ne peut être utilisé qu'une seule fois.
            Ne le partagez pas.
          </p>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          Pour saisie manuelle (entrée) :
        </p>
        <div className="flex gap-2 mb-6">
          <code className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded text-xs truncate" title={ticket.qrCode}>
            {ticket.qrCode}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(ticket.qrCode);
            }}
          >
            Copier
          </Button>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Fermer
          </Button>
          <Button
            variant="primary"
            onClick={handleDownload}
            className="flex-1"
            disabled={!qrDataUrl}
          >
            Télécharger
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
