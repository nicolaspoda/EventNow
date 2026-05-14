import { useState, useEffect } from 'react';
import messageService, { type Conversation, type Message } from '../services/messageService';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

export const useMessages = (conversationId?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getUserConversations();
      setConversations(data);
      setError(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement'));
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setLoading(true);
      const data = await messageService.getConversation(id);
      setCurrentConversation(data);
      setError(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement'));
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (id: string, before?: string) => {
    try {
      setLoading(true);
      const data = await messageService.getMessages(id, 50, before);
      if (before) {
        setMessages((prev) => [...data, ...prev]);
      } else {
        setMessages(data);
      }
      setError(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement'));
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (id: string, content: string) => {
    const newMessage = await messageService.sendMessage(id, { content });
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const markAsRead = async (id: string) => {
    await messageService.markAsRead(id);
  };

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      loadMessages(conversationId);
    } else {
      loadConversations();
    }
  }, [conversationId]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    loadConversations,
    loadConversation,
    loadMessages,
    sendMessage,
    markAsRead,
  };
};
