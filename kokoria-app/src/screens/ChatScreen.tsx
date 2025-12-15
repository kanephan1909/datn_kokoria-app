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
  StatusBar,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchOrderMessages, sendMessage, Message, fetchOrderById} from '../../api/apiClient';
import {useSocket} from '../hooks/useSocket';
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
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;
  const queryClient = useQueryClient();
  const {orderId, recipientName} = route.params as RouteParams;
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const {user} = useAuth();
  const currentUserId = user?.id || null;

  // Load order để lấy thông tin recipient
  const {data: orderData} = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId,
  });

  const order = orderData?.data;
  // Xác định recipient dựa trên role của user hiện tại
  // USER chat với driver, DRIVER chat với user
  const recipient = user?.role === 'USER'
    ? order?.driver
    : order?.user;

  // Load messages
  const {
    data: messagesData,
    isLoading,
  } = useQuery({
    queryKey: ['messages', orderId],
    queryFn: () => fetchOrderMessages(orderId, {page: 1, limit: 100}),
    // Refetch mỗi 5 giây khi có socket connection (backup nếu socket miss)
    // Khi không có socket thì không refetch để tiết kiệm tài nguyên
    refetchInterval: false, // Socket sẽ handle real-time, chỉ refetch khi có socket event
  });

  const messages = messagesData?.data || [];

  // Socket để nhận messages real-time
  const socketHook = useSocket({
    autoConnect: true,
    events: {
      'message:new': (data: {message: Message}) => {
        console.log('📨 New message received:', JSON.stringify(data, null, 2));
        // Kiểm tra orderId trong message
        const messageOrderId = data.message?.orderId;
        console.log('🔍 Checking orderId - messageOrderId:', messageOrderId, 'current orderId:', orderId);
        // Nếu orderId khớp
        if (messageOrderId && messageOrderId === orderId) {
          console.log('✅ Valid message for current order, refetching messages');
          // Invalidate và refetch ngay để đảm bảo nhận được tin nhắn
          queryClient.invalidateQueries({queryKey: ['messages', orderId]});
          queryClient.refetchQueries({queryKey: ['messages', orderId]});
          // Scroll to bottom when new message arrives
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }, 200);
        } else {
          console.log('❌ Message orderId mismatch:', messageOrderId, 'vs', orderId, 'Message ignored');
        }
      },
    },
  });

  const {isConnected, emit, socket} = socketHook;

  // Join order room khi mở chat
  useEffect(() => {
    if (isConnected && socket && orderId) {
      console.log('🔌 Joining order room:', orderId);
      socket.emit('order:join', orderId);

      // Listen để confirm join thành công
      const onJoinSuccess = (data: any) => {
        console.log('✅ Joined order room:', data);
      };

      socket.on('order:joined', onJoinSuccess);

      return () => {
        console.log('🔌 Leaving order room:', orderId);
        socket.emit('order:leave', orderId);
        socket.off('order:joined', onJoinSuccess);
      };
    }
  }, [isConnected, socket, orderId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => sendMessage(orderId, text),
    onSuccess: (data) => {
      setMessageText('');
      // Invalidate và refetch ngay để hiển thị tin nhắn vừa gửi
      queryClient.invalidateQueries({queryKey: ['messages', orderId]});
      queryClient.refetchQueries({queryKey: ['messages', orderId]});
      // Emit qua socket để notify recipient
      if (isConnected) {
        emit('message:sent', {orderId, message: data.data});
      }
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 200);
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
    return message.senderId === currentUserId;
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
        style={[
          styles.messageContainer,
          isMine ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isMine ? styles.myMessageText : styles.otherMessageText,
            ]}>
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMine ? styles.myMessageTime : styles.otherMessageTime,
            ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: statusBarHeight + 16}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {recipientName || recipient?.name || (user?.role === 'USER' ? 'Tài xế' : 'Khách hàng')}
          </Text>
          {isConnected && recipient && (
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Đang hoạt động</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Chưa có tin nhắn nào</Text>
          <Text style={styles.emptyText}>
            {!recipient
              ? (user?.role === 'USER'
                  ? 'Đang chờ tài xế nhận đơn hàng'
                  : 'Đang chờ khách hàng')
              : (user?.role === 'USER'
                  ? 'Bắt đầu cuộc trò chuyện với tài xế'
                  : 'Bắt đầu cuộc trò chuyện với khách hàng')}
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sendMessageMutation.isPending || !recipient) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending || !recipient}>
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={24} color="#FFFFFF" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  callButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#6B7280',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});

export default ChatScreen;
