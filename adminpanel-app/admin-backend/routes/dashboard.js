const express = require('express');
const { getDashboardStats } = require('../controllers/dashboard');

const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');

const router = express.Router();

/**
 * GET /dashboard/stats
 * Lấy thống kê tổng quan cho admin
 * - Chỉ ADMIN mới truy cập được
 */
router.get('/stats', authMiddleware, authorize(['ADMIN']), getDashboardStats);

module.exports = router;

