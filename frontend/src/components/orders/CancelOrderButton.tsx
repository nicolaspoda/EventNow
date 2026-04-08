import React, { useState } from 'react';
import { orderService } from '../../services/orderService';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Button from '../ui/Button';

interface CancelOrderButtonProps {
  orderId: string;
  eventDate?: string;
  onSuccess: () => void;
}

const CancelOrderButton: React.FC<CancelOrderButtonProps> = ({
  orderId,
  onSuccess,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    setLoading(true);
    setError('');
    try {
      await orderService.requestRefund(orderId);
      setShowModal(false);
      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur lors de l'annulation"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModal(true)}
        className="flex-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
      >
        Annuler la commande
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Annuler cette commande ?</h3>

            <div className="mb-6">
              <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                Vous êtes sur le point d'annuler cette commande. Le
                remboursement sera effectué sous 5 à 10 jours ouvrés.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Attention :</strong> Cette action est irréversible.
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1"
              >
                Conserver ma commande
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleCancel()}
                loading={loading}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                Confirmer l'annulation
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CancelOrderButton;
