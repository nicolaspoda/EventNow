import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ValidationsList } from '../components/staff/ValidationsList';
import type { ValidationItem } from '../services/validationService';

function makeValidation(overrides: Partial<ValidationItem> = {}): ValidationItem {
  return {
    id: 'v1',
    qr_code: 'qr-1',
    event: 'Concert de jazz',
    category: 'Standard',
    holder_email: 'bob@example.com',
    validated_at: '2026-01-01T14:30:00.000Z',
    ...overrides,
  };
}

describe('ValidationsList', () => {
  it('shows an empty-state message when there are no validations', () => {
    render(<ValidationsList validations={[]} />);

    expect(screen.getByText('Aucune validation enregistrée.')).toBeInTheDocument();
  });

  it('renders a row per validation with its event, category and holder', () => {
    render(
      <ValidationsList
        validations={[
          makeValidation({ id: 'v1', event: 'Concert de jazz' }),
          makeValidation({ id: 'v2', event: 'Festival rock', category: 'VIP', holder_email: 'carol@example.com' }),
        ]}
      />,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText('Festival rock')).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('carol@example.com')).toBeInTheDocument();
  });
});
