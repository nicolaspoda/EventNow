import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageUpload } from '../components/upload/ImageUpload';
import { uploadService } from '../services/uploadService';

vi.mock('../services/uploadService', () => ({
  uploadService: {
    uploadImage: vi.fn(),
  },
}));

function makeFile(name: string, type: string, sizeBytes = 1024): File {
  const file = new File(['x'.repeat(sizeBytes)], name, { type });
  return file;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ImageUpload - empty state', () => {
  it('shows the drop-zone helper text and label by default', () => {
    render(<ImageUpload onUploadSuccess={vi.fn()} />);

    expect(screen.getByText("Image de l'événement")).toBeInTheDocument();
    expect(screen.getByText('Cliquez ou glissez-déposez une image')).toBeInTheDocument();
    expect(screen.getByText('JPEG, PNG ou WebP — max 5 Mo')).toBeInTheDocument();
  });

  it('hides the helper text when hideEmptyHelperText is true', () => {
    render(<ImageUpload onUploadSuccess={vi.fn()} hideEmptyHelperText />);

    expect(screen.queryByText('Cliquez ou glissez-déposez une image')).not.toBeInTheDocument();
  });

  it('shows a custom label and max size', () => {
    render(<ImageUpload onUploadSuccess={vi.fn()} label="Photo du groupe" maxSize={2} />);

    expect(screen.getByText('Photo du groupe')).toBeInTheDocument();
    expect(screen.getByText('JPEG, PNG ou WebP — max 2 Mo')).toBeInTheDocument();
  });
});

describe('ImageUpload - validation', () => {
  it('rejects an invalid file type without calling the upload service', () => {
    const { container } = render(<ImageUpload onUploadSuccess={vi.fn()} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('doc.pdf', 'application/pdf')] } });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Veuillez sélectionner une image (JPEG, PNG, WebP)',
    );
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
  });

  it('rejects a file exceeding maxSize', () => {
    const { container } = render(<ImageUpload onUploadSuccess={vi.fn()} maxSize={1} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = makeFile('photo.png', 'image/png', 2 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Fichier trop volumineux. Taille maximale : 1 Mo',
    );
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
  });
});

describe('ImageUpload - upload flow', () => {
  it('uploads a valid file and calls onUploadSuccess', async () => {
    vi.mocked(uploadService.uploadImage).mockResolvedValue({
      url: 'https://cdn.example.com/img.png',
      publicId: 'pub123',
    });
    const onUploadSuccess = vi.fn();
    const { container } = render(<ImageUpload onUploadSuccess={onUploadSuccess} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('photo.png', 'image/png')] } });

    await waitFor(() =>
      expect(onUploadSuccess).toHaveBeenCalledWith('https://cdn.example.com/img.png', 'pub123'),
    );
  });

  it('shows an error and reverts the preview when the upload fails generically', async () => {
    vi.mocked(uploadService.uploadImage).mockRejectedValue(new Error('network error'));
    const { container } = render(<ImageUpload onUploadSuccess={vi.fn()} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('photo.png', 'image/png')] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Erreur lors de l'upload de l'image",
    );
  });

  it('shows a session-expired message on a 401 error', async () => {
    vi.mocked(uploadService.uploadImage).mockRejectedValue({
      response: { status: 401 },
    });
    const { container } = render(<ImageUpload onUploadSuccess={vi.fn()} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('photo.png', 'image/png')] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Session expirée ou non connecté. Veuillez vous reconnecter puis réessayer.',
    );
  });

  it('shows the backend message when present', async () => {
    vi.mocked(uploadService.uploadImage).mockRejectedValue({
      response: { data: { message: 'Fichier corrompu' } },
    });
    const { container } = render(<ImageUpload onUploadSuccess={vi.fn()} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('photo.png', 'image/png')] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Fichier corrompu');
  });

  it('shows a "change image" button once a preview exists and upload is done', async () => {
    vi.mocked(uploadService.uploadImage).mockResolvedValue({
      url: 'https://cdn.example.com/img.png',
      publicId: 'pub123',
    });
    const { container } = render(<ImageUpload onUploadSuccess={vi.fn()} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('photo.png', 'image/png')] } });

    expect(await screen.findByRole('button', { name: "Changer l'image" })).toBeInTheDocument();
  });
});
