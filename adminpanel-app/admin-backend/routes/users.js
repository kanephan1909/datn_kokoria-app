const express = require('express');
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
} = require('../controllers/users');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');
const z = require('zod');

const router = express.Router();

const createUserSchema = z.object({
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    phone: z.string().optional(),
    role: z.enum(['USER', 'ADMIN', 'DRIVER']).optional(),
});

const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
    phone: z.string().optional(),
    role: z.enum(['USER', 'ADMIN', 'DRIVER']).optional(),
    deviceToken: z.string().optional(),
});

const deleteUserSchema = z.object({
    id: z.string().min(1, 'ID không được để trống'),
});

/**
 * GET /users?page=1&limit=10&role=USER&search=john
 * Lấy danh sách users với pagination và filter
 * - ADMIN: xem tất cả
 * - USER: chỉ xem thông tin của mình (có thể filter)
 */
router.get('/', authMiddleware, getUsers);

/**
 * GET /users/:id
 * Lấy thông tin chi tiết user
 * - ADMIN: xem tất cả
 * - USER: chỉ xem của mình
 */
router.get('/:id', authMiddleware, getUser);

/**
 * POST /users
 * Tạo user mới (chỉ ADMIN)
 */
router.post('/', authMiddleware, authorize(['ADMIN']), validate(createUserSchema), createUser);

/**
 * PUT /users/:id
 * Cập nhật user
 * - ADMIN: cập nhật bất kỳ user nào
 * - USER: chỉ cập nhật của mình
 */
router.put('/:id', authMiddleware, validate(updateUserSchema), updateUser);

/**
 * DELETE /users/:id
 * Xóa user (chỉ ADMIN)
 */
router.delete('/:id', authMiddleware, authorize(['ADMIN']), validate(deleteUserSchema, { source: 'params' }), deleteUser);

module.exports = router;

