import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripeService } from '../services/stripeService';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('stripeService.getPublishableKey', () => {
  it('fetches the stripe config and returns the publishable key', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { publishableKey: 'pk_test_123' } });

    const result = await stripeService.getPublishableKey();

    expect(api.get).toHaveBeenCalledWith('/config/stripe');
    expect(result).toBe('pk_test_123');
  });
});
