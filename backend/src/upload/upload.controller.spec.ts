import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CustomLoggerService } from '../logger/logger.service';
import { BadRequestException } from '@nestjs/common';

describe('UploadController', () => {
  let controller: UploadController;

  const mockUploadService = {
    validateImageFile: jest.fn(),
    uploadImage: jest.fn(),
    uploadMultipleImages: jest.fn(),
    deleteImage: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockFile = { buffer: Buffer.from('test'), mimetype: 'image/jpeg', size: 100 } as any;
  const mockUploadResult = { secure_url: 'http://test.com/img.jpg', public_id: 'test/img', width: 800, height: 600 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        { provide: UploadService, useValue: mockUploadService },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    jest.clearAllMocks();
  });

  describe('uploadSingleImage', () => {
    it('should throw BadRequestException if no file provided', async () => {
      await expect(controller.uploadSingleImage(undefined as any)).rejects.toThrow(BadRequestException);
    });

    it('should upload image and return url info', async () => {
      mockUploadService.validateImageFile.mockReturnValue(undefined);
      mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);
      const result = await controller.uploadSingleImage(mockFile);
      expect(result).toEqual({
        url: 'http://test.com/img.jpg',
        publicId: 'test/img',
        width: 800,
        height: 600,
      });
    });

    it('should throw BadRequestException on upload error', async () => {
      mockUploadService.validateImageFile.mockReturnValue(undefined);
      mockUploadService.uploadImage.mockRejectedValue(new Error('Upload failed'));
      await expect(controller.uploadSingleImage(mockFile)).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle non-Error object in upload error', async () => {
      mockUploadService.validateImageFile.mockReturnValue(undefined);
      mockUploadService.uploadImage.mockRejectedValue({ message: ['Error 1', 'Error 2'] });
      await expect(controller.uploadSingleImage(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should handle error with string message', async () => {
      mockUploadService.validateImageFile.mockReturnValue(undefined);
      mockUploadService.uploadImage.mockRejectedValue({ message: 'string error' });
      await expect(controller.uploadSingleImage(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should handle error with no recognizable message', async () => {
      mockUploadService.validateImageFile.mockReturnValue(undefined);
      mockUploadService.uploadImage.mockRejectedValue('unknown error');
      await expect(controller.uploadSingleImage(mockFile)).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadMultipleImages', () => {
    it('should throw BadRequestException if no files provided', async () => {
      await expect(controller.uploadMultipleImages([])).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if files is undefined', async () => {
      await expect(controller.uploadMultipleImages(undefined as any)).rejects.toThrow(BadRequestException);
    });

    it('should upload multiple images', async () => {
      mockUploadService.validateImageFile.mockReturnValue(undefined);
      mockUploadService.uploadMultipleImages.mockResolvedValue([mockUploadResult, mockUploadResult]);
      const result = await controller.uploadMultipleImages([mockFile, mockFile]);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('url');
    });
  });

  describe('deleteImage', () => {
    it('should throw BadRequestException if no publicId', async () => {
      await expect(controller.deleteImage('')).rejects.toThrow(BadRequestException);
    });

    it('should delete image and return success message', async () => {
      mockUploadService.deleteImage.mockResolvedValue(undefined);
      const result = await controller.deleteImage('test/img');
      expect(result).toEqual({ message: 'Image supprimée avec succès' });
    });
  });
});
