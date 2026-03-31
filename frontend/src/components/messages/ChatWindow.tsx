import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../../services/messageService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '../ui/Button';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => Promise<void>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  onLoadMore,
  hasMore = false,
  loading = false,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    } finally {
      setSending(false);
    }
  };

  const triggerSendFromKeyboard = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void triggerSendFromKeyboard();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    const getDate = (msg: Message): Date | null => {
      const raw = (msg as Message & { created_at?: string }).createdAt
        ?? (msg as Message & { created_at?: string }).created_at;
      if (raw == null) return null;
      const parsed = typeof raw === 'string' || typeof raw === 'number' ? new Date(raw) : null;
      return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    };
    messages.forEach((msg) => {
      const parsed = getDate(msg);
      const date =
        parsed
          ? format(parsed, 'dd MMMM yyyy', { locale: fr })
          : 'Date inconnue';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {hasMore && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={loading}
            >
              {loading ? 'Chargement...' : 'Charger plus de messages'}
            </Button>
          </div>
        )}

        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs rounded-full">
                {date}
              </span>
            </div>

            {msgs.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const showAvatar =
                index === 0 ||
                msgs[index - 1].senderId !== message.senderId;
              const showName =
                !isOwn &&
                (index === 0 || msgs[index - 1].senderId !== message.senderId);

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <div
                    className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isOwn && (
                      <div className="flex-shrink-0">
                        {showAvatar ? (
                          message.sender.avatarUrl ? (
                            <img
                              src={message.sender.avatarUrl}
                            alt={message.sender.username || message.sender.email || 'Expéditeur'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                            {(message.sender.username?.charAt(0) ?? message.sender.email?.charAt(0) ?? '?').toUpperCase()}
                            </div>
                          )
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </div>
                    )}

                    <div>
                      {showName && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 px-3">
                          {message.sender.username || message.sender.email || 'Expéditeur'}
                        </p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn
                              ? 'text-primary-100'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {(() => {
                            const raw = (message as Message & { created_at?: string }).createdAt
                              ?? (message as Message & { created_at?: string }).created_at;
                            if (raw == null) return '—';
                            const parsed = typeof raw === 'string' || typeof raw === 'number' ? new Date(raw) : null;
                            return parsed && !Number.isNaN(parsed.getTime())
                              ? format(parsed, 'HH:mm', { locale: fr })
                              : '—';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="p-4 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700"
      >
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écrivez votre message..."
            className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 resize-none"
            rows={1}
            style={{
              minHeight: '42px',
              maxHeight: '120px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!newMessage.trim() || sending}
            loading={sending}
            ariaLabel="Envoyer le message"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
};
