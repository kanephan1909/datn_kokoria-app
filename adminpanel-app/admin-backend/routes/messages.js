const express = require('express');
const {
    getOrderMessages,
    getMessage,
    createMessage,
    deleteMessage,
} = require('../controllers/messages');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');
const z = require('zod');

const router = express.Router();

const createMessageSchema = z.object({
    orderId: z.string().min(1, 'Order ID không được để trống'),
    text: z.string().min(1, 'Nội dung tin nhắn không được để trống'),
});

/**
 * GET /messages/order/:orderId?page=1&limit=50
 * Lấy danh sách messages của một order
 * - USER: chỉ xem messages của orders của mình
 * - DRIVER: chỉ xem messages của orders được gán cho mình
 * - ADMIN: xem tất cả
 */
router.get('/order/:orderId', authMiddleware, getOrderMessages);

/**
 * GET /messages/:id
 * Lấy thông tin chi tiết message
 */
router.get('/:id', authMiddleware, getMessage);

/**
 * POST /messages
 * Tạo message mới (chat)
 * - USER: gửi message cho orders của mình
 * - DRIVER: gửi message cho orders được gán cho mình
 * - ADMIN: gửi message cho bất kỳ order nào
 */
router.post('/', authMiddleware, authorize(['USER', 'DRIVER', 'ADMIN']), validate(createMessageSchema), createMessage);

/**
 * DELETE /messages/:id
 * Xóa message
 * - Chỉ người gửi hoặc ADMIN mới xóa được
 */
router.delete('/:id', authMiddleware, deleteMessage);

module.exports = router;

