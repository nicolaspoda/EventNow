import { useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import { useAuth } from '../utils/useAuth';

export const useSocket = () => {
  const { user } = useAuth();
  const isInitialized = useRef(false);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    
    if (user && token && !isInitialized.current) {
      isInitialized.current = true;
      
      socketService.connect(token).catch((error) => {
        console.error('[useSocket] Failed to connect to WebSocket:', error);
        isInitialized.current = false;
      });
    }

    return () => {
      if (!user) {
        socketService.disconnect();
        isInitialized.current = false;
      }
    };
  }, [user]);

  return {
    isConnected: socketService.isConnected(),
  };
};
