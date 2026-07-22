import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { CloudinaryProvider } from './cloudinary.config';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
  },
}));

describe('CloudinaryProvider', () => {
  it('configures the cloudinary SDK from the ConfigService values', () => {
    const mockConfigService = {
      get: jest.fn((key: string) => `${key}-value`),
    } as unknown as ConfigService;

    CloudinaryProvider.useFactory(mockConfigService);

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'CLOUDINARY_CLOUD_NAME-value',
      api_key: 'CLOUDINARY_API_KEY-value',
      api_secret: 'CLOUDINARY_API_SECRET-value',
    });
  });

  it('declares the correct provider token and injection', () => {
    expect(CloudinaryProvider.provide).toBe('CLOUDINARY');
    expect(CloudinaryProvider.inject).toEqual([ConfigService]);
  });
});
