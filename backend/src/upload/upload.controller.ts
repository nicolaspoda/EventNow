import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadService } from './upload.service';
import { CustomLoggerService } from '../logger/logger.service';

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.join(', ');
  }
  return "Erreur lors de l'upload. Vérifiez vos identifiants Cloudinary et le format de l'image.";
}

const multerOpts = {
  storage: memoryStorage(),
};

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly logger: CustomLoggerService,
  ) {}

  @Post('image')
  @Roles('ORGANIZER', 'USER')
  @UseInterceptors(FileInterceptor('image', multerOpts))
  async uploadSingleImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Aucun fichier fourni. Vérifiez que le champ s\'appelle "image" et que le Content-Type est multipart/form-data.',
      );
    }

    this.uploadService.validateImageFile(file);
    try {
      const result = await this.uploadService.uploadImage(file);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      };
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      this.logger.error(
        `Upload image error: ${message}`,
        (err as Error).stack,
        'UploadController',
      );
      throw new BadRequestException(message);
    }
  }

  @Post('images')
  @Roles('ORGANIZER', 'USER')
  @UseInterceptors(FilesInterceptor('images', 5, multerOpts))
  async uploadMultipleImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    files.forEach((file) => this.uploadService.validateImageFile(file));

    const results = await this.uploadService.uploadMultipleImages(files);

    return results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    }));
  }

  @Delete('image')
  @Roles('ORGANIZER', 'USER')
  async deleteImage(@Body('publicId') publicId: string) {
    if (!publicId) {
      throw new BadRequestException('publicId requis');
    }

    await this.uploadService.deleteImage(publicId);

    return { message: 'Image supprimée avec succès' };
  }
}
