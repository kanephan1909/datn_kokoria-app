const express = require('express');
const {
    getRestaurants,
    getRestaurant,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
} = require('../controllers/restaurants');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');
const z = require('zod');

const router = express.Router();

const createRestaurantSchema = z.object({
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    address: z.string().min(1, 'Địa chỉ không được để trống'),
    latitude: z.number(),
    longitude: z.number(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
    isOpen: z.boolean().optional(),
});

const updateRestaurantSchema = z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
    isOpen: z.boolean().optional(),
});

const deleteRestaurantSchema = z.object({
    id: z.string().min(1, 'ID không được để trống'),
});

/**
 * GET /restaurants?page=1&limit=10&isOpen=true
 * Lấy danh sách restaurants - Public
 */
router.get('/', getRestaurants);

/**
 * GET /restaurants/:id
 * Lấy thông tin chi tiết restaurant - Public
 */
router.get('/:id', getRestaurant);

/**
 * POST /restaurants
 * Tạo restaurant mới - Chỉ ADMIN
 */
router.post('/', authMiddleware, authorize(['ADMIN']), validate(createRestaurantSchema), createRestaurant);

/**
 * PUT /restaurants/:id
 * Cập nhật restaurant - Chỉ ADMIN
 */
router.put('/:id', authMiddleware, authorize(['ADMIN']), validate(updateRestaurantSchema), updateRestaurant);

/**
 * DELETE /restaurants/:id
 * Xóa restaurant - Chỉ ADMIN
 */
router.delete('/:id', authMiddleware, authorize(['ADMIN']), validate(deleteRestaurantSchema, { source: 'params' }), deleteRestaurant);

module.exports = router;

