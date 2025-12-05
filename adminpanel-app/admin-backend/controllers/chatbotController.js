const logger = require('../utils/logger');
const geminiService = require('../services/GeminiService');

/**
 * POST /api/v1/chatbot/message
 * Gửi message đến chatbot và nhận response
 * Body: { message: string, chatHistory?: Array }
 */
async function sendChatbotMessage(req, res) {
  try {
    const { message, chatHistory } = req.body;
    const userId = req.user?.id || 'anonymous'; // Lấy userId từ token, nếu không có thì dùng 'anonymous'

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được để trống',
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được vượt quá 1000 ký tự',
      });
    }

    // Validate chatHistory nếu có
    if (chatHistory && !Array.isArray(chatHistory)) {
      return res.status(400).json({
        success: false,
        message: 'Chat history phải là một mảng',
      });
    }

    // Gửi message đến Gemini
    const result = await geminiService.sendMessage(
      userId,
      message.trim(),
      chatHistory
    );

    res.json({
      success: true,
      data: {
        message: result.message,
        timestamp: new Date().toISOString(),
      },
      message: 'Tin nhắn đã được xử lý thành công',
    });
  } catch (error) {
    logger.error(`Error in sendChatbotMessage:`, {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id || 'anonymous',
    });
    
    // Trả về error message chi tiết hơn cho client
    const errorMessage = error.message || 'Có lỗi xảy ra khi xử lý tin nhắn';
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * DELETE /api/v1/chatbot/session
 * Xóa chat session của user hiện tại
 */
async function clearChatbotSession(req, res) {
  try {
    const userId = req.user?.id || 'anonymous';
    
    await Promise.resolve(geminiService.clearChatSession(userId));

    res.json({
      success: true,
      message: 'Đã xóa lịch sử chat thành công',
    });
  } catch (error) {
    logger.error(`Error in clearChatbotSession: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa lịch sử chat',
    });
  }
}

/**
 * GET /api/v1/chatbot/health
 * Kiểm tra trạng thái của chatbot service
 */
async function checkChatbotHealth(req, res) {
  try {
    const isConfigured = !!process.env.GEMINI_API_KEY;

    if (!isConfigured) {
      return res.json({
        success: true,
        data: {
          configured: false,
          status: 'not_configured',
          message: 'Chatbot chưa được cấu hình. Vui lòng cấu hình GEMINI_API_KEY trong .env',
        },
      });
    }

    // Nếu chưa có working model, thử tìm một model hoạt động
    const workingModel = await geminiService.testAndFindWorkingModel();

    res.json({
      success: true,
      data: {
        configured: true,
        status: workingModel ? 'ready' : 'error',
        workingModel: workingModel || null,
        message: workingModel
          ? `Chatbot đã sẵn sàng với model: ${workingModel}`
          : 'Không thể kết nối đến Gemini API. Vui lòng kiểm tra API key.',
      },
    });
  } catch (error) {
    logger.error(`Error in checkChatbotHealth: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi kiểm tra trạng thái chatbot',
    });
  }
}

module.exports = {
  sendChatbotMessage,
  clearChatbotSession,
  checkChatbotHealth,
};
