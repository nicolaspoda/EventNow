import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { promoCodesService } from '../services/promoCodesService';
import type { PromoCode, CreatePromoCodeDto, DiscountType } from '../services/promoCodesService';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import Button from '../components/ui/Button';

export function PromoCodesPage() {
  const { id: eventId } = useParams<{ id: string }>();

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    code: string;
    discountType: DiscountType;
    discountValue: string;
    maxUses: string;
    expiresAt: string;
  }>({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxUses: '',
    expiresAt: '',
  });

  const load = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await promoCodesService.getEventPromoCodes(eventId);
      setPromoCodes(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des codes promo'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    setFormError(null);
    setSubmitting(true);

    try {
      const dto: CreatePromoCodeDto = {
        code: form.code.toUpperCase(),
        eventId,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        ...(form.maxUses ? { maxUses: Number(form.maxUses) } : {}),
        ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {}),
      };

      await promoCodesService.createPromoCode(dto);
      setShowModal(false);
      setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', expiresAt: '' });
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Erreur lors de la création du code promo'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Désactiver ce code promo ?')) return;
    setDeletingId(id);
    try {
      await promoCodesService.deletePromoCode(id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la désactivation'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 dark:border-primary-400" role="status" />
          <span className="sr-only">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to={`/dashboard/events/${eventId}/stats`}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              ← Retour aux statistiques
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Codes promo
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
            Gérez les codes de réduction pour cet événement
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Créer un code promo
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Promo codes table */}
      {promoCodes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="mx-auto h-14 w-14 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <svg className="h-7 w-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Aucun code promo
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            Créez votre premier code de réduction pour cet événement.
          </p>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Créer un code promo
          </Button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">Valeur</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">Utilisations</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">Expire le</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {promoCodes.map((pc) => (
                  <tr key={pc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                        {pc.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {pc.discountType === 'PERCENTAGE' ? 'Pourcentage' : 'Montant fixe'}
                    </td>
                    <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100 font-medium">
                      {pc.discountType === 'PERCENTAGE'
                        ? `${pc.discountValue} %`
                        : `${Number(pc.discountValue).toFixed(2)} €`}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {pc.currentUses}
                      {pc.maxUses !== null ? ` / ${pc.maxUses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {pc.expiresAt
                        ? new Date(pc.expiresAt).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          pc.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {pc.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {pc.isActive && (
                        <button
                          onClick={() => handleDelete(pc.id)}
                          disabled={deletingId === pc.id}
                          className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
                        >
                          {deletingId === pc.id ? '...' : 'Désactiver'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Nouveau code promo
              </h2>
              <button
                onClick={() => { setShowModal(false); setFormError(null); }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                aria-label="Fermer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="promo-code" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Code *
                </label>
                <input
                  id="promo-code"
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="EX: SUMMER20"
                  minLength={3}
                  maxLength={20}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="promo-discount-type" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Type de réduction *
                </label>
                <select
                  id="promo-discount-type"
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="PERCENTAGE">Pourcentage (%)</option>
                  <option value="FIXED_AMOUNT">Montant fixe (€)</option>
                </select>
              </div>

              <div>
                <label htmlFor="promo-discount-value" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Valeur *{' '}
                  {form.discountType === 'PERCENTAGE' ? '(entre 1 et 100)' : '(montant en €)'}
                </label>
                <input
                  id="promo-discount-value"
                  type="number"
                  required
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  min={1}
                  max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                  step="0.01"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="promo-max-uses" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Nombre max d'utilisations (optionnel)
                </label>
                <input
                  id="promo-max-uses"
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  min={1}
                  placeholder="Illimité"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="promo-expires-at" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Date d'expiration (optionnel)
                </label>
                <input
                  id="promo-expires-at"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(null); }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
