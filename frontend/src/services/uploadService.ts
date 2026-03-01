import { api } from './api';

export interface UploadImageResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export const uploadService = {
  uploadImage: async (file: File): Promise<UploadImageResult> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<UploadImageResult>(
      '/upload/image',
      formData,
    );
    return response.data;
  },

  uploadMultipleImages: async (
    files: File[],
  ): Promise<UploadImageResult[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    const response = await api.post<UploadImageResult[]>(
      '/upload/images',
      formData,
    );
    return response.data;
  },

  deleteImage: async (publicId: string): Promise<void> => {
    await api.delete('/upload/image', { data: { publicId } });
  },
};
