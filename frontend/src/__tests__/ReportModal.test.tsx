import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportModal from '../components/ReportModal';
import { reportsService } from '../services/reportsService';

vi.mock('../services/reportsService', () => ({
  reportsService: {
    createReport: vi.fn(),
  },
}));

function setup(overrides: Partial<React.ComponentProps<typeof ReportModal>> = {}) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const onAlreadyReported = vi.fn();

  const utils = render(
    <ReportModal
      isOpen
      onClose={onClose}
      type="EVENT"
      targetId="event-1"
      targetName="Concert de test"
      onSuccess={onSuccess}
      onAlreadyReported={onAlreadyReported}
      {...overrides}
    />,
  );

  return { ...utils, onClose, onSuccess, onAlreadyReported };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReportModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ReportModal
        isOpen={false}
        onClose={vi.fn()}
        type="EVENT"
        targetId="event-1"
        targetName="Concert de test"
        onSuccess={vi.fn()}
        onAlreadyReported={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the target name and the event-specific reasons', () => {
    setup();

    expect(screen.getByText('Signaler Concert de test')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Événement frauduleux' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Harcèlement' })).not.toBeInTheDocument();
  });

  it('shows user-specific reasons for type="USER"', () => {
    setup({ type: 'USER' });

    expect(screen.getByRole('option', { name: 'Harcèlement' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Événement frauduleux' })).not.toBeInTheDocument();
  });

  it('submits the selected reason and description, then reports success', async () => {
    vi.mocked(reportsService.createReport).mockResolvedValue({} as never);
    const { onClose, onSuccess } = setup();

    fireEvent.change(screen.getByLabelText('Raison du signalement'), {
      target: { value: 'SPAM' },
    });
    fireEvent.change(screen.getByLabelText('Description (optionnel)'), {
      target: { value: 'Ceci est du spam' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));

    await waitFor(() => expect(reportsService.createReport).toHaveBeenCalled());
    expect(reportsService.createReport).toHaveBeenCalledWith({
      type: 'EVENT',
      reason: 'SPAM',
      description: 'Ceci est du spam',
      targetEventId: 'event-1',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(expect.stringContaining('Signalement envoyé'));
  });

  it('shows a generic error message when the submission fails', async () => {
    vi.mocked(reportsService.createReport).mockRejectedValue(new Error('network error'));
    setup();

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Une erreur est survenue. Veuillez réessayer.',
    );
  });

  it('calls onAlreadyReported and closes the modal on a 409 conflict', async () => {
    vi.mocked(reportsService.createReport).mockRejectedValue({
      response: { status: 409 },
    });
    const { onClose, onAlreadyReported } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));

    await waitFor(() => expect(onAlreadyReported).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the cancel button is clicked', () => {
    const { onClose } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('updates the remaining character count as the description changes', () => {
    setup();

    expect(screen.getByText('0/500')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Description (optionnel)'), {
      target: { value: 'abcde' },
    });

    expect(screen.getByText('5/500')).toBeInTheDocument();
  });
});
