const express = require('express');
const upload = require('../middlesware/multer');
const { uploadImage, deleteImage } = require('../controllers/upload');
const authMiddleware = require('../middlesware/authMiddleware');
const authorize = require('../middlesware/authorizeMiddleware');

const router = express.Router();

/**
 * POST /upload/image
 * Upload ảnh lên Cloudinary - Cho phép ADMIN và USER
 */
router.post(
  '/image',
  authMiddleware,
  upload.single('image'),
  uploadImage
);

/**
 * DELETE /upload/image
 * Xóa ảnh trên Cloudinary - Chỉ ADMIN
 */
router.delete(
  '/image',
  authMiddleware,
  authorize(['ADMIN']),
  deleteImage
);

module.exports = router;

