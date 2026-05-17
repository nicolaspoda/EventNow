import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {}

  onModuleInit() {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Variables Cloudinary manquantes : CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET doivent être définies dans backend/.env',
      );
    }
    if (cloudName === 'Root' || cloudName.toLowerCase() === 'root') {
      throw new Error(
        'CLOUDINARY_CLOUD_NAME ne doit pas être "Root". Collez le vrai Cloud name depuis https://console.cloudinary.com (ex: dxwcehbje) dans backend/.env',
      );
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  /**
   * Upload une image vers Cloudinary
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'events',
  ): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      throw new BadRequestException(
        'Fichier invalide (buffer manquant). Vérifiez que le champ du formulaire s\'appelle "image".',
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
        },
        (error, result) => {
          if (error) return reject(new Error(error.message));
          resolve(result!);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload plusieurs images
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'events',
  ): Promise<UploadApiResponse[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Supprimer une image de Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error(
        `Erreur suppression image: ${(error as Error).message}`,
        (error as Error).stack,
        'UploadService',
      );
      throw new BadRequestException("Erreur lors de la suppression de l'image");
    }
  }

  /**
   * Extraire le public_id depuis une URL Cloudinary
   */
  extractPublicId(url: string): string {
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : '';
  }

  /**
   * Valider un fichier image
   */
  validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format de fichier invalide. Formats acceptés : JPEG, PNG, WebP',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Fichier trop volumineux. Taille maximale : 5MB',
      );
    }
  }
}
