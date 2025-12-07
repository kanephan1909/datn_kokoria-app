const express = require('express');
const {
    createRating,
    getRatingByOrder,
    getRatingsByDriver,
} = require('../controllers/ratings');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');
const z = require('zod');

const router = express.Router();

const createRatingSchema = z.object({
    orderId: z.string().min(1, 'Order ID không được để trống'),
    rating: z.number().min(1).max(5, 'Rating phải từ 1 đến 5'),
    comment: z.string().optional(),
});

/**
 * POST /ratings
 * Tạo rating cho tài xế (USER)
 */
router.post('/', authMiddleware, authorize(['USER']), validate(createRatingSchema), createRating);

/**
 * GET /ratings/order/:orderId
 * Lấy rating của một order
 */
router.get('/order/:orderId', authMiddleware, getRatingByOrder);

/**
 * GET /ratings/driver/:driverId?page=1&limit=10
 * Lấy tất cả ratings của một driver
 */
router.get('/driver/:driverId', getRatingsByDriver);

module.exports = router;
