import {useEffect, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import socket.io-client
let io: any = null;
try {
  const socketIOClient = require('socket.io-client');
  io = socketIOClient.io || socketIOClient.default || socketIOClient;
} catch (error) {
  console.warn('socket.io-client not installed');
}

// Socket server URL
const getSocketUrl = () => {
  // Mặc định cho Android emulator (socket.io thường chạy trên port 3000)
  // Thay đổi theo môi trường của bạn
  return 'http://10.0.2.2:3000';
};

interface UseSocketOptions {
  autoConnect?: boolean;
  events?: {
    [eventName: string]: (data: any) => void;
  };
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const {autoConnect = true, events = {}} = options;
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(
    !io ? 'socket.io-client chưa được cài đặt' : null,
  );
  const socketRef = useRef<any>(null);
  const eventsRef = useRef(events);

  // Update events ref when events change
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    if (!autoConnect) {
      return;
    }

    const initSocket = async () => {
      if (!io) {
        setSocketError('socket.io-client chưa được cài đặt');
        setIsConnected(false);
        return;
      }

      try {
        // Lấy token để authenticate
        const token = await AsyncStorage.getItem('accessToken');
        const socketUrl = getSocketUrl();

        // Tạo socket connection
        const socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          auth: token
            ? {
                token,
              }
            : undefined,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          forceNew: false,
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
          console.log('✅ Socket connected:', socket.id);
          setIsConnected(true);
          setSocketError(null);
        });

        socket.on('disconnect', (reason: string) => {
          console.log('❌ Socket disconnected:', reason);
          setIsConnected(false);
        });

        socket.on('connect_error', (error: Error) => {
          const errorMessage = error.message || 'Không thể kết nối đến server';
          console.error('❌ Socket connection error:', errorMessage);
          setSocketError(errorMessage);
          setIsConnected(false);
        });

        // Đăng ký các custom events
        Object.entries(eventsRef.current).forEach(([eventName, handler]) => {
          socket.on(eventName, handler);
        });
      } catch (error: any) {
        console.error('Failed to initialize socket:', error);
        const errorMessage = error.message || 'Không thể kết nối đến server';
        setSocketError(errorMessage);
        setIsConnected(false);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        Object.keys(eventsRef.current).forEach(eventName => {
          socketRef.current?.off(eventName);
        });
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [autoConnect]);

  const emit = (eventName: string, data?: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(eventName, data);
    } else {
      console.warn('Socket is not connected. Cannot emit:', eventName);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const connect = async () => {
    if (!io) {
      setSocketError('socket.io-client chưa được cài đặt');
      setIsConnected(false);
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const socketUrl = getSocketUrl();

      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        auth: token
          ? {
              token,
            }
          : undefined,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        setSocketError(null);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('connect_error', (error: Error) => {
        const errorMessage = error.message || 'Không thể kết nối đến server';
        setSocketError(errorMessage);
        setIsConnected(false);
        console.error('Socket connection error:', errorMessage);
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể kết nối đến server';
      setSocketError(errorMessage);
      setIsConnected(false);
      console.error('Failed to connect socket:', error);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    socketError,
    emit,
    disconnect,
    connect,
  };
};
