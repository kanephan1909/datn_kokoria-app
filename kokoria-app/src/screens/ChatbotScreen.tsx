import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useGeminiChat, ChatMessage} from '../hooks/useGeminiChat';

interface ChatbotScreenProps {
  navigation?: any;
}

// Quick reply suggestions
const QUICK_REPLIES = [
  'Menu hôm nay có gì?',
  'Giá cả như thế nào?',
  'Thời gian giao hàng?',
  'Có khuyến mãi không?',
];

// Typing Indicator Component
const TypingIndicator: React.FC = () => {
  const dot1Anim = useRef(new Animated.Value(0.4)).current;
  const dot2Anim = useRef(new Animated.Value(0.4)).current;
  const dot3Anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    Animated.parallel([
      createAnimation(dot1Anim, 0),
      createAnimation(dot2Anim, 200),
      createAnimation(dot3Anim, 400),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.messageContainer, styles.assistantMessage]}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
        </View>
      </View>
      <View style={styles.messageContent}>
        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <View style={styles.typingIndicator}>
            <Animated.View style={[styles.typingDot, {opacity: dot1Anim}]} />
            <Animated.View style={[styles.typingDot, {opacity: dot2Anim}]} />
            <Animated.View style={[styles.typingDot, {opacity: dot3Anim}]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const ChatbotScreen: React.FC<ChatbotScreenProps> = ({navigation}) => {
  const {messages, isLoading, sendMessage, clearChat} = useGeminiChat();
  const [inputText, setInputText] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  }, [messages]);

  // Hide quick replies after first message
  useEffect(() => {
    if (messages.length > 1) {
      setShowQuickReplies(false);
    }
  }, [messages.length]);

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = (text?: string) => {
    const messageToSend = text || inputText.trim();
    if (messageToSend && !isLoading) {
      sendMessage(messageToSend);
      setInputText('');
      setShowQuickReplies(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isFirstMessage = index === 0;

    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: isFirstMessage ? 0 : slideAnim,
              },
            ],
          },
        ]}>
        {/* Avatar for assistant */}
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            </View>
          </View>
        )}

        <View style={styles.messageContent}>
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.assistantBubble,
            ]}>
            {isUser ? (
              <Text style={styles.userMessageText}>{message.content}</Text>
            ) : (
              <Text style={styles.assistantMessageText}>
                {message.content}
              </Text>
            )}
          </View>
          <Text style={styles.timestamp}>
            {message.timestamp.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Avatar for user */}
        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={18} color="#F97316" />
            </View>
          </View>
        )}
      </Animated.View>
    );
  };


  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      {/* Header with gradient */}
      <View
        className="px-4 py-3 flex-row items-center justify-between shadow-lg"
        style={styles.headerGradient}>
        <View className="flex-row items-center flex-1">
          {navigation && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3"
              activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <View className="bg-white/20 rounded-full p-2.5 mr-3">
            <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">Trợ lý ảo Kokoria</Text>
            <View className="flex-row items-center mt-0.5">
              <View
                className={`w-2 h-2 rounded-full mr-2 ${
                  isLoading ? 'bg-yellow-300' : 'bg-green-300'
                }`}
              />
              <Text className="text-orange-100 text-xs">
                {isLoading ? 'Đang trả lời...' : 'Sẵn sàng hỗ trợ'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={clearChat}
          className="ml-2 p-2"
          activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {messages.map((message, index) => renderMessage(message, index))}
        {isLoading && <TypingIndicator />}

        {/* Quick Replies */}
        {showQuickReplies && messages.length === 1 && (
          <View style={styles.quickRepliesContainer}>
            <Text style={styles.quickRepliesTitle}>
              💡 Câu hỏi thường gặp:
            </Text>
            <View style={styles.quickRepliesGrid}>
              {QUICK_REPLIES.map((reply, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickReplyButton}
                  onPress={() => handleQuickReply(reply)}
                  activeOpacity={0.7}>
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
          <View className="flex-row items-end">
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Nhập câu hỏi của bạn..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
                editable={!isLoading}
                onSubmitEditing={() => handleSend()}
              />
              {inputText.length > 0 && (
                <Text style={styles.charCount}>{inputText.length}/500</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.8}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  messagesList: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 8,
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F97316',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerGradient: {
    backgroundColor: '#F97316',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  messageContent: {
    flex: 1,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubble: {
    backgroundColor: '#F97316',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  assistantMessageText: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  quickRepliesContainer: {
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickRepliesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickRepliesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyButton: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginRight: 8,
    marginBottom: 8,
  },
  quickReplyText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flex: 1,
    marginRight: 8,
    position: 'relative',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  charCount: {
    position: 'absolute',
    right: 16,
    bottom: 12,
    fontSize: 11,
    color: '#9CA3AF',
  },
  sendButton: {
    backgroundColor: '#F97316',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChatbotScreen;
