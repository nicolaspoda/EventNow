import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadService } from '../services/uploadService';
import { api } from '../services/api';
import type { UploadImageResult } from '../services/uploadService';

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const uploadResult: UploadImageResult = {
  url: 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg',
  publicId: 'photo',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('uploadService', () => {
  it('uploadImage posts a FormData containing the file', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: uploadResult });
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

    const result = await uploadService.uploadImage(file);

    expect(api.post).toHaveBeenCalledWith('/upload/image', expect.any(FormData));
    const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(formData.get('image')).toBe(file);
    expect(result).toEqual(uploadResult);
  });

  it('uploadMultipleImages posts a FormData containing all files', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: [uploadResult] });
    const file1 = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
    const file2 = new File(['b'], 'b.jpg', { type: 'image/jpeg' });

    const result = await uploadService.uploadMultipleImages([file1, file2]);

    expect(api.post).toHaveBeenCalledWith('/upload/images', expect.any(FormData));
    const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(formData.getAll('images')).toEqual([file1, file2]);
    expect(result).toEqual([uploadResult]);
  });

  it('deleteImage deletes the image by its Cloudinary public id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await uploadService.deleteImage('photo');

    expect(api.delete).toHaveBeenCalledWith('/upload/image', { data: { publicId: 'photo' } });
  });
});
