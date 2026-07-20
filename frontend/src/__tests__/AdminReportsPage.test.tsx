import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminReportsPage } from '../pages/AdminReportsPage';
import { reportsService } from '../services/reportsService';
import type { Report, BannedUser } from '../services/reportsService';

vi.mock('../services/reportsService', () => ({
  reportsService: {
    getAllReports: vi.fn(),
    getBannedUsers: vi.fn(),
    updateReportStatus: vi.fn(),
    suspendEvent: vi.fn(),
    banUser: vi.fn(),
  },
}));

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'r1',
    reporterId: 'u1',
    reporter: { id: 'u1', username: 'alice', email: 'alice@example.com' },
    type: 'EVENT',
    reason: 'SPAM',
    description: 'Contenu suspect',
    status: 'PENDING',
    targetUserId: null,
    targetEventId: 'e1',
    targetEvent: { id: 'e1', title: 'Concert de jazz' },
    targetUser: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

function makeBannedUser(overrides: Partial<BannedUser> = {}): BannedUser {
  return {
    id: 'u2',
    username: 'baduser',
    email: 'bad@example.com',
    bannedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(reportsService.getAllReports).mockResolvedValue([]);
  vi.mocked(reportsService.getBannedUsers).mockResolvedValue([]);
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminReportsPage />
    </MemoryRouter>,
  );
}

describe('AdminReportsPage - reports tab', () => {
  it('defaults to the pending-reports filter and fetches accordingly', async () => {
    renderPage();

    await waitFor(() =>
      expect(reportsService.getAllReports).toHaveBeenCalledWith('PENDING'),
    );
  });

  it('shows an empty state when there are no reports', async () => {
    renderPage();

    expect(await screen.findByText('Aucun signalement.')).toBeInTheDocument();
  });

  it('shows an error message when loading fails', async () => {
    vi.mocked(reportsService.getAllReports).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText('Impossible de charger les signalements'),
    ).toBeInTheDocument();
  });

  it('lists a report with its reason, status and target event', async () => {
    vi.mocked(reportsService.getAllReports).mockResolvedValue([makeReport()]);

    renderPage();

    expect(await screen.findByText('Spam')).toBeInTheDocument();
    expect(screen.getByText('En attente', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('"Contenu suspect"')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Concert de jazz' })).toHaveAttribute(
      'href',
      '/events/e1',
    );
  });

  it('changes the status filter and refetches', async () => {
    renderPage();
    await waitFor(() => expect(reportsService.getAllReports).toHaveBeenCalledWith('PENDING'));

    fireEvent.click(screen.getByRole('button', { name: 'Tous' }));

    await waitFor(() => expect(reportsService.getAllReports).toHaveBeenCalledWith(undefined));
  });

  it('marks a pending report as reviewed', async () => {
    vi.mocked(reportsService.getAllReports).mockResolvedValue([makeReport()]);
    vi.mocked(reportsService.updateReportStatus).mockResolvedValue(makeReport({ status: 'REVIEWED' }));

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Marquer en cours' }));

    await waitFor(() =>
      expect(reportsService.updateReportStatus).toHaveBeenCalledWith('r1', 'REVIEWED'),
    );
  });

  it('dismisses a report', async () => {
    vi.mocked(reportsService.getAllReports).mockResolvedValue([makeReport()]);
    vi.mocked(reportsService.updateReportStatus).mockResolvedValue(makeReport({ status: 'DISMISSED' }));

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Rejeter' }));

    await waitFor(() =>
      expect(reportsService.updateReportStatus).toHaveBeenCalledWith('r1', 'DISMISSED'),
    );
  });

  it('suspends the reported event after confirmation', async () => {
    vi.mocked(reportsService.getAllReports).mockResolvedValue([makeReport()]);
    vi.mocked(reportsService.suspendEvent).mockResolvedValue({ id: 'e1', title: 'Concert de jazz', status: 'SUSPENDED' });
    vi.mocked(reportsService.updateReportStatus).mockResolvedValue(makeReport({ status: 'RESOLVED' }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Suspendre l'événement" }));

    await waitFor(() => expect(reportsService.suspendEvent).toHaveBeenCalledWith('e1'));
    expect(window.alert).toHaveBeenCalledWith('Événement suspendu avec succès.');
    expect(reportsService.updateReportStatus).toHaveBeenCalledWith('r1', 'RESOLVED');
  });

  it('does not suspend when the confirmation dialog is cancelled', async () => {
    vi.mocked(reportsService.getAllReports).mockResolvedValue([makeReport()]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Suspendre l'événement" }));

    expect(reportsService.suspendEvent).not.toHaveBeenCalled();
  });

  it('bans a reported user after confirmation', async () => {
    const userReport = makeReport({
      id: 'r2',
      type: 'USER',
      targetEventId: null,
      targetEvent: null,
      targetUserId: 'u3',
      targetUser: { id: 'u3', username: 'troll', email: 'troll@example.com', isBanned: false },
    });
    vi.mocked(reportsService.getAllReports).mockResolvedValue([userReport]);
    vi.mocked(reportsService.banUser).mockResolvedValue({ id: 'u3', username: 'troll', email: 'troll@example.com', isBanned: true });
    vi.mocked(reportsService.updateReportStatus).mockResolvedValue({ ...userReport, status: 'RESOLVED' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Bannir l'utilisateur" }));

    await waitFor(() => expect(reportsService.banUser).toHaveBeenCalledWith('u3'));
    expect(window.alert).toHaveBeenCalledWith('Utilisateur banni avec succès.');
  });

  it('shows a "Banni" badge for an already-banned target user', async () => {
    vi.mocked(reportsService.getAllReports).mockResolvedValue([
      makeReport({
        type: 'USER',
        targetEventId: null,
        targetEvent: null,
        targetUserId: 'u3',
        targetUser: { id: 'u3', username: 'troll', email: 'troll@example.com', isBanned: true },
      }),
    ]);

    renderPage();

    expect(await screen.findByText('Banni')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réactiver le compte' })).toBeInTheDocument();
  });
});

describe('AdminReportsPage - banned accounts tab', () => {
  it('fetches banned users only when switching to that tab', async () => {
    renderPage();
    await waitFor(() => expect(reportsService.getAllReports).toHaveBeenCalled());
    expect(reportsService.getBannedUsers).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Comptes bannis' }));

    await waitFor(() => expect(reportsService.getBannedUsers).toHaveBeenCalled());
  });

  it('shows an empty state when there are no banned accounts', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Comptes bannis' }));

    expect(await screen.findByText('Aucun compte banni.')).toBeInTheDocument();
  });

  it('lists banned users and reactivates one', async () => {
    vi.mocked(reportsService.getBannedUsers).mockResolvedValue([makeBannedUser()]);
    vi.mocked(reportsService.banUser).mockResolvedValue({ id: 'u2', username: 'baduser', email: 'bad@example.com', isBanned: false });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Comptes bannis' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Réactiver le compte' }));

    await waitFor(() => expect(reportsService.banUser).toHaveBeenCalledWith('u2'));
  });

  it('shows an error message when loading banned users fails', async () => {
    vi.mocked(reportsService.getBannedUsers).mockRejectedValue(new Error('boom'));

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Comptes bannis' }));

    expect(
      await screen.findByText('Impossible de charger les comptes bannis'),
    ).toBeInTheDocument();
  });
});
