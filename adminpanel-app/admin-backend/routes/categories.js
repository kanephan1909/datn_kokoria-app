const express = require('express');
const { 
  getCategories, 
  getProductsByCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categories');

const validate = require('../middlesware/validation'); 
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
 * Lấy danh sách category (pagination)
 */
router.get('/', getCategories);

/**
 * GET /categories/:id/products
 * Lấy danh sách sản phẩm theo category
 */
router.get('/:id/products', getProductsByCategory);

/**
 * POST /categories
 * Tạo category mới
 */
router.post('/', validate(categorySchema), createCategory);

/**
 * PUT /categories/:id
 * Cập nhật category theo id
 */
router.put('/:id', validate(categorySchema), updateCategory);

/**
 * DELETE /categories/:id
 * Xóa category + toàn bộ sản phẩm thuộc category
 */
router.delete('/:id', validate(deleteCategorySchema), deleteCategory);

module.exports = router;
