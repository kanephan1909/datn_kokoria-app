const express = require('express');
const { getDashboardStats, debugOrders } = require('../controllers/dashboard');

const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');

const router = express.Router();

/**
 * GET /dashboard/stats
 * Lấy thống kê tổng quan cho admin
 * - Chỉ ADMIN mới truy cập được
 */
router.get('/stats', authMiddleware, authorize(['ADMIN']), getDashboardStats);

/**
 * GET /dashboard/debug/orders
 * Debug endpoint để kiểm tra đơn hàng trong database
 * - Không cần auth để dễ debug
 */
router.get('/debug/orders', debugOrders);

module.exports = router;

