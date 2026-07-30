import React, { useRef, useState } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { UserSearchAutocomplete } from '../user/UserSearchAutocomplete';
import type { SearchUserResult } from '../../types/auth';
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDirect: (userId: string) => Promise<void>;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void>;
  currentUserId: string;
}

export const CreateConversationModal: React.FC<
  CreateConversationModalProps
> = ({ isOpen, onClose, onCreateDirect, onCreateGroup, currentUserId }) => {
  const [conversationType, setConversationType] = useState<'direct' | 'group'>(
    'direct',
  );
  const [selectedUser, setSelectedUser] = useState<SearchUserResult | null>(null);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<SearchUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setConversationType('direct');
    setSelectedUser(null);
    setGroupName('');
    setSelectedMembers([]);
    onClose();
  };

  useModalFocusTrap(containerRef, isOpen, handleClose);

  if (!isOpen) return null;

  const excludeIds =
    conversationType === 'direct' && selectedUser
      ? [currentUserId, selectedUser.id]
      : [currentUserId, ...selectedMembers.map((m) => m.id)];

  const handleSelectUser = (user: SearchUserResult) => {
    if (user.id === currentUserId) return;
    if (conversationType === 'direct') {
      setSelectedUser(user);
    } else {
      if (selectedMembers.some((m) => m.id === user.id)) return;
      setSelectedMembers((prev) => [...prev, user]);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      if (conversationType === 'direct') {
        if (!selectedUser) {
          alert('Veuillez sélectionner un utilisateur');
          return;
        }
        await onCreateDirect(selectedUser.id);
      } else {
        if (!groupName.trim()) {
          alert('Veuillez entrer un nom de groupe');
          return;
        }
        if (selectedMembers.length === 0) {
          alert('Veuillez sélectionner au moins un membre');
          return;
        }
        await onCreateGroup(groupName, selectedMembers.map((m) => m.id));
      }
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = (u: SearchUserResult) => u.username ?? '—';

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Nouvelle conversation
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

          <div className="flex gap-2">
            <button
              onClick={() => setConversationType('direct')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                conversationType === 'direct'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
            >
              Message direct
            </button>
            <button
              onClick={() => setConversationType('group')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                conversationType === 'group'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
            >
              Groupe
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {conversationType === 'group' && (
            <div className="mb-4">
              <label htmlFor="group-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Nom du groupe
              </label>
              <Input
                id="group-name"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Équipe projet, Amis..."
                className="w-full"
              />
            </div>
          )}

          <div className="mb-4">
            <p className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {conversationType === 'direct'
                ? 'Rechercher un utilisateur par nom d\'utilisateur'
                : 'Rechercher et ajouter des membres'}
            </p>
            <UserSearchAutocomplete
              placeholder="Tapez un nom d'utilisateur..."
              navigateOnSelect={false}
              onSelect={handleSelectUser}
              excludeIds={excludeIds}
            />
          </div>

          {conversationType === 'direct' && selectedUser && (
            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 flex items-center gap-3">
              {selectedUser.avatarUrl ? (
                <img
                  src={selectedUser.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                  {(selectedUser.username ?? '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 dark:text-white truncate">
                  @{selectedUser.username ?? '—'}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                  {displayName(selectedUser)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-neutral-500 hover:text-red-600 dark:hover:text-red-400 p-1"
                aria-label="Retirer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {conversationType === 'group' && selectedMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {selectedMembers.length} membre(s) sélectionné(s)
              </p>
              {selectedMembers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
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
                    onClick={() =>
                      setSelectedMembers((prev) => prev.filter((m) => m.id !== user.id))
                    }
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
          )}

          {(conversationType === 'direct' ? !selectedUser : selectedMembers.length === 0) && (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-4 text-sm">
              Tapez un nom d&apos;utilisateur ci-dessus pour rechercher
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            loading={loading}
            disabled={
              loading ||
              (conversationType === 'direct'
                ? !selectedUser
                : !groupName.trim() || selectedMembers.length === 0)
            }
          >
            Créer
          </Button>
        </div>
      </div>
    </div>
  );
};
