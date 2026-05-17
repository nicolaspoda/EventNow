import React, { useState } from 'react';
import { reportsService } from '../services/reportsService';
import type { ReportReason } from '../services/reportsService';
import Button from './ui/Button';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'EVENT' | 'USER';
  targetId: string;
  targetName: string;
  onSuccess: (message: string) => void;
  onAlreadyReported: () => void;
}

const EVENT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'INAPPROPRIATE_CONTENT', label: 'Contenu inapproprié' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'FAKE_EVENT', label: 'Événement frauduleux' },
  { value: 'SCAM', label: 'Arnaque' },
  { value: 'OTHER', label: 'Autre' },
];

const USER_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'INAPPROPRIATE_CONTENT', label: 'Contenu inapproprié' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harcèlement' },
  { value: 'SCAM', label: 'Arnaque' },
  { value: 'OTHER', label: 'Autre' },
];

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  type,
  targetId,
  targetName,
  onSuccess,
  onAlreadyReported,
}) => {
  const reasons = type === 'EVENT' ? EVENT_REASONS : USER_REASONS;
  const [reason, setReason] = useState<ReportReason>(reasons[0].value);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await reportsService.createReport({
        type,
        reason,
        description: description.trim() || undefined,
        ...(type === 'EVENT'
          ? { targetEventId: targetId }
          : { targetUserId: targetId }),
      });
      onClose();
      onSuccess('Signalement envoyé. Notre équipe va examiner votre demande.');
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 409) {
        onClose();
        onAlreadyReported();
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />
      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2
          id="report-modal-title"
          className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4"
        >
          Signaler {targetName}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="report-reason"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Raison du signalement
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              disabled={loading}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="report-description"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Description (optionnel)
            </label>
            <textarea
              id="report-description"
              rows={4}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Décrivez le problème..."
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 text-right">
              {description.length}/500
            </p>
          </div>

          {error && (
            <p className="text-sm text-error-600 dark:text-error-400 mb-4" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Envoi...' : 'Envoyer le signalement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
