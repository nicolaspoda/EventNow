import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ValidationResult } from '../components/staff/ValidationResult';
import type { ValidationResponse } from '../services/validationService';

describe('ValidationResult - valid ticket', () => {
  const result: ValidationResponse = {
    valid: true,
    reason: '',
    message: 'Billet validé avec succès',
    ticket: {
      event: 'Concert de jazz',
      category: 'Standard',
      holder_email: 'bob@example.com',
      validated_at: '2026-01-01T14:30:00.000Z',
    },
    timestamp: '2026-01-01T14:30:00.000Z',
  };

  it('shows the success message and a status role', () => {
    render(<ValidationResult result={result} />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Billet validé avec succès');
  });

  it('shows the event, category and holder details', () => {
    render(<ValidationResult result={result} />);

    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('does not show a holder row when there is no holder email', () => {
    render(
      <ValidationResult
        result={{ ...result, ticket: { ...result.ticket!, holder_email: undefined } }}
      />,
    );

    expect(screen.queryByText('Titulaire :')).not.toBeInTheDocument();
  });

  it('does not show the "reason" block for a valid ticket', () => {
    render(<ValidationResult result={result} />);

    expect(screen.queryByText('Raison :')).not.toBeInTheDocument();
  });
});

describe('ValidationResult - invalid ticket', () => {
  it.each([
    ['QR_CODE_INVALID', 'Code QR invalide ou billet inexistant'],
    ['ALREADY_VALIDATED', 'Ce billet a déjà été utilisé'],
    ['ORDER_CANCELLED', 'La commande a été annulée ou remboursée'],
    ['EVENT_ENDED', "L'événement est terminé"],
    ['EVENT_NOT_STARTED', "L'événement n'a pas encore commencé"],
    ['ERROR', 'Erreur technique'],
  ])('shows the label for reason %s', (reason, label) => {
    render(
      <ValidationResult
        result={{
          valid: false,
          reason,
          message: 'Échec de la validation',
          timestamp: '2026-01-01T14:30:00.000Z',
        }}
      />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('falls back to the raw reason string for an unknown reason code', () => {
    render(
      <ValidationResult
        result={{
          valid: false,
          reason: 'SOME_UNKNOWN_REASON',
          message: 'Échec',
          timestamp: '2026-01-01T14:30:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('SOME_UNKNOWN_REASON')).toBeInTheDocument();
  });

  it('does not show ticket details for an invalid result', () => {
    render(
      <ValidationResult
        result={{
          valid: false,
          reason: 'QR_CODE_INVALID',
          message: 'Échec',
          timestamp: '2026-01-01T14:30:00.000Z',
        }}
      />,
    );

    expect(screen.queryByText('Événement :')).not.toBeInTheDocument();
  });
});
