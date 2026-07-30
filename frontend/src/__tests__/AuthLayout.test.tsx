import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AuthLayout } from '../components/AuthLayout';

describe('AuthLayout', () => {
  it('renders the subtitle and the children inside the card', () => {
    render(
      <MemoryRouter>
        <AuthLayout subtitle="Connectez-vous à votre compte">
          <div>Formulaire de connexion</div>
        </AuthLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText('Connectez-vous à votre compte')).toBeInTheDocument();
    expect(screen.getByText('Formulaire de connexion')).toBeInTheDocument();
  });

  it('renders the auth-variant logo with the EventNow title', () => {
    render(
      <MemoryRouter>
        <AuthLayout subtitle="Inscription">
          <div>Contenu</div>
        </AuthLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'EventNow' })).toBeInTheDocument();
  });
});
