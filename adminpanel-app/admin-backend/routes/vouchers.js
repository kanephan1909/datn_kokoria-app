const express = require('express');
const {
    getVouchers,
    getVoucher,
    getVoucherByCode,
    createVoucher,
    updateVoucher,
    deleteVoucher,
} = require('../controllers/vouchers');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');
const z = require('zod');

const router = express.Router();

const createVoucherSchema = z.object({
    code: z.string().min(1, 'Mã voucher không được để trống'),
    discount: z.number().positive('Giảm giá phải lớn hơn 0'),
    minOrder: z.number().positive().optional(),
    maxDeduct: z.number().positive().optional(),
    expiry: z.string().or(z.date()),
});

const updateVoucherSchema = z.object({
    code: z.string().min(1).optional(),
    discount: z.number().positive().optional(),
    minOrder: z.number().positive().optional(),
    maxDeduct: z.number().positive().optional(),
    expiry: z.string().or(z.date()).optional(),
});

const deleteVoucherSchema = z.object({
    id: z.string().min(1, 'ID không được để trống'),
});

/**
 * GET /vouchers?page=1&limit=10&expired=false
 * Lấy danh sách vouchers - Public (có thể xem để áp dụng)
 */
router.get('/', getVouchers);

/**
 * GET /vouchers/code/:code
 * Lấy voucher theo code - Public (để check voucher khi checkout)
 */
router.get('/code/:code', getVoucherByCode);

/**
 * GET /vouchers/:id
 * Lấy thông tin chi tiết voucher - Public
 */
router.get('/:id', getVoucher);

/**
 * POST /vouchers
 * Tạo voucher mới - Chỉ ADMIN
 */
router.post('/', authMiddleware, authorize(['ADMIN']), validate(createVoucherSchema), createVoucher);

/**
 * PUT /vouchers/:id
 * Cập nhật voucher - Chỉ ADMIN
 */
router.put('/:id', authMiddleware, authorize(['ADMIN']), validate(updateVoucherSchema), updateVoucher);

/**
 * DELETE /vouchers/:id
 * Xóa voucher - Chỉ ADMIN
 */
router.delete('/:id', authMiddleware, authorize(['ADMIN']), validate(deleteVoucherSchema, { source: 'params' }), deleteVoucher);

module.exports = router;

