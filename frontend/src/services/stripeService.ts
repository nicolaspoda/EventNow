import { api } from './api';

export interface StripeConfig {
  publishableKey: string;
}

export const stripeService = {
  async getPublishableKey(): Promise<string> {
    const response = await api.get<StripeConfig>('/config/stripe');
    return response.data.publishableKey;
  },
};
