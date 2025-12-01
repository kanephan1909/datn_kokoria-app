const express = require('express');
const { 
  getCategories,
  getCategory,
  getProductsByCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categories');

const validate = require('../middlesware/validation');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');
const z = require('zod');

const router = express.Router();

/**
 * Schema validate cho CREATE & UPDATE category
 * - name: bắt buộc, ít nhất 2 ký tự
 * - imageUrl: có thể là URL hoặc chuỗi rỗng
 */
const categorySchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  imageUrl: z.string().url("URL hình ảnh không hợp lệ").optional().or(z.literal('')),
});

/**
 * Schema validate cho DELETE category
 * Validate req.params, không phải req.body
 * Example: DELETE /categories/123
 */
const deleteCategorySchema = z.object({
  id: z.string().min(1, "ID không được để trống"), 
  // Nếu id không phải UUID, đổi sang z.string().min(1)
});

/**
 * GET /categories?page=1&limit=10
 * Lấy danh sách category (pagination) - Public
 */
router.get('/', getCategories);

/**
 * GET /categories/:id/products
 * Lấy danh sách sản phẩm theo category - Public
 * Phải đặt trước route /:id để tránh conflict
 */
router.get('/:id/products', getProductsByCategory);

/**
 * GET /categories/:id
 * Lấy thông tin chi tiết category theo id - Public
 */
router.get('/:id', getCategory);

/**
 * POST /categories
 * Tạo category mới - Chỉ ADMIN
 */
router.post('/', authMiddleware, authorize(['ADMIN']), validate(categorySchema), createCategory);

/**
 * PUT /categories/:id
 * Cập nhật category theo id - Chỉ ADMIN
 */
router.put('/:id', authMiddleware, authorize(['ADMIN']), validate(categorySchema), updateCategory);

/**
 * DELETE /categories/:id
 * Xóa category + toàn bộ sản phẩm thuộc category - Chỉ ADMIN
 */
router.delete('/:id', authMiddleware, authorize(['ADMIN']), validate(deleteCategorySchema, { source: 'params' }), deleteCategory);

module.exports = router;
