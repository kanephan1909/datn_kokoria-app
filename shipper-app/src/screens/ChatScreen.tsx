import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {fetchOrderMessages, sendMessage, Message, fetchOrderById} from '../api/apiClient';
import {useSocketContext} from '../context/SocketContext';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../context/AuthContext';

interface RouteParams {
  orderId: string;
  recipientName?: string;
  recipientId?: string;
}

const ChatScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const {user} = useAuth();
  const {orderId, recipientName, recipientId} = route.params as RouteParams;
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const {isConnected, emit, socket} = useSocketContext();

  // Load order để lấy thông tin recipient
  const {data: orderData} = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId,
  });

  const order = orderData?.data;
  const recipient = order?.user; // Shipper chat với customer

  // Load messages
  const {
    data: messagesData,
    isLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ['messages', orderId],
    queryFn: () => fetchOrderMessages(orderId, {page: 1, limit: 100}),
    refetchInterval: false,
    onError: (err: any) => {
      console.error('❌ Error fetching messages:', err);
      console.error('Error details:', err?.response?.data || err?.message);
    },
    onSuccess: (response) => {
      console.log('✅ Messages fetched:', response);
      console.log('Messages count:', response?.data?.length || 0);
    },
  });

  const messages = messagesData?.data || [];

  // Join order room khi mở chat
  useEffect(() => {
    if (isConnected && socket && orderId) {
      socket.emit('order:join', orderId);
      return () => {
        socket.emit('order:leave', orderId);
      };
    }
  }, [isConnected, socket, orderId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => sendMessage(orderId, text),
    onSuccess: (data) => {
      setMessageText('');
      queryClient.invalidateQueries({queryKey: ['messages', orderId]});
      // Emit qua socket để notify recipient
      if (isConnected) {
        emit('message:sent', {orderId, message: data.data});
      }
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể gửi tin nhắn');
    },
  });

  const handleSendMessage = useCallback(() => {
    if (messageText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(messageText.trim());
    }
  }, [messageText, sendMessageMutation]);

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Check if message is from current user
  const isMyMessage = (message: Message) => {
    return message.senderId === user?.id;
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = ({item}: {item: Message}) => {
    const isMine = isMyMessage(item);
    return (
      <View
        className={`mb-2 ${isMine ? 'items-end' : 'items-start'}`}
        style={styles.messageContainer}>
        <View
          className={`px-4 py-3 rounded-2xl max-w-[75%] ${
            isMine ? 'bg-blue-500 rounded-br-sm' : 'bg-gray-100 rounded-bl-sm'
          }`}
          style={styles.messageBubble}>
          <Text
            className={`text-base ${isMine ? 'text-white' : 'text-gray-900'}`}
            style={styles.messageText}>
            {item.text}
          </Text>
          <Text
            className={`text-xs mt-1 ${isMine ? 'text-white opacity-80' : 'text-gray-500'}`}
            style={styles.messageTime}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center mr-3">
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">
            {recipientName || recipient?.name || 'Khách hàng'}
          </Text>
          {isConnected && (
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              <Text className="text-xs text-gray-500">Đang hoạt động</Text>
            </View>
          )}
        </View>
        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <Ionicons name="call" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : messagesError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-gray-900 text-center mt-4 text-xl font-bold">
            Không thể tải tin nhắn
          </Text>
          <Text className="text-gray-600 text-center mt-2 text-sm">
            {messagesError?.response?.data?.message || 'Vui lòng thử lại'}
          </Text>
        </View>
      ) : messages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-800 text-xl font-bold mt-4 text-center">
            Chưa có tin nhắn nào
          </Text>
          <Text className="text-gray-500 text-center mt-2 text-sm">
            Bắt đầu cuộc trò chuyện với khách hàng
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }}
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View className="flex-row items-end px-4 py-3 border-t border-gray-200 bg-white">
          <TextInput
            className="flex-1 border border-gray-200 rounded-3xl px-4 py-3 max-h-24 text-base text-gray-900 mr-2"
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            className={`w-11 h-11 rounded-full items-center justify-center ${
              !messageText.trim() || sendMessageMutation.isPending
                ? 'bg-gray-300'
                : 'bg-blue-500'
            }`}
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}>
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messageContainer: {
    marginVertical: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#000000',
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
