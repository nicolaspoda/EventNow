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

  return (
    <div
      className={`p-6 rounded-lg border-4 ${
        isValid
          ? 'bg-green-50 border-green-500'
          : 'bg-red-50 border-red-500'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="text-center mb-4">
        <div className="text-6xl mb-2" aria-hidden="true">
          {isValid ? '✓' : '✕'}
        </div>
        <h3
          className={`text-2xl font-bold ${
            isValid ? 'text-green-800' : 'text-red-800'
          }`}
        >
          {result.message}
        </h3>
      </div>

      {isValid && result.ticket && (
        <div className="bg-white rounded p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Événement :</span>
            <span className="font-semibold">{result.ticket.event}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Catégorie :</span>
            <span className="font-semibold">{result.ticket.category}</span>
          </div>
          {result.ticket.holder_email && (
            <div className="flex justify-between">
              <span className="text-gray-600">Titulaire :</span>
              <span className="font-semibold text-sm">
                {result.ticket.holder_email}
              </span>
            </div>
          )}
          {result.ticket.validated_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Validé à :</span>
              <span className="font-semibold">
                {safeFormat(
                  result.ticket.validated_at,
                  "HH'h'mm"
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {!isValid && (
        <div className="mt-4 p-3 bg-white rounded">
          <p className="text-sm text-gray-700">
            <strong>Raison :</strong> {getReasonLabel(result.reason)}
          </p>
        </div>
      )}

      <p className="text-xs text-center text-gray-500 mt-4">
        {safeFormat(result.timestamp, "d MMM yyyy 'à' HH'h'mm")}
      </p>
    </div>
  );
};
