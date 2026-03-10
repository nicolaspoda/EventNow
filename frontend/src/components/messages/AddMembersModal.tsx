import React, { useState } from 'react';
import Button from '../ui/Button';
import { UserSearchAutocomplete } from '../user/UserSearchAutocomplete';
import type { SearchUserResult } from '../../types/auth';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMembers: (memberIds: string[]) => Promise<void>;
  currentMemberIds: string[];
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({
  isOpen,
  onClose,
  onAddMembers,
  currentMemberIds,
}) => {
  const [selectedMembers, setSelectedMembers] = useState<SearchUserResult[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const excludeIds = [...currentMemberIds, ...selectedMembers.map((m) => m.id)];

  const handleAddUser = (user: SearchUserResult) => {
    if (selectedMembers.some((m) => m.id === user.id)) return;
    setSelectedMembers((prev) => [...prev, user]);
  };

  const removeMember = (userId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleAdd = async () => {
    if (selectedMembers.length === 0) {
      alert('Veuillez sélectionner au moins un membre');
      return;
    }

    setLoading(true);
    try {
      await onAddMembers(selectedMembers.map((m) => m.id));
      handleClose();
    } catch (error) {
      console.error('Erreur lors de l\'ajout des membres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMembers([]);
    onClose();
  };

  const displayName = (u: SearchUserResult) =>
    [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || '—';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Ajouter des membres
            </h2>
            <button
              onClick={handleClose}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Rechercher par nom d&apos;utilisateur
            </label>
            <UserSearchAutocomplete
              placeholder="Tapez un nom d'utilisateur..."
              navigateOnSelect={false}
              onSelect={handleAddUser}
              excludeIds={excludeIds}
            />
          </div>

          {selectedMembers.length > 0 && (
            <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm text-primary-700 dark:text-primary-300 mb-2">
                {selectedMembers.length} membre(s) sélectionné(s)
              </p>
              <div className="space-y-2">
                {selectedMembers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-primary-200 dark:border-primary-800"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                        {(user.username ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white truncate">
                        @{user.username ?? '—'}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {displayName(user)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(user.id)}
                      className="text-neutral-500 hover:text-red-600 dark:hover:text-red-400 p-1"
                      aria-label="Retirer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMembers.length === 0 && (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-4 text-sm">
              Tapez un nom d&apos;utilisateur ci-dessus pour trouver et ajouter des membres
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleAdd}
            loading={loading}
            disabled={loading || selectedMembers.length === 0}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
};
