import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contactService } from '../services/contactService';
import { api } from '../services/api';
import type { ContactDto } from '../services/contactService';

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('contactService', () => {
  it('sends the contact message and returns the confirmation', async () => {
    const dto: ContactDto = {
      name: 'Jean Dupont',
      email: 'jean@test.com',
      subject: 'Question',
      message: 'Bonjour, une question sur mon billet.',
    };
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'Votre message a bien été envoyé.' } });

    const result = await contactService.sendContactMessage(dto);

    expect(api.post).toHaveBeenCalledWith('/contact', dto);
    expect(result).toEqual({ message: 'Votre message a bien été envoyé.' });
  });
});
