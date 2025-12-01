const express = require('express');
const {
    getOrders,
    getOrder,
    createOrder,
    confirmOrder,
    updateOrderStatus,
    updateOrder,
    getAvailableOrders,
    acceptOrder,
    deleteOrder,
} = require('../controllers/orders');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');
const z = require('zod');

const router = express.Router();

const createOrderSchema = z.object({
    userId: z.string().min(1, 'User ID không được để trống'),
    items: z.array(z.any()),
    totalAmount: z.number().positive('Tổng tiền phải lớn hơn 0'),
    note: z.string().optional(),
    address: z.any(), // JSON object
    shippingDistance: z.number().optional(),
    shippingFee: z.number().optional(),
    restaurantLat: z.number().optional(),
    restaurantLng: z.number().optional(),
    paymentMethod: z.enum(['ONLINE', 'COD']).optional(),
});

const updateOrderStatusSchema = z.object({
    status: z.enum([
        'PENDING',
        'CONFIRMED',
        'PREPARING',
        'READY_FOR_PICKUP',
        'PICKED_UP',
        'DELIVERING',
        'COMPLETED',
        'CANCELED',
    ]),
    message: z.string().optional(),
});

const updateOrderSchema = z.object({
    driverId: z.string().optional(),
    note: z.string().optional(),
    paymentStatus: z.enum(['PAYMENT_PENDING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED']).optional(),
});

const confirmOrderSchema = z.object({
    message: z.string().optional(),
});

const acceptOrderSchema = z.object({
    driverId: z.string().min(1, 'Driver ID không được để trống'),
});

const deleteOrderSchema = z.object({
    id: z.string().min(1, 'ID không được để trống'),
});

/**
 * GET /orders?page=1&limit=10&status=PENDING&paymentStatus=PAYMENT_SUCCESS&userId=xxx&driverId=xxx
 * Lấy danh sách orders với filter
 * - ADMIN: xem tất cả
 * - USER: chỉ xem orders của mình
 * - DRIVER: chỉ xem orders được gán cho mình
 */
router.get('/', authMiddleware, getOrders);

/**
 * GET /orders/available?page=1&limit=10
 * Lấy danh sách orders chưa có driver (cho Driver)
 * PHẢI ĐẶT TRƯỚC /orders/:id để tránh conflict
 */
router.get('/available', authMiddleware, authorize(['DRIVER', 'ADMIN']), getAvailableOrders);

/**
 * GET /orders/:id
 * Lấy thông tin chi tiết order
 */
router.get('/:id', authMiddleware, getOrder);

/**
 * POST /orders
 * Tạo order mới (USER)
 */
router.post('/', authMiddleware, authorize(['USER', 'ADMIN']), validate(createOrderSchema), createOrder);

/**
 * PUT /orders/:id/confirm
 * Branch/Admin xác nhận order (chuyển từ PENDING -> CONFIRMED)
 */
router.put('/:id/confirm', authMiddleware, authorize(['ADMIN']), validate(confirmOrderSchema), confirmOrder);

/**
 * PUT /orders/:id/accept
 * Driver nhận order (gán driver vào order)
 */
router.put('/:id/accept', authMiddleware, authorize(['DRIVER', 'ADMIN']), validate(acceptOrderSchema), acceptOrder);

/**
 * PUT /orders/:id/status
 * Cập nhật trạng thái order
 * - ADMIN: cập nhật bất kỳ order nào
 * - DRIVER: chỉ cập nhật orders được gán cho mình
 */
router.put('/:id/status', authMiddleware, authorize(['ADMIN', 'DRIVER']), validate(updateOrderStatusSchema), updateOrderStatus);

/**
 * PUT /orders/:id
 * Cập nhật order (driver, note, paymentStatus)
 * - ADMIN: cập nhật bất kỳ order nào
 */
router.put('/:id', authMiddleware, authorize(['ADMIN']), validate(updateOrderSchema), updateOrder);

/**
 * DELETE /orders/:id
 * Xóa order (chỉ ADMIN)
 */
router.delete('/:id', authMiddleware, authorize(['ADMIN']), validate(deleteOrderSchema, { source: 'params' }), deleteOrder);

module.exports = router;

