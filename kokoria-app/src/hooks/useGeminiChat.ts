import {useState, useCallback} from 'react';
import {
  sendChatbotMessage,
  clearChatbotSession,
  ChatMessage as APIChatMessage,
} from '../../api/apiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useGeminiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Xin chào! 👋 Tôi là trợ lý ảo của Kokoria. Tôi có thể giúp gì cho bạn hôm nay?',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Thêm message của user
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Chuẩn bị chat history (bỏ message chào đầu tiên)
        const chatHistory: APIChatMessage[] = messages
          .slice(1)
          .map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
          }));

        // Gọi API backend
        const response = await sendChatbotMessage(content.trim(), chatHistory);

        if (response.success && response.data) {
          // Thêm response từ assistant
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.message,
            timestamp: new Date(response.data.timestamp || Date.now()),
          };

          setMessages(prev => [...prev, assistantMessage]);
        } else {
          throw new Error(response.message || 'Không nhận được phản hồi từ server');
        }
      } catch (err: any) {
        console.error('Chatbot API Error:', err);
        
        let errorMessage = 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.';
        
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);

        // Thêm message lỗi
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ ${errorMessage}`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  const clearChat = useCallback(async () => {
    try {
      // Gọi API để xóa session trên server
      await clearChatbotSession();
    } catch (err) {
      console.error('Error clearing chat session:', err);
      // Vẫn tiếp tục xóa local messages dù API call fail
    }

    // Reset local messages
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content:
          'Xin chào! 👋 Tôi là trợ lý ảo của Kokoria. Tôi có thể giúp gì cho bạn hôm nay?',
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
};
