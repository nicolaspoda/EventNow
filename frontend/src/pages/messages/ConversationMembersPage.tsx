import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/useAuth';
import messageService, { type Conversation, ConversationType } from '../../services/messageService';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    (err as { response?: { data?: { message?: string } } }).response?.data?.message
  ) {
    return (err as { response?: { data?: { message?: string } } }).response!.data!.message!;
  }
  return fallback;
};

export const ConversationMembersPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  const loadConversation = async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const data = await messageService.getConversation(conversationId);
      setConversation(data);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erreur lors du chargement'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!conversationId) return;

    const confirmMessage =
      memberId === user?.id
        ? 'Êtes-vous sûr de vouloir quitter cette conversation ?'
        : 'Êtes-vous sûr de vouloir retirer ce membre ?';

    if (!confirm(confirmMessage)) return;

    setRemoving(memberId);
    try {
      await messageService.removeMember(conversationId, memberId);
      if (memberId === user?.id) {
        navigate('/messages');
      } else {
        await loadConversation();
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Erreur lors du retrait'));
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return <LoadingState message="Chargement des membres..." />;
  }

  if (error || !conversation) {
    return (
      <ErrorState
        message={error || 'Conversation non trouvée'}
        onRetry={loadConversation}
      />
    );
  }

  const isCreator = conversation.createdBy === user?.id;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/messages/${conversationId}`)}
            className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour à la conversation
          </button>

          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Membres de la conversation
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {conversation.members.length} participant(s)
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-md p-6">
          <div className="space-y-3">
            {conversation.members.map((member) => {
              const isCurrentUser = member.userId === user?.id;
              const canRemove = isCreator || member.userId === user?.id;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-xl"
                >
                  {member.user.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={member.user.username ?? member.user.email ?? 'Membre'}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                      {(member.user.username ?? member.user.email ?? 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {member.user.username ?? member.user.email}
                      {isCurrentUser && (
                        <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
                          (Vous)
                        </span>
                      )}
                      {member.userId === conversation.createdBy && (
                        <span className="ml-2 px-2 py-0.5 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs rounded-full">
                          Créateur
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {member.user.email}
                    </p>
                  </div>
                  {canRemove && conversation.type !== ConversationType.DIRECT && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveMember(member.userId)}
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
      </div>
    </div>
  );
};
