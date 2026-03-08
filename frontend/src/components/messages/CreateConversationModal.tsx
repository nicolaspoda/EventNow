import React, { useState } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDirect: (userId: string) => Promise<void>;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void>;
  availableUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  }>;
}

export const CreateConversationModal: React.FC<
  CreateConversationModalProps
> = ({ isOpen, onClose, onCreateDirect, onCreateGroup, availableUsers }) => {
  const [conversationType, setConversationType] = useState<'direct' | 'group'>(
    'direct',
  );
  const [selectedUserId, setSelectedUserId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const filteredUsers = availableUsers.filter(
    (user) =>
      (user.firstName?.toLowerCase() ?? '').includes(
        (searchTerm ?? '').toLowerCase(),
      ) ||
      (user.lastName?.toLowerCase() ?? '').includes(
        (searchTerm ?? '').toLowerCase(),
      ) ||
      (user.email?.toLowerCase() ?? '').includes(
        (searchTerm ?? '').toLowerCase(),
      ),
  );

  const handleCreate = async () => {
    setLoading(true);
    try {
      if (conversationType === 'direct') {
        if (!selectedUserId) {
          alert('Veuillez sélectionner un utilisateur');
          return;
        }
        await onCreateDirect(selectedUserId);
      } else {
        if (!groupName.trim()) {
          alert('Veuillez entrer un nom de groupe');
          return;
        }
        if (selectedMemberIds.length === 0) {
          alert('Veuillez sélectionner au moins un membre');
          return;
        }
        await onCreateGroup(groupName, selectedMemberIds);
      }
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConversationType('direct');
    setSelectedUserId('');
    setGroupName('');
    setSelectedMemberIds([]);
    setSearchTerm('');
    onClose();
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Nom du groupe
              </label>
              <Input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Équipe projet, Amis..."
                className="w-full"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {conversationType === 'direct'
                ? 'Sélectionner un utilisateur'
                : 'Sélectionner les membres'}
            </label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full mb-3"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => {
              const isSelected =
                conversationType === 'direct'
                  ? selectedUserId === user.id
                  : selectedMemberIds.includes(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    if (conversationType === 'direct') {
                      setSelectedUserId(user.id);
                    } else {
                      toggleMember(user.id);
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                      : 'bg-neutral-50 dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-2 border-transparent'
                  }`}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Utilisateur'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                      {(user.firstName?.charAt(0) ?? user.email?.charAt(0) ?? '?').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {user.email ?? '—'}
                    </p>
                  </div>
                  {isSelected && (
                    <svg
                      className="w-6 h-6 text-primary-600 dark:text-primary-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
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
                ? !selectedUserId
                : !groupName.trim() || selectedMemberIds.length === 0)
            }
          >
            Créer
          </Button>
        </div>
      </div>
    </div>
  );
};
