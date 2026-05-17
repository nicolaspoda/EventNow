import React, { useState } from 'react';
import type { Poll } from '../../services/pollsService';
import { pollsService } from '../../services/pollsService';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Button from '../ui/Button';

interface Props {
  eventId: string;
  onClose: () => void;
  onCreate: (poll: Poll) => void;
}

const CreatePollModal: React.FC<Props> = ({ eventId, onClose, onCreate }) => {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [closesAt, setClosesAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOption = () => {
    if (options.length < 10) {
      setOptions((prev) => [...prev, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    const newOptions = [...options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOptions.length) return;
    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      setError('Veuillez saisir au moins 2 options.');
      return;
    }

    setLoading(true);
    try {
      const poll = await pollsService.createPoll(eventId, {
        question: question.trim(),
        description: description.trim() || undefined,
        options: validOptions,
        multipleChoice,
        closesAt: closesAt || undefined,
      });
      onCreate(poll);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la création du sondage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-poll-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />
      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2
            id="create-poll-modal-title"
            className="text-lg font-bold text-neutral-900 dark:text-neutral-100"
          >
            Créer un sondage
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Question */}
          <div>
            <label
              htmlFor="poll-question"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Question <span className="text-error-500">*</span>
            </label>
            <textarea
              id="poll-question"
              rows={2}
              maxLength={300}
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              placeholder="Quelle date vous convient ?"
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 text-right">
              {question.length}/300
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="poll-description"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Description (optionnel)
            </label>
            <textarea
              id="poll-description"
              rows={2}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Précisez votre question si nécessaire..."
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Options */}
          <div>
            <p className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Options <span className="text-error-500">*</span>
              <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500 ml-1">
                (min. 2, max. 10)
              </span>
            </p>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveOption(index, 'up')}
                      disabled={index === 0 || loading}
                      aria-label="Déplacer vers le haut"
                      className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveOption(index, 'down')}
                      disabled={index === options.length - 1 || loading}
                      aria-label="Déplacer vers le bas"
                      className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    disabled={loading}
                    maxLength={100}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2 || loading}
                    aria-label={`Supprimer l'option ${index + 1}`}
                    className="text-neutral-400 hover:text-error-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                disabled={loading}
                className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded disabled:opacity-50"
              >
                + Ajouter une option
              </button>
            )}
          </div>

          {/* Multiple choice toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Permettre plusieurs réponses
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Les participants peuvent choisir plusieurs options
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={multipleChoice}
              onClick={() => setMultipleChoice((v) => !v)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                multipleChoice ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                  multipleChoice ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Closes at */}
          <div>
            <label
              htmlFor="poll-closes-at"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Date de clôture (optionnel)
            </label>
            <input
              id="poll-closes-at"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              disabled={loading}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && (
            <p className="text-sm text-error-600 dark:text-error-400 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || question.trim().length < 5}
            >
              {loading ? 'Création...' : 'Créer le sondage'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePollModal;
