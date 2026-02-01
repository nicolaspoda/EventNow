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
      } catch (err) {
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
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 id="qr-modal-title" className="text-2xl font-bold text-gray-900">
            Votre billet
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
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
          <p className="text-sm text-gray-600 mb-4">
            Présentez ce QR code à l'entrée de l'événement
          </p>
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex items-center justify-center min-h-[256px]">
            {loading && (
              <div className="flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2" />
                <span className="text-sm">Génération du QR code...</span>
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600" role="alert">
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

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Important :</strong> Ce QR code est unique et ne peut être utilisé qu'une seule fois.
            Ne le partagez pas.
          </p>
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
