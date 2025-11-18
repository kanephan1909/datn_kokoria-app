const express = require('express');
const {
    getAddresses,
    getAddress,
    getUserAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
} = require('../controllers/addresses');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const z = require('zod');

const router = express.Router();

const createAddressSchema = z.object({
    userId: z.string().optional(), // Optional vì có thể lấy từ token
    type: z.string().min(1, 'Loại địa chỉ không được để trống'),
    name: z.string().min(1, 'Tên không được để trống'),
    mobile: z.string().min(10, 'Số điện thoại không hợp lệ'),
    flatNo: z.string().optional(),
    street: z.string().optional(),
    landmark: z.string().optional(),
    buildingName: z.string().optional(),
    pincode: z.string().optional(),
    locality: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

const updateAddressSchema = z.object({
    type: z.string().optional(),
    name: z.string().optional(),
    mobile: z.string().min(10).optional(),
    flatNo: z.string().optional(),
    street: z.string().optional(),
    landmark: z.string().optional(),
    buildingName: z.string().optional(),
    pincode: z.string().optional(),
    locality: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

/**
 * GET /addresses?page=1&limit=10&userId=xxx
 * Lấy danh sách addresses
 * - ADMIN: xem tất cả
 * - USER: chỉ xem của mình
 */
router.get('/', authMiddleware, getAddresses);

/**
 * GET /addresses/user/:userId
 * Lấy danh sách addresses của user
 */
router.get('/user/:userId', authMiddleware, getUserAddresses);

/**
 * GET /addresses/:id
 * Lấy thông tin chi tiết address
 */
router.get('/:id', authMiddleware, getAddress);

/**
 * POST /addresses
 * Tạo address mới
 * - USER: tự động gán userId từ token
 * - ADMIN: có thể tạo cho user khác
 */
router.post('/', authMiddleware, validate(createAddressSchema), createAddress);

/**
 * PUT /addresses/:id
 * Cập nhật address
 */
router.put('/:id', authMiddleware, validate(updateAddressSchema), updateAddress);

/**
 * DELETE /addresses/:id
 * Xóa address
 */
router.delete('/:id', authMiddleware, deleteAddress);

module.exports = router;

