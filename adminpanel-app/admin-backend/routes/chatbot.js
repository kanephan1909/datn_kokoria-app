const express = require('express');
const {
  sendChatbotMessage,
  clearChatbotSession,
  checkChatbotHealth,
} = require('../controllers/chatbotController');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const z = require('zod');

const router = express.Router();

// Schema validation cho send message
const sendMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Nội dung tin nhắn không được để trống')
    .max(1000, 'Nội dung tin nhắn không được vượt quá 1000 ký tự'),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * GET /chatbot/health
 * Kiểm tra trạng thái chatbot (public, không cần auth)
 */
router.get('/health', checkChatbotHealth);

/**
 * POST /chatbot/message
 * Gửi message đến chatbot
 * - Cần authentication (có thể là optional, nhưng nên có để track user)
 */
router.post(
  '/message',
  authMiddleware, // Có thể bỏ nếu muốn cho phép anonymous users
  validate(sendMessageSchema),
  sendChatbotMessage
);

/**
 * DELETE /chatbot/session
 * Xóa chat session của user hiện tại
 */
router.delete('/session', authMiddleware, clearChatbotSession);

module.exports = router;











