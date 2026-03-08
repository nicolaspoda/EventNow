import React, { useState } from 'react';
import Button from '../ui/Button';
import type { ConversationMember } from '../../services/messageService';

interface ConversationMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ConversationMember[];
  currentUserId: string;
  createdBy?: string;
  onRemoveMember?: (memberId: string) => Promise<void>;
}

export const ConversationMembersModal: React.FC<
  ConversationMembersModalProps
> = ({ isOpen, onClose, members, currentUserId, createdBy, onRemoveMember }) => {
  const [removing, setRemoving] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCreator = createdBy === currentUserId;

  const handleRemove = async (memberId: string) => {
    if (!onRemoveMember) return;

    const confirmMessage =
      memberId === currentUserId
        ? 'Êtes-vous sûr de vouloir quitter cette conversation ?'
        : 'Êtes-vous sûr de vouloir retirer ce membre ?';

    if (!confirm(confirmMessage)) return;

    setRemoving(memberId);
    try {
      await onRemoveMember(memberId);
      if (memberId === currentUserId) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors du retrait du membre:', error);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Membres ({members.length})
            </h2>
            <button
              onClick={onClose}
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
          <div className="space-y-3">
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const canRemove =
                onRemoveMember &&
                (isCreator || member.userId === currentUserId);

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-xl"
                >
                  {member.user.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={`${member.user.firstName} ${member.user.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                      {member.user.firstName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {member.user.firstName} {member.user.lastName}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                          (Vous)
                        </span>
                      )}
                      {member.userId === createdBy && (
                        <span className="ml-2 px-2 py-0.5 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs rounded-full">
                          Créateur
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {member.user.email}
                    </p>
                  </div>
                  {canRemove && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemove(member.userId)}
                      loading={removing === member.userId}
                      disabled={removing !== null}
                    >
                      {isCurrentUser ? 'Quitter' : 'Retirer'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};
