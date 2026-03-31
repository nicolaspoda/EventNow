import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/useAuth';
import messageService, {
  type Conversation,
  type Message,
  ConversationType,
} from '../../services/messageService';
import socketService from '../../services/socketService';
import { ChatWindow } from '../../components/messages/ChatWindow';
import { ConversationHeader } from '../../components/messages/ConversationHeader';
import { AddMembersModal } from '../../components/messages/AddMembersModal';
import { EditConversationModal } from '../../components/messages/EditConversationModal';
import { ConversationMembersModal } from '../../components/messages/ConversationMembersModal';
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

export const ConversationPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showEditConversation, setShowEditConversation] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId && user?.id) {
      messageService.markAsRead(conversationId).catch(console.error);
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      console.error('[ConversationPage] No access token found');
      return;
    }

    const initSocket = async () => {
      try {
        if (!socketService.isConnected()) {
          await socketService.connect(token);
        }

        if (conversationId) {
          await socketService.joinConversation(conversationId);
        }
      } catch (error) {
        console.error('[ConversationPage] Socket connection error:', error);
      }
    };

    initSocket();

    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => {
          const messageExists = prev.some((m) => m.id === data.message.id);
          if (messageExists) {
            return prev;
          }
          return [...prev, data.message];
        });

        if (data.message.senderId !== user?.id) {
          messageService.markAsRead(conversationId!).catch(console.error);
        }
      }
    };

    const handleConversationUpdated = (data: { conversationId: string; conversation: Conversation }) => {
      if (data.conversationId === conversationId) {
        setConversation(data.conversation);
      }
    };

    const handleMemberAdded = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId) {
        loadConversation();
      }
    };

    const handleMemberRemoved = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId) {
        if (data.userId === user?.id) {
          navigate('/messages');
        } else {
          loadConversation();
        }
      }
    };

    socketService.on('newMessage', handleNewMessage);
    socketService.on('conversationUpdated', handleConversationUpdated);
    socketService.on('memberAdded', handleMemberAdded);
    socketService.on('memberRemoved', handleMemberRemoved);

    return () => {
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
      socketService.off('newMessage', handleNewMessage);
      socketService.off('conversationUpdated', handleConversationUpdated);
      socketService.off('memberAdded', handleMemberAdded);
      socketService.off('memberRemoved', handleMemberRemoved);
    };
  }, [conversationId, user?.id, navigate]);

  const loadConversation = async () => {
    if (!conversationId) return;
    try {
      const data = await messageService.getConversation(conversationId);
      setConversation(data);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erreur lors du chargement'));
    }
  };

  const loadMessages = async (before?: string) => {
    if (!conversationId) return;
    try {
      setLoading(!before);
      setLoadingMore(!!before);
      const data = await messageService.getMessages(
        conversationId,
        50,
        before,
      );
      if (before) {
        setMessages((prev) => [...data, ...prev]);
      } else {
        setMessages(data);
      }
      setHasMore(data.length === 50);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erreur lors du chargement'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return;
    
    try {
      if (socketService.isConnected()) {
        await socketService.sendMessage(conversationId, content);
      } else {
        const newMessage = await messageService.sendMessage(conversationId, {
          content,
        });
        setMessages((prev) => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('[ConversationPage] Error sending message:', error);
      const newMessage = await messageService.sendMessage(conversationId, {
        content,
      });
      setMessages((prev) => [...prev, newMessage]);
    }
  };

  const handleLoadMore = () => {
    if (messages.length > 0) {
      loadMessages(messages[0].createdAt);
    }
  };

  const handleAddMembers = async (memberIds: string[]) => {
    if (!conversationId) return;
    await messageService.addMembers(conversationId, { memberIds });
    await loadConversation();
    setShowAddMembers(false);
  };

  const handleUpdateConversation = async (
    name: string,
    imageUrl?: string,
  ) => {
    if (!conversationId) return;
    await messageService.updateConversation(conversationId, { name, imageUrl });
    await loadConversation();
    setShowEditConversation(false);
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      return;
    }
    await messageService.deleteConversation(conversationId);
    navigate('/messages');
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!conversationId) return;
    await messageService.removeMember(conversationId, memberId);
    if (memberId === user?.id) {
      navigate('/messages');
    } else {
      await loadConversation();
    }
  };

  if (loading) {
    return <LoadingState message="Chargement de la conversation..." />;
  }

  if (error || !conversation) {
    return (
      <ErrorState
        message={error || 'Conversation non trouvée'}
        onRetry={loadConversation}
      />
    );
  }

  const currentMemberIds = conversation.members.map((m) => m.userId);

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <ConversationHeader
        conversation={conversation}
        currentUserId={user?.id || ''}
        onAddMembers={() => setShowAddMembers(true)}
        onEditConversation={() => setShowEditConversation(true)}
        onDeleteConversation={handleDeleteConversation}
      />

      <div className="flex-1 overflow-hidden">
        <ChatWindow
          messages={messages}
          currentUserId={user?.id || ''}
          onSendMessage={handleSendMessage}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loading={loadingMore}
        />
      </div>

      {conversation.type === ConversationType.GROUP && (
        <>
          <AddMembersModal
            isOpen={showAddMembers}
            onClose={() => setShowAddMembers(false)}
            onAddMembers={handleAddMembers}
            currentMemberIds={currentMemberIds}
          />

          <EditConversationModal
            isOpen={showEditConversation}
            onClose={() => setShowEditConversation(false)}
            conversation={conversation}
            onUpdate={handleUpdateConversation}
          />
        </>
      )}

      <ConversationMembersModal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        members={conversation.members}
        currentUserId={user?.id || ''}
        createdBy={conversation.createdBy}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
};
