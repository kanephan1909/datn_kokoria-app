const multer = require('multer');

// Cấu hình multer để lưu file trong memory (buffer)
const storage = multer.memoryStorage();

// Filter chỉ cho phép upload ảnh
const fileFilter = (req, file, cb) => {
  // Kiểm tra MIME type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh'), false);
  }
};

// Cấu hình multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;

