const z = require("zod");
const logger = require("../utils/logger");

// Middleware dùng để validate request body bằng Zod schema
function validate(schema) {
  return (req, res, next) => {
    try {
      // safeParse trả về { success: true, data } hoặc { success: false, error }
      const result = schema.safeParse(req.body);

      // Nếu validate thất bại → trả lỗi 400
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: result.error.errors, // lấy danh sách lỗi chi tiết
        });
      }

      // Gán lại dữ liệu đã được parse (đã được Zod làm sạch)
      req.body = result.data;
      next();

    } catch (error) {
      // Nếu chính bản thân middleware gặp lỗi (rất hiếm)
      logger.error(`Error validating request: ${error}`);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

module.exports = validate;
