import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Conversation } from '../../types/message.types';
import { ConversationType } from '../../types/message.types';

interface ConversationHeaderProps {
  conversation: Conversation;
  currentUserId: string;
  onAddMembers?: () => void;
  onEditConversation?: () => void;
  onDeleteConversation?: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  currentUserId,
  onAddMembers,
  onEditConversation,
  onDeleteConversation,
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const getConversationDisplay = () => {
    if (conversation.type === ConversationType.DIRECT) {
      const otherMember = conversation.members.find(
        (m) => m.userId !== currentUserId,
      );
      return {
        name: otherMember
          ? `${otherMember.user.firstName} ${otherMember.user.lastName}`
          : 'Utilisateur inconnu',
        avatar: otherMember?.user.avatarUrl,
        subtitle: `${conversation.members.length} participants`,
      };
    }
    return {
      name: conversation.name || 'Conversation de groupe',
      avatar: conversation.imageUrl,
      subtitle: `${conversation.members.length} participants`,
    };
  };

  const display = getConversationDisplay();
  const isCreator = conversation.createdBy === currentUserId;
  const canManage =
    conversation.type !== ConversationType.DIRECT && isCreator;

  return (
    <div className="px-6 py-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/messages')}
          className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 lg:hidden"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {display.avatar ? (
          <img
            src={display.avatar}
            alt={display.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
            {display.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {display.name}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {display.subtitle}
          </p>
        </div>
      </div>

      {conversation.type !== ConversationType.DIRECT && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-700 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-600 py-1 z-10">
              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate(`/messages/${conversation.id}/members`);
                }}
                className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200"
              >
                Voir les membres
              </button>
              {conversation.type === ConversationType.GROUP && (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onAddMembers?.();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200"
                  >
                    Ajouter des membres
                  </button>
                  {canManage && (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEditConversation?.();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200"
                      >
                        Modifier le groupe
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDeleteConversation?.();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-600 text-error-600 dark:text-error-400"
                      >
                        Supprimer le groupe
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
