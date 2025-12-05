import React, {createContext, useContext, ReactNode} from 'react';
import {useSocket} from '../hooks/useSocket';
import {useQueryClient} from '@tanstack/react-query';

interface SocketContextType {
  isConnected: boolean;
  socketError: string | null;
  emit: (eventName: string, data?: any) => void;
  socket: any;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({children}: {children: ReactNode}) => {
  const queryClient = useQueryClient();

  const {isConnected, socketError, emit, socket} = useSocket({
    autoConnect: true,
    events: {
      // Nhận đơn hàng mới
      'order:new': (data: {order: any}) => {
        console.log('📦 New order received:', data);
        // Invalidate queries để refresh danh sách đơn hàng
        queryClient.invalidateQueries({queryKey: ['availableOrders']});
      },

      // Đơn hàng đã được nhận bởi driver khác
      'order:accepted': (data: {orderId: string; driverId: string}) => {
        console.log('✅ Order accepted by another driver:', data);
        // Invalidate queries để remove order khỏi danh sách available
        queryClient.invalidateQueries({queryKey: ['availableOrders']});
      },

      // Cập nhật trạng thái đơn hàng
      'order:statusUpdate': (data: {orderId: string; status: string; message?: string}) => {
        console.log('🔄 Order status updated:', data);
        // Invalidate queries để refresh đơn hàng
        queryClient.invalidateQueries({queryKey: ['order', data.orderId]});
        queryClient.invalidateQueries({queryKey: ['availableOrders']});
        queryClient.invalidateQueries({queryKey: ['myOrders']});
      },

      // Nhận message mới
      'message:new': (data: {message: any}) => {
        console.log('📨 New message received:', data);
        // Invalidate queries để refresh messages
        if (data.message?.orderId) {
          queryClient.invalidateQueries({queryKey: ['messages', data.message.orderId]});
        }
      },

      // Notification
      notification: (data: {message: string; type?: string}) => {
        console.log('🔔 Notification:', data);
      },
    },
  });

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        socketError,
        emit,
        socket,
      }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};
