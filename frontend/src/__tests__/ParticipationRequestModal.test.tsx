import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ParticipationRequestModal } from '../components/participation/ParticipationRequestModal';
import { participationService } from '../services/participationService';

vi.mock('../services/participationService', () => ({
  participationService: {
    create: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ParticipationRequestModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ParticipationRequestModal
        eventId="e1"
        eventTitle="Concert"
        isOpen={false}
        onClose={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the event title in the request prompt', () => {
    render(
      <ParticipationRequestModal eventId="e1" eventTitle="Concert de jazz" isOpen onClose={vi.fn()} />,
    );

    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
  });

  it('submits the trimmed message and shows a success state, then auto-closes', async () => {
    vi.mocked(participationService.create).mockResolvedValue({} as never);
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.useFakeTimers();

    render(
      <ParticipationRequestModal
        eventId="e1"
        eventTitle="Concert"
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.change(screen.getByLabelText('Message (optionnel)'), {
      target: { value: '  Hâte d’y être !  ' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Envoyer la demande' }));
    });

    expect(participationService.create).toHaveBeenCalledWith({
      eventId: 'e1',
      message: 'Hâte d’y être !',
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Demande envoyée !')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when the request fails', async () => {
    vi.mocked(participationService.create).mockRejectedValue(new Error('boom'));
    render(<ParticipationRequestModal eventId="e1" eventTitle="Concert" isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la demande' }));

    expect(
      await screen.findByText("Erreur lors de l'envoi de la demande"),
    ).toBeInTheDocument();
  });

  it('shows the remaining character count', () => {
    render(<ParticipationRequestModal eventId="e1" eventTitle="Concert" isOpen onClose={vi.fn()} />);

    expect(screen.getByText('0/1000 caractères')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Message (optionnel)'), {
      target: { value: 'abcde' },
    });

    expect(screen.getByText('5/1000 caractères')).toBeInTheDocument();
  });

  it('calls onClose when cancel or the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ParticipationRequestModal eventId="e1" eventTitle="Concert" isOpen onClose={onClose} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('.fixed.inset-0.bg-black')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
