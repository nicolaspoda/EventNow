import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactPage } from '../pages/ContactPage';
import { contactService } from '../services/contactService';

vi.mock('../services/contactService', () => ({
  contactService: {
    sendContactMessage: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function fillForm() {
  fireEvent.change(screen.getByLabelText(/^Nom/), { target: { value: 'Jean Dupont' } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'jean@test.com' } });
  fireEvent.change(screen.getByLabelText(/^Sujet/), { target: { value: 'Question sur un événement' } });
  fireEvent.change(screen.getByLabelText(/^Message/), {
    target: { value: 'Bonjour, les billets sont-ils remboursables ?' },
  });
}

describe('ContactPage', () => {
  it('renders the contact form', () => {
    render(<ContactPage />);

    expect(screen.getByLabelText(/^Nom/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Sujet/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Message/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument();
  });

  it('submits the form and shows a confirmation message', async () => {
    vi.mocked(contactService.sendContactMessage).mockResolvedValue({
      message: 'Votre message a bien été envoyé.',
    });

    render(<ContactPage />);
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le message' }));

    await waitFor(() =>
      expect(contactService.sendContactMessage).toHaveBeenCalledWith({
        name: 'Jean Dupont',
        email: 'jean@test.com',
        subject: 'Question sur un événement',
        message: 'Bonjour, les billets sont-ils remboursables ?',
      }),
    );

    expect(await screen.findByText('Message envoyé !')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Nom/)).not.toBeInTheDocument();
  });

  it('shows an error message when the submission fails', async () => {
    vi.mocked(contactService.sendContactMessage).mockRejectedValue(new Error('network error'));

    render(<ContactPage />);
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Erreur lors de l'envoi de votre message",
    );
    expect(screen.getByLabelText(/^Nom/)).toBeInTheDocument();
  });
});
