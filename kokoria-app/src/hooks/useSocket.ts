import {useEffect, useRef, useState} from 'react';
import {io, Socket} from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Socket server URL - tương tự như API base URL
const getSocketUrl = () => {
  if (process.env.SOCKET_URL) {
    return process.env.SOCKET_URL;
  }

  // Lấy từ API base URL nếu có
  if (process.env.API_BASE_URL) {
    // Loại bỏ /api/v1 nếu có và lấy base URL
    const apiUrl = process.env.API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    return apiUrl;
  }

  // Mặc định cho Android emulator (socket.io thường chạy trên port 3000)
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
  const [socketError, setSocketError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
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
          timeout: 20000, // 20 seconds timeout
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

          // Log thêm thông tin để debug
          console.log('Socket URL:', socketUrl);
          console.log('Has token:', !!token);
        });

        // Đăng ký các custom events
        Object.entries(eventsRef.current).forEach(([eventName, handler]) => {
          socket.on(eventName, handler);
        });
      } catch (error: any) {
        console.error('Failed to initialize socket:', error);
        const errorMessage = error.message || 'Không thể kết nối đến server. Vui lòng kiểm tra backend server.';
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
      const errorMessage = error.message || 'Không thể kết nối đến server. Vui lòng kiểm tra backend server.';
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

