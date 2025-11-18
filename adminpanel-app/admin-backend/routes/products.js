const express = require('express');
const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');
const z = require('zod');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/products');

const router = express.Router();

const productSchema = z.object({
    categoryId: z.string().min(1, 'Category ID không được để trống'),
    name: z.string().min(1, 'Tên sản phẩm không được để trống'),
    price: z.number().positive('Giá phải lớn hơn 0'),
    imageUrl: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
    stock: z.number().int().min(0, 'Số lượng tồn kho phải >= 0').optional(),
    isActive: z.boolean().optional(),
});

const updateProductSchema = z.object({
    categoryId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
}); 

/**
 * GET /products?page=1&limit=10&categoryId=xxx
 * Lấy danh sách products - Public
 */
router.get('/', getProducts);

/**
 * GET /products/:id
 * Lấy thông tin chi tiết product - Public
 */
router.get('/:id', getProduct);

/**
 * POST /products
 * Tạo product mới - Chỉ ADMIN
 */
router.post('/', authMiddleware, authorize(['ADMIN']), validate(productSchema), createProduct);

/**
 * PUT /products/:id
 * Cập nhật product - Chỉ ADMIN
 */
router.put('/:id', authMiddleware, authorize(['ADMIN']), validate(updateProductSchema), updateProduct);

/**
 * DELETE /products/:id
 * Xóa product - Chỉ ADMIN
 */
router.delete('/:id', authMiddleware, authorize(['ADMIN']), deleteProduct);

module.exports = router;
