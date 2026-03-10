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
      const u = otherMember?.user;
      const name = !u
        ? 'Utilisateur inconnu'
        : (u.username || 'Utilisateur inconnu');
      return {
        name,
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
    <div className="px-6 py-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
      {/* Gauche : bouton retour */}
      <div className="flex items-center shrink-0 min-w-0">
        <button
          onClick={() => navigate('/messages')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700/80 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-200 hover:text-neutral-800 dark:hover:text-white border border-neutral-200/80 dark:border-neutral-600/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800"
          title="Retour aux messages"
          aria-label="Retour aux messages"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-white/60 dark:bg-neutral-600/60">
            <svg
              className="w-4 h-4 shrink-0 text-current"
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
          </span>
          <span className="hidden sm:inline text-sm font-medium">Retour aux messages</span>
        </button>
      </div>

      {/* Centre : avatar + nom du groupe + participants */}
      <div className="flex-1 flex justify-center items-center gap-3 min-w-0 px-4">
        {display.avatar ? (
          <img
            src={display.avatar}
            alt={display.name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {display.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="text-center min-w-0">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
            {display.name}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {display.subtitle}
          </p>
        </div>
      </div>

      {/* Droite : menu (ou espace réservé pour garder le centre centré) */}
      <div className="flex items-center justify-end shrink-0 w-[120px] sm:w-[140px] relative">
        {conversation.type !== ConversationType.DIRECT && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
