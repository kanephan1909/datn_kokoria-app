const express = require('express');
const {
    getDrivers,
    getDriver,
    createDriver,
    updateDriver,
    deleteDriver,
    updateDriverLocation,
} = require('../controllers/drivers');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');
const z = require('zod');

const router = express.Router();

const createDriverSchema = z.object({
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
    avatar: z.string().url().optional().or(z.literal('')),
    isOnline: z.boolean().optional(),
    deviceToken: z.string().optional(),
});

const updateDriverSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    avatar: z.string().url().optional().or(z.literal('')),
    isOnline: z.boolean().optional(),
    deviceToken: z.string().optional(),
    currentLat: z.number().optional(),
    currentLng: z.number().optional(),
});

const locationSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
});

const deleteDriverSchema = z.object({
    id: z.string().min(1, 'ID không được để trống'),
});

/**
 * GET /drivers?page=1&limit=10&isOnline=true
 * Lấy danh sách drivers - ADMIN hoặc DRIVER (chỉ xem của mình)
 */
router.get('/', authMiddleware, authorize(['ADMIN', 'DRIVER']), getDrivers);

/**
 * GET /drivers/:id
 * Lấy thông tin chi tiết driver - ADMIN hoặc DRIVER (chỉ xem của mình)
 */
router.get('/:id', authMiddleware, authorize(['ADMIN', 'DRIVER']), getDriver);

/**
 * POST /drivers
 * Tạo driver mới - Chỉ ADMIN
 */
router.post('/', authMiddleware, authorize(['ADMIN']), validate(createDriverSchema), createDriver);

/**
 * PUT /drivers/:id
 * Cập nhật driver - ADMIN hoặc DRIVER (chỉ cập nhật của mình)
 */
router.put('/:id', authMiddleware, authorize(['ADMIN', 'DRIVER']), validate(updateDriverSchema), updateDriver);

/**
 * POST /drivers/:id/location
 * Cập nhật vị trí driver - ADMIN hoặc DRIVER (chỉ cập nhật của mình)
 */
router.post('/:id/location', authMiddleware, authorize(['ADMIN', 'DRIVER']), validate(locationSchema), updateDriverLocation);

/**
 * DELETE /drivers/:id
 * Xóa driver - Chỉ ADMIN
 */
router.delete('/:id', authMiddleware, authorize(['ADMIN']), validate(deleteDriverSchema, { source: 'params' }), deleteDriver);

module.exports = router;

