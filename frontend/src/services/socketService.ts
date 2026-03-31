import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { Message } from './messageService';

// Par défaut on utilise le proxy Vite (same-origin) en dev.
const SOCKET_URL = import.meta.env.VITE_API_URL ?? '';

interface SocketEvents {
  newMessage: (data: { conversationId: string; message: Message }) => void;
  conversationUpdated: (data: { conversationId: string; conversation: any }) => void;
  memberAdded: (data: { conversationId: string; userId: string }) => void;
  memberRemoved: (data: { conversationId: string; userId: string }) => void;
  userTyping: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  newNotification: () => void;
}

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();
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

      this.socket = io(`${SOCKET_URL}/messages`, {
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
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.isConnecting = false;
          reject(new Error('Failed to connect to WebSocket server'));
        }
      });

      this.socket.on('disconnect', (_reason) => {
        this.isConnecting = false;
      });

      this.socket.on('newMessage', (data: { conversationId: string; message: Message }) => {
        this.emit('newMessage', data);
      });

      this.socket.on('conversationUpdated', (data: { conversationId: string; conversation: any }) => {
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
        this.emit('newNotification', undefined);
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

      this.socket.emit('joinConversation', { conversationId }, (response: any) => {
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
        (response: any) => {
          if (response?.error) {
            console.error('[Socket] Error sending message:', response.error);
            reject(new Error(response.error));
          } else {
            resolve(response.message);
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

  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
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
export default socketService;
