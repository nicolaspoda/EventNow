import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvatarUpload } from '../components/upload/AvatarUpload';
import { uploadService } from '../services/uploadService';

vi.mock('../services/uploadService', () => ({
  uploadService: {
    uploadImage: vi.fn(),
  },
}));

function makeFile(name: string, type: string, sizeBytes = 1024): File {
  return new File(['x'.repeat(sizeBytes)], name, { type });
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AvatarUpload', () => {
  it('shows the initials when there is no current image', () => {
    render(<AvatarUpload initials="AB" onUploadSuccess={vi.fn()} />);

    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('shows the current image instead of initials', () => {
    render(
      <AvatarUpload currentImage="https://cdn.example.com/avatar.png" onUploadSuccess={vi.fn()} />,
    );

    expect(screen.getByAltText('Photo de profil')).toHaveAttribute(
      'src',
      'https://cdn.example.com/avatar.png',
    );
  });

  it('rejects an invalid file type', () => {
    const { container } = render(<AvatarUpload onUploadSuccess={vi.fn()} />);

    fireEvent.change(getFileInput(container), {
      target: { files: [makeFile('doc.pdf', 'application/pdf')] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Format invalide (JPEG, PNG, WebP)');
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
  });

  it('rejects a file bigger than 2 Mo', () => {
    const { container } = render(<AvatarUpload onUploadSuccess={vi.fn()} />);

    fireEvent.change(getFileInput(container), {
      target: { files: [makeFile('big.png', 'image/png', 3 * 1024 * 1024)] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Fichier trop volumineux (max 2 Mo)');
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
  });

  it('uploads a valid file and calls onUploadSuccess', async () => {
    vi.mocked(uploadService.uploadImage).mockResolvedValue({
      url: 'https://cdn.example.com/new.png',
      publicId: 'pub1',
    });
    const onUploadSuccess = vi.fn();
    const { container } = render(<AvatarUpload onUploadSuccess={onUploadSuccess} />);

    fireEvent.change(getFileInput(container), {
      target: { files: [makeFile('avatar.png', 'image/png')] },
    });

    await waitFor(() =>
      expect(onUploadSuccess).toHaveBeenCalledWith('https://cdn.example.com/new.png', 'pub1'),
    );
  });

  it('shows a generic error message when the upload fails', async () => {
    vi.mocked(uploadService.uploadImage).mockRejectedValue(new Error('boom'));
    const { container } = render(
      <AvatarUpload currentImage="https://cdn.example.com/old.png" onUploadSuccess={vi.fn()} />,
    );

    fireEvent.change(getFileInput(container), {
      target: { files: [makeFile('avatar.png', 'image/png')] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent("Erreur lors de l'upload");
  });

  it('does not show a delete button when there is no preview', () => {
    render(<AvatarUpload onUploadSuccess={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
  });

  it('shows a delete button when there is a preview and onDelete is provided', () => {
    render(
      <AvatarUpload
        currentImage="https://cdn.example.com/avatar.png"
        onUploadSuccess={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Supprimer')).toBeInTheDocument();
  });

  it('does not show a delete button when onDelete is not provided, even with a preview', () => {
    render(
      <AvatarUpload currentImage="https://cdn.example.com/avatar.png" onUploadSuccess={vi.fn()} />,
    );
    expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
  });

  it('calls onDelete and clears the preview when delete is clicked', () => {
    const onDelete = vi.fn();
    render(
      <AvatarUpload
        currentImage="https://cdn.example.com/avatar.png"
        onUploadSuccess={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByText('Supprimer'));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.queryByAltText('Photo de profil')).not.toBeInTheDocument();
  });
});
