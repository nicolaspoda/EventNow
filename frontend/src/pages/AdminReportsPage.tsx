import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsService, type Report, type ReportStatus } from '../services/reportsService';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { safeFormat } from '../utils/date';

const REASON_LABELS: Record<string, string> = {
  INAPPROPRIATE_CONTENT: 'Contenu inapproprié',
  SPAM: 'Spam',
  FAKE_EVENT: 'Événement fictif',
  HARASSMENT: 'Harcèlement',
  SCAM: 'Arnaque',
  OTHER: 'Autre',
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'En attente',
  REVIEWED: 'En cours',
  RESOLVED: 'Résolu',
  DISMISSED: 'Rejeté',
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-600',
};

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | ''>('PENDING');
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsService.getAllReports(filterStatus || undefined);
      setReports(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger les signalements'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId: string, status: ReportStatus) => {
    try {
      setActionId(reportId);
      await reportsService.updateReportStatus(reportId, status);
      await fetchReports();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la mise à jour'));
    } finally {
      setActionId(null);
    }
  };

  const handleSuspendEvent = async (report: Report) => {
    if (!report.targetEventId) return;
    const action = window.confirm(
      `Suspendre l'événement "${report.targetEvent?.title}" ? Il ne sera plus visible publiquement.`
    );
    if (!action) return;
    try {
      setActionId(report.id);
      const result = await reportsService.suspendEvent(report.targetEventId);
      const isSuspended = result.status === 'SUSPENDED';
      alert(`Événement ${isSuspended ? 'suspendu' : 'réactivé'} avec succès.`);
      await reportsService.updateReportStatus(report.id, 'RESOLVED');
      await fetchReports();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la suspension'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Modération — Signalements
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {reports.length} signalement{reports.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === s
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'Tous' : STATUS_LABELS[s as ReportStatus]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
          {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="text-center py-12 text-gray-500">Aucun signalement.</div>
      )}

      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status]}`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {report.type === 'EVENT' ? 'Événement' : 'Utilisateur'}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    · {safeFormat(report.createdAt, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>

                <p className="font-semibold text-gray-800 dark:text-white mb-1">
                  {REASON_LABELS[report.reason] ?? report.reason}
                </p>

                {report.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    "{report.description}"
                  </p>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  {report.targetEvent && (
                    <p>
                      Événement :{' '}
                      <Link
                        to={`/events/${report.targetEvent.id}`}
                        className="text-primary-600 hover:underline"
                      >
                        {report.targetEvent.title}
                      </Link>
                    </p>
                  )}
                  {report.targetUser && (
                    <p>
                      Utilisateur signalé :{' '}
                      <span className="font-medium">
                        {report.targetUser.username ?? report.targetUser.email}
                      </span>
                    </p>
                  )}
                  {report.reporter && (
                    <p>
                      Signalé par :{' '}
                      <span className="font-medium">
                        {report.reporter.username ?? report.reporter.email}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {report.status === 'PENDING' && (
                  <button
                    onClick={() => handleStatusChange(report.id, 'REVIEWED')}
                    disabled={actionId === report.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                  >
                    Marquer en cours
                  </button>
                )}

                {report.type === 'EVENT' && report.targetEventId && report.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleSuspendEvent(report)}
                    disabled={actionId === report.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    Suspendre l'événement
                  </button>
                )}

                {report.status !== 'RESOLVED' && report.status !== 'DISMISSED' && (
                  <button
                    onClick={() => handleStatusChange(report.id, 'DISMISSED')}
                    disabled={actionId === report.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    Rejeter
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
