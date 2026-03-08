import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/useAuth';
import messageService, {
  type Conversation,
  ConversationType,
} from '../../services/messageService';
import { ConversationList } from '../../components/messages/ConversationList';
import { CreateConversationModal } from '../../components/messages/CreateConversationModal';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { api } from '../../services/api';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    loadConversations();
    loadAvailableUsers();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getUserConversations();
      setConversations(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setAvailableUsers(
        response.data.filter((u: any) => u.id !== user?.id),
      );
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
    }
  };

  const handleCreateDirect = async (userId: string) => {
    try {
      const conversation = await messageService.createConversation({
        type: ConversationType.DIRECT,
        memberIds: [userId],
      });
      navigate(`/messages/${conversation.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    try {
      const conversation = await messageService.createConversation({
        type: ConversationType.GROUP,
        name,
        memberIds,
      });
      navigate(`/messages/${conversation.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  if (loading) {
    return <LoadingState message="Chargement des conversations..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadConversations}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Messages
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Gérez vos conversations et messages
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            leftIcon={
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            Nouvelle conversation
          </Button>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-md p-6">
          <ConversationList
            conversations={conversations}
            currentUserId={user?.id || ''}
          />
        </div>
      </div>

      <CreateConversationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateDirect={handleCreateDirect}
        onCreateGroup={handleCreateGroup}
        availableUsers={availableUsers}
      />
    </div>
  );
};
