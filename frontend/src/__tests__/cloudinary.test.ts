import { describe, it, expect } from 'vitest';
import { getCloudinarySrcSet } from '../utils/cloudinary';

describe('getCloudinarySrcSet', () => {
  it('returns null for an empty imageUrl', () => {
    expect(getCloudinarySrcSet('')).toBeNull();
  });

  it('returns null for a non-Cloudinary URL', () => {
    expect(getCloudinarySrcSet('https://example.com/img.png')).toBeNull();
  });

  it('returns transformed URLs for a Cloudinary URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg';
    const result = getCloudinarySrcSet(url);
    expect(result).not.toBeNull();
    expect(result?.src).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_600,h_400,c_fill/v1/photo.jpg',
    );
    expect(result?.srcSet).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/v1/photo.jpg 300w, ' +
        'https://res.cloudinary.com/demo/image/upload/w_600,h_400,c_fill/v1/photo.jpg 600w, ' +
        `${url} 1200w`,
    );
    expect(result?.sizes).toBe(
      '(max-width: 640px) 300px, (max-width: 1024px) 600px, 1200px',
    );
  });
});
