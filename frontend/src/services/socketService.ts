import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { Conversation, Message } from './messageService';
import type { Poll } from './pollsService';

function getSocketBaseUrl(): string {
  // Par défaut on utilise le same-origin (proxy Vite en dev, reverse proxy en prod).
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return '';

  const base = raw.replace(/\/+$/, '');

  // Si VITE_API_URL inclut /api ou /api/v1, on garde seulement l'origine pour Socket.IO.
  try {
    const url = new URL(base);
    url.pathname = '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return base
      .replace(/\/api\/v\d+$/i, '')
      .replace(/\/api$/i, '');
  }
}

const SOCKET_BASE_URL = getSocketBaseUrl();

interface SocketEvents {
  newMessage: (data: { conversationId: string; message: Message }) => void;
  conversationUpdated: (data: { conversationId: string; conversation: Conversation }) => void;
  memberAdded: (data: { conversationId: string; userId: string }) => void;
  memberRemoved: (data: { conversationId: string; userId: string }) => void;
  userTyping: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  newNotification: () => void;
  followsChanged: () => void;
  pollCreated: (poll: Poll) => void;
  pollUpdated: (poll: Poll) => void;
  pollDeleted: (data: { pollId: string }) => void;
  socketReconnected: () => void;
}

type EventName = keyof SocketEvents;
type EventArgs<K extends EventName> = Parameters<SocketEvents[K]>;
type SocketEventHandler = SocketEvents[EventName];
type SocketAck = { error?: string; message?: Message };

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<EventName, Set<SocketEventHandler>> = new Map();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      this.socket = io(`${SOCKET_BASE_URL}/messages`, {
        path: '/socket.io',
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on('connect', () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        resolve();
        // Resynchronise l'état (ex. notifications) après une reconnexion silencieuse
        // (veille de l'onglet, coupure réseau, redémarrage du backend), pour éviter
        // qu'un événement émis pendant la déconnexion soit manqué.
        this.emit('socketReconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.isConnecting = false;
          reject(new Error('Failed to connect to WebSocket server'));
        }
      });

      this.socket.on('disconnect', () => {
        this.isConnecting = false;
      });

      this.socket.on('newMessage', (data: { conversationId: string; message: Message }) => {
        this.emit('newMessage', data);
      });

      this.socket.on('conversationUpdated', (data: { conversationId: string; conversation: Conversation }) => {
        this.emit('conversationUpdated', data);
      });

      this.socket.on('memberAdded', (data: { conversationId: string; userId: string }) => {
        this.emit('memberAdded', data);
      });

      this.socket.on('memberRemoved', (data: { conversationId: string; userId: string }) => {
        this.emit('memberRemoved', data);
      });

      this.socket.on('userTyping', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
        this.emit('userTyping', data);
      });

      this.socket.on('newNotification', () => {
        this.emit('newNotification');
      });

      this.socket.on('followsChanged', () => {
        this.emit('followsChanged');
      });

      this.socket.on('pollCreated', (poll: Poll) => {
        this.emit('pollCreated', poll);
      });

      this.socket.on('pollUpdated', (poll: Poll) => {
        this.emit('pollUpdated', poll);
      });

      this.socket.on('pollDeleted', (data: { pollId: string }) => {
        this.emit('pollDeleted', data);
      });

      setTimeout(() => {
        if (this.isConnecting) {
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventHandlers.clear();
      this.isConnecting = false;
    }
  }

  joinConversation(conversationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('joinConversation', { conversationId }, (response: SocketAck) => {
        if (response?.error) {
          console.error('[Socket] Error joining conversation:', response.error);
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leaveConversation', { conversationId });
    }
  }

  sendMessage(conversationId: string, content: string): Promise<Message> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(
        'sendMessage',
        { conversationId, content },
        (response: SocketAck) => {
          if (response?.error) {
            console.error('[Socket] Error sending message:', response.error);
            reject(new Error(response.error));
          } else {
            resolve(response.message as Message);
          }
        }
      );
    });
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  joinEventRoom(eventId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }
      this.socket.emit('joinEventRoom', { eventId }, (response: { error?: string }) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  leaveEventRoom(eventId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leaveEventRoom', { eventId });
    }
  }

  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as SocketEventHandler);
  }

  off<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as SocketEventHandler);
    }
  }

  private emit<K extends EventName>(event: K, ...args: EventArgs<K>) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          (handler as (...eventArgs: EventArgs<K>) => void)(...args);
        } catch (error) {
          console.error(`[Socket] Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
