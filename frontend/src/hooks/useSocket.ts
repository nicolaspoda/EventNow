import { useEffect, useRef } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from '../utils/useAuth';

export const useSocket = () => {
  const { user, isSessionReady } = useAuth();
  const isInitialized = useRef(false);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');

    // Tant que la session n'est pas réhydratée, on ne tente rien.
    if (!isSessionReady) return;

    // Session absente/invalide: coupe explicitement la socket.
    if (!user || !token) {
      socketService.disconnect();
      isInitialized.current = false;
      return;
    }

    if (!isInitialized.current) {
      isInitialized.current = true;

      socketService.connect(token).catch((error) => {
        console.error('[useSocket] Failed to connect to WebSocket:', error);
        isInitialized.current = false;
      });
    }
  }, [user, isSessionReady]);

  return {
    isConnected: socketService.isConnected(),
  };
};
