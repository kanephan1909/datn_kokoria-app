const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const logger = require('../utils/logger');

// Cấu hình Cloudinary từ environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload ảnh lên Cloudinary
async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file ảnh được upload',
      });
    }

    // Convert buffer thành stream
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'kokoria-app', // Folder trên Cloudinary
        resource_type: 'auto', // Tự động detect loại file
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error.message}`);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi upload ảnh lên Cloudinary',
            error: error.message,
          });
        }

        res.json({
          success: true,
          data: {
            url: result.secure_url,
            publicId: result.public_id,
          },
          message: 'Upload ảnh thành công',
        });
      }
    );

    // Pipe buffer vào stream
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(stream);
  } catch (error) {
    logger.error(`Upload image error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý upload ảnh',
      error: error.message,
    });
  }
}

// Xóa ảnh trên Cloudinary
async function deleteImage(req, res) {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu publicId của ảnh',
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      data: result,
      message: 'Xóa ảnh thành công',
    });
  } catch (error) {
    logger.error(`Delete image error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa ảnh',
      error: error.message,
    });
  }
}

module.exports = {
  uploadImage,
  deleteImage,
};

