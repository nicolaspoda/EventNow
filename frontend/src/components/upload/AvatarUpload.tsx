import { useState, useRef } from 'react';
import { uploadService } from '../../services/uploadService';

interface AvatarUploadProps {
  currentImage?: string | null;
  initials?: string;
  onUploadSuccess: (url: string, publicId: string) => void;
  onDelete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const sizeClasses = {
  sm: 'w-16 h-16 text-xl',
  md: 'w-20 h-20 text-2xl',
  lg: 'w-24 h-24 text-3xl',
};

export function AvatarUpload({
  currentImage,
  initials = '?',
  onUploadSuccess,
  onDelete,
  size = 'md',
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Format invalide (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 2 Mo)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const result = await uploadService.uploadImage(file);
      onUploadSuccess(result.url, result.publicId);
    } catch (err) {
      console.error('Erreur upload avatar:', err);
      setError("Erreur lors de l'upload");
      setPreview(currentImage ?? null);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-lg ring-4 ring-white dark:ring-neutral-800 focus:outline-none focus:ring-primary-500 transition-all relative`}
          aria-label="Changer la photo de profil"
        >
          {preview ? (
            <img
              src={preview}
              alt="Photo de profil"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
              {initials}
            </div>
          )}

          {/* Overlay au hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          {/* Spinner pendant l'upload */}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChange(file);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
        >
          {uploading ? 'Upload...' : 'Changer la photo'}
        </button>
        {preview && onDelete && (
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onDelete();
            }}
            disabled={uploading}
            className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
          >
            Supprimer
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
