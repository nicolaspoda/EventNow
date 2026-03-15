import React from 'react';
import type { ValidationResponse } from '../../services/validationService';
import { safeFormat } from '../../utils/date';

function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    QR_CODE_INVALID: 'Code QR invalide ou billet inexistant',
    ALREADY_VALIDATED: 'Ce billet a déjà été utilisé',
    ORDER_CANCELLED: 'La commande a été annulée ou remboursée',
    EVENT_ENDED: "L'événement est terminé",
    EVENT_NOT_STARTED: "L'événement n'a pas encore commencé",
    ERROR: 'Erreur technique',
  };
  return labels[reason] ?? reason;
}

interface ValidationResultProps {
  result: ValidationResponse;
}

export const ValidationResult: React.FC<ValidationResultProps> = ({
  result,
}) => {
  const isValid = result.valid;

  // Date de validation : billet > timestamp réponse > maintenant (évite "Date non renseignée")
  const validatedAtRaw =
    (isValid && result.ticket?.validated_at) ||
    result.timestamp ||
    new Date().toISOString();
  const validatedAtLabel = safeFormat(
    validatedAtRaw,
    "d MMM yyyy 'à' HH'h'mm"
  );
  const responseTimeLabel = safeFormat(
    result.timestamp || new Date().toISOString(),
    "d MMM yyyy 'à' HH'h'mm"
  );

  return (
    <div
      className={`p-6 rounded-lg border-4 ${
        isValid
          ? 'bg-green-50 dark:bg-neutral-800 border-green-500 dark:border-green-400'
          : 'bg-red-50 dark:bg-neutral-800 border-red-500 dark:border-red-400'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="text-center mb-4">
        <div
          className={`text-6xl mb-2 ${isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          aria-hidden="true"
        >
          {isValid ? '✓' : '✕'}
        </div>
        <h3
          className={`text-2xl font-bold ${
            isValid
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          }`}
        >
          {result.message}
        </h3>
      </div>

      {isValid && result.ticket && (
        <div className="bg-white dark:bg-neutral-900 rounded p-4 space-y-2 text-neutral-900 dark:text-neutral-100">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-neutral-400">Événement :</span>
            <span className="font-semibold">{result.ticket.event}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-neutral-400">Catégorie :</span>
            <span className="font-semibold">{result.ticket.category}</span>
          </div>
          {result.ticket.holder_email && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-neutral-400">Titulaire :</span>
              <span className="font-semibold text-sm">
                {result.ticket.holder_email}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-neutral-400">Validé le :</span>
            <span className="font-semibold">{validatedAtLabel}</span>
          </div>
        </div>
      )}

      {!isValid && (
        <div className="mt-4 p-3 bg-white dark:bg-neutral-900 rounded text-neutral-900 dark:text-neutral-100">
          <p className="text-sm text-gray-700 dark:text-neutral-300">
            <strong>Raison :</strong> {getReasonLabel(result.reason)}
          </p>
        </div>
      )}

      <p className="text-xs text-center text-gray-500 dark:text-neutral-400 mt-4">
        {responseTimeLabel}
      </p>
    </div>
  );
};
