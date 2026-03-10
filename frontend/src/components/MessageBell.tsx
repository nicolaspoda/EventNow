import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import messageService, { type Conversation, ConversationType } from '../services/messageService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function MessageBell() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isOnMessagesPage = location.pathname.startsWith('/messages');

  const fetchUnreadCount = async () => {
    try {
      const data = await messageService.getUserConversations();
      setApiError(false);
      const count = data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(count);
    } catch (error) {
      setApiError(true);
      setUnreadCount(0);
      setConversations([]);
    }
  };

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const data = await messageService.getUserConversations();
      setApiError(false);
      setConversations(data.filter((conv) => (conv.unreadCount || 0) > 0).slice(0, 5));
      const count = data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(count);
    } catch (error) {
      setApiError(true);
      setConversations([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    if (apiError) return;
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [apiError]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchConversations();
    }
    setIsOpen(!isOpen);
  };

  const handleConversationClick = async (conversationId: string) => {
    setIsOpen(false);
    navigate(`/messages/${conversationId}`);
  };

  const getConversationPreview = (conversation: Conversation, currentUserId: string) => {
    if (conversation.type === ConversationType.DIRECT) {
      const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
      const u = otherMember?.user;
      const name = !u
        ? 'Utilisateur inconnu'
        : (u.username || 'Utilisateur inconnu');
      return {
        name,
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
    return lastMsg.content.length > 40
      ? lastMsg.content.substring(0, 40) + '...'
      : lastMsg.content;
  };

  const formatMessageDate = (createdAt: string | undefined): string => {
    if (!createdAt) return '—';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '—';
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`relative p-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
          isOnMessagesPage
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
        }`}
        aria-label="Messages"
        aria-expanded={isOpen}
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-96 max-h-[500px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col"
          role="menu"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Messages
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/messages');
              }}
              className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Voir tout
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <svg
                  className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                  {apiError
                    ? 'Impossible de charger les messages. Réessayez plus tard.'
                    : 'Aucun message non lu'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {conversations.map((conversation) => {
                  const preview = getConversationPreview(conversation, user?.id || '');
                  const lastMessage = getLastMessage(conversation);
                  const lastMessageTime = conversation.messages?.[0]?.createdAt
                    ? formatMessageDate(conversation.messages[0].createdAt)
                    : '';

                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => handleConversationClick(conversation.id)}
                        className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors bg-primary-50/50 dark:bg-primary-900/10"
                      >
                        <div className="flex items-start gap-3">
                          {preview.avatar ? (
                            <img
                              src={preview.avatar}
                              alt={preview.name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {preview.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                {preview.name}
                              </p>
                              {(conversation.unreadCount || 0) > 0 && (
                                <span className="px-1.5 py-0.5 bg-error-500 text-white text-xs rounded-full flex-shrink-0">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 truncate">
                              {lastMessage}
                            </p>
                            {lastMessageTime && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                                {lastMessageTime}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
