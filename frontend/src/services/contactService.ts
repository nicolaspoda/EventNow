import { api } from './api';

export interface ContactDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const contactService = {
  async sendContactMessage(dto: ContactDto): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/contact', dto);
    return response.data;
  },
};
