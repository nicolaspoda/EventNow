import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Conversation } from '../../services/messageService';
import { ConversationType } from '../../services/messageService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUserId,
}) => {
  const navigate = useNavigate();

  const getConversationDisplay = (conversation: Conversation) => {
    if (conversation.type === ConversationType.DIRECT) {
      const otherMember = conversation.members.find(
        (m) => m.userId !== currentUserId,
      );
      return {
        name: otherMember
          ? `${otherMember.user.firstName} ${otherMember.user.lastName}`
          : 'Utilisateur inconnu',
        avatar: otherMember?.user.avatarUrl,
      };
    }
    return {
      name: conversation.name || 'Conversation de groupe',
      avatar: conversation.imageUrl,
    };
  };

  const getLastMessage = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'Aucun message';
    }
    const lastMsg = conversation.messages[0];
    return lastMsg.content.length > 50
      ? lastMsg.content.substring(0, 50) + '...'
      : lastMsg.content;
  };

  const getLastMessageTime = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return '';
    }
    const raw = conversation.messages[0].createdAt ?? (conversation.messages[0] as { created_at?: string }).created_at;
    if (raw == null) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '';
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: fr,
    });
  };

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-lg font-medium">Aucune conversation</p>
        <p className="text-sm mt-2">
          Commencez une nouvelle conversation en cliquant sur le bouton ci-dessus
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const display = getConversationDisplay(conversation);
        const lastMessage = getLastMessage(conversation);
        const lastMessageTime = getLastMessageTime(conversation);
        const hasUnread = (conversation.unreadCount || 0) > 0;

        return (
          <div
            key={conversation.id}
            onClick={() => navigate(`/messages/${conversation.id}`)}
            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
              hasUnread
                ? 'bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            } border border-neutral-200 dark:border-neutral-700`}
          >
            <div className="relative flex-shrink-0">
              {display.avatar ? (
                <img
                  src={display.avatar}
                  alt={display.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                  {display.name.charAt(0).toUpperCase()}
                </div>
              )}
              {hasUnread && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-error-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {conversation.unreadCount}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3
                  className={`font-semibold truncate ${
                    hasUnread
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {display.name}
                </h3>
                {conversation.type === ConversationType.EVENT && (
                  <span className="ml-2 px-2 py-0.5 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs rounded-full">
                    Événement
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm truncate ${
                    hasUnread
                      ? 'text-neutral-700 dark:text-neutral-300 font-medium'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {lastMessage}
                </p>
                {lastMessageTime && (
                  <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                    {lastMessageTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
