/**
 * Si l'URL est une URL Cloudinary, retourne des URLs transformées pour srcset.
 * Sinon retourne undefined (utilisation de l'URL telle quelle).
 */
export function getCloudinarySrcSet(imageUrl: string): {
  src: string;
  srcSet: string;
  sizes: string;
} | null {
  if (!imageUrl || !imageUrl.includes('res.cloudinary.com')) {
    return null;
  }
  const thumb = imageUrl.replace(
    '/upload/',
    '/upload/w_300,h_200,c_fill/',
  );
  const medium = imageUrl.replace(
    '/upload/',
    '/upload/w_600,h_400,c_fill/',
  );
  return {
    src: medium,
    srcSet: `${thumb} 300w, ${medium} 600w, ${imageUrl} 1200w`,
    sizes: '(max-width: 640px) 300px, (max-width: 1024px) 600px, 1200px',
  };
}
