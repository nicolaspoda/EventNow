import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '../logger/logger.service';
import { BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

type UploadCallback = (error: any, result: any) => void;

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

jest.mock('streamifier', () => ({
  createReadStream: jest.fn(() => ({
    pipe: jest.fn(),
  })),
}));

describe('UploadService', () => {
  let service: UploadService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: 'testcloud',
        CLOUDINARY_API_KEY: 'test-key',
        CLOUDINARY_API_SECRET: 'test-secret',
      };
      return config[key];
    }),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should configure cloudinary with valid credentials', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'mycloud';
        if (key === 'CLOUDINARY_API_KEY') return 'key';
        if (key === 'CLOUDINARY_API_SECRET') return 'secret';
        return null;
      });
      expect(() => service.onModuleInit()).not.toThrow();
      expect(cloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'mycloud',
        api_key: 'key',
        api_secret: 'secret',
      });
    });

    it('should throw if cloudinary vars are missing', () => {
      mockConfigService.get.mockReturnValue(null);
      expect(() => service.onModuleInit()).toThrow('Variables Cloudinary manquantes');
    });

    it('should throw if cloud name is "Root"', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'Root';
        return 'val';
      });
      expect(() => service.onModuleInit()).toThrow('ne doit pas être');
    });
  });

  describe('uploadImage', () => {
    it('should throw BadRequestException if no file buffer', async () => {
      await expect(service.uploadImage({ buffer: null } as any)).rejects.toThrow(BadRequestException);
    });

    it('should upload image successfully', async () => {
      const mockUploadResult = { secure_url: 'http://test.com/img.jpg', public_id: 'test/img' };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts: any, callback: UploadCallback) => {
          callback(null, mockUploadResult);
          return { on: jest.fn() };
        },
      );
      (streamifier.createReadStream as jest.Mock).mockReturnValue({ pipe: jest.fn() });

      const file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg', size: 100 } as any;
      const result = await service.uploadImage(file, 'events');
      expect(result).toEqual(mockUploadResult);
    });

    it('should reject on cloudinary error', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts: any, callback: UploadCallback) => {
          callback({ message: 'Upload failed' }, null);
          return { on: jest.fn() };
        },
      );
      (streamifier.createReadStream as jest.Mock).mockReturnValue({ pipe: jest.fn() });

      const file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg', size: 100 } as any;
      await expect(service.uploadImage(file)).rejects.toThrow('Upload failed');
    });
  });

  describe('uploadMultipleImages', () => {
    it('should upload multiple images', async () => {
      const mockResult = { secure_url: 'http://test.com/img.jpg', public_id: 'test/img' };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts: any, callback: UploadCallback) => {
          callback(null, mockResult);
          return { on: jest.fn() };
        },
      );
      (streamifier.createReadStream as jest.Mock).mockReturnValue({ pipe: jest.fn() });

      const files = [
        { buffer: Buffer.from('test1'), mimetype: 'image/jpeg', size: 100 },
        { buffer: Buffer.from('test2'), mimetype: 'image/png', size: 200 },
      ] as any;
      const results = await service.uploadMultipleImages(files);
      expect(results).toHaveLength(2);
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });
      await service.deleteImage('test/img');
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test/img');
    });

    it('should throw BadRequestException on delete error', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(new Error('Delete failed'));
      await expect(service.deleteImage('test/img')).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('extractPublicId', () => {
    it('should extract public id from cloudinary URL', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/v1234567890/events/my-image.jpg';
      const result = service.extractPublicId(url);
      expect(result).toBe('events/my-image');
    });

    it('should return empty string if no match', () => {
      const result = service.extractPublicId('https://not-a-cloudinary-url.com/img');
      expect(result).toBe('');
    });
  });

  describe('validateImageFile', () => {
    it('should pass for valid JPEG file', () => {
      const file = { mimetype: 'image/jpeg', size: 1000 } as any;
      expect(() => service.validateImageFile(file)).not.toThrow();
    });

    it('should pass for valid PNG file', () => {
      const file = { mimetype: 'image/png', size: 1000 } as any;
      expect(() => service.validateImageFile(file)).not.toThrow();
    });

    it('should pass for valid WebP file', () => {
      const file = { mimetype: 'image/webp', size: 1000 } as any;
      expect(() => service.validateImageFile(file)).not.toThrow();
    });

    it('should throw BadRequestException for invalid mime type', () => {
      const file = { mimetype: 'application/pdf', size: 100 } as any;
      expect(() => service.validateImageFile(file)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for file too large', () => {
      const file = { mimetype: 'image/jpeg', size: 6 * 1024 * 1024 } as any;
      expect(() => service.validateImageFile(file)).toThrow(BadRequestException);
    });
  });
});
