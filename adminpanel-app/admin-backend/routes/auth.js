const express = require('express');
const {
    register,
    login,
    refreshToken,
    logout,
    getMe,
    socialLogin,
} = require('../controllers/auth');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const z = require('zod');

const router = express.Router();

const registerSchema = z.object({
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    phone: z.string().optional(),
    role: z.enum(['USER', 'ADMIN', 'DRIVER']).optional(),
});

const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
});

const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

/**
 * POST /auth/register
 * Đăng ký user mới
 */
router.post('/register', validate(registerSchema), register);

/**
 * POST /auth/login
 * Đăng nhập
 */
router.post('/login', validate(loginSchema), login);

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

/**
 * POST /auth/logout
 * Đăng xuất (optional)
 */
router.post('/logout', logout);

/**
 * POST /auth/social-login
 * Đăng nhập bằng mạng xã hội (Google, Facebook, Apple)
 */
router.post('/social-login', socialLogin);

/**
 * GET /auth/me
 * Lấy thông tin user hiện tại (cần đăng nhập)
 */
router.get('/me', authMiddleware, getMe);

module.exports = router;

