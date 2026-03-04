import { useState, useRef } from 'react';
import { uploadService } from '../../services/uploadService';

interface ImageUploadProps {
  currentImage?: string;
  onUploadSuccess: (url: string, publicId: string) => void;
  label?: string;
  maxSize?: number;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function ImageUpload({
  currentImage,
  onUploadSuccess,
  label = "Image de l'événement",
  maxSize = 5,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Veuillez sélectionner une image (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`Fichier trop volumineux. Taille maximale : ${maxSize} Mo`);
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
      console.error('Erreur upload:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: unknown; status?: number } }).response;
        if (res?.data) console.error('Réponse backend:', res.data);
        if (res?.status === 401) {
          setError('Session expirée ou non connecté. Veuillez vous reconnecter puis réessayer.');
          setPreview(currentImage ?? null);
          setUploading(false);
          return;
        }
      }
      let msg: string;
      if (err && typeof err === 'object' && 'response' in err) {
        const data = (err as { response?: { data?: unknown } }).response?.data;
        if (data && typeof data === 'object' && 'message' in data) {
          const m = (data as { message: unknown }).message;
          msg = Array.isArray(m) ? m.join(', ') : typeof m === 'string' ? m : '';
        } else {
          msg = '';
        }
      } else {
        msg = '';
      }
      setError(msg || "Erreur lors de l'upload de l'image");
      setPreview(currentImage ?? null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>

      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${
          dragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500'
        }`}
        aria-label={label}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChange(file);
            e.target.value = '';
          }}
          className="sr-only"
          aria-hidden
        />

        {preview ? (
          <div className="relative w-full aspect-square max-h-64 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden flex items-center justify-center">
            <img
              src={preview}
              alt="Aperçu"
              className="w-full h-full object-contain rounded"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                <div className="text-white text-center">
                  <div
                    className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"
                    aria-hidden
                  />
                  <p>Upload en cours...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8">
            <span className="text-5xl block mb-4" aria-hidden>
              📷
            </span>
            <p className="text-neutral-600 dark:text-neutral-400 mb-2">
              Cliquez ou glissez-déposez une image
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              JPEG, PNG ou WebP — max {maxSize} Mo
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {typeof error === 'string' ? error : "Erreur lors de l'upload de l'image"}
        </p>
      )}

      {preview && !uploading && (
        <button
          type="button"
          onClick={handleClick}
          className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 text-sm border border-transparent dark:border-neutral-600"
        >
          Changer l'image
        </button>
      )}
    </div>
  );
}
