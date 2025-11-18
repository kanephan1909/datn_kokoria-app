const express = require('express');
const {
    getCarts,
    getCart,
    getUserCart,
    createCart,
    updateCart,
    deleteCart,
} = require('../controllers/carts');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');
const z = require('zod');

const router = express.Router();

const createCartSchema = z.object({
    userId: z.string().min(1, 'User ID không được để trống'),
    items: z.array(z.any()).optional(),
});

const updateCartSchema = z.object({
    items: z.array(z.any()),
});

const deleteCartSchema = z.object({
    id: z.string().min(1, 'ID không được để trống'),
});

/**
 * GET /carts?page=1&limit=10&userId=xxx
 * Lấy danh sách carts - ADMIN xem tất cả, USER chỉ xem của mình
 */
router.get('/', authMiddleware, getCarts);

/**
 * GET /carts/user/:userId
 * Lấy cart của user (tạo mới nếu chưa có) - USER hoặc ADMIN
 */
router.get('/user/:userId', authMiddleware, getUserCart);

/**
 * GET /carts/:id
 * Lấy thông tin chi tiết cart - USER hoặc ADMIN
 */
router.get('/:id', authMiddleware, getCart);

/**
 * POST /carts
 * Tạo cart mới - USER hoặc ADMIN
 */
router.post('/', authMiddleware, authorize(['USER', 'ADMIN']), validate(createCartSchema), createCart);

/**
 * PUT /carts/:id
 * Cập nhật cart - USER hoặc ADMIN (USER chỉ cập nhật của mình)
 */
router.put('/:id', authMiddleware, authorize(['USER', 'ADMIN']), validate(updateCartSchema), updateCart);

/**
 * DELETE /carts/:id
 * Xóa cart - USER hoặc ADMIN (USER chỉ xóa của mình)
 */
router.delete('/:id', authMiddleware, authorize(['USER', 'ADMIN']), validate(deleteCartSchema, { source: 'params' }), deleteCart);

module.exports = router;

