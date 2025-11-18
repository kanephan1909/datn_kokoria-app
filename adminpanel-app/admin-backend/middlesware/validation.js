const z = require("zod");
const logger = require("../utils/logger");

// Middleware dùng để validate request body bằng Zod schema
// Có thể validate req.body, req.params, hoặc req.query
function validate(schema, options = {}) {
  return (req, res, next) => {
    try {
      // Xác định nguồn dữ liệu cần validate
      // Mặc định validate req.body, nhưng có thể chọn validate req.params hoặc req.query
      const source = options.source || 'body'; // 'body', 'params', 'query', hoặc 'all'
      
      let dataToValidate = {};
      
      if (source === 'body') {
        dataToValidate = req.body;
      } else if (source === 'params') {
        dataToValidate = req.params;
      } else if (source === 'query') {
        dataToValidate = req.query;
      } else if (source === 'all') {
        // Validate tất cả: params, query, body
        dataToValidate = { ...req.params, ...req.query, ...req.body };
      }

      // safeParse trả về { success: true, data } hoặc { success: false, error }
      const result = schema.safeParse(dataToValidate);

      // Nếu validate thất bại → trả lỗi 400
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: result.error.errors, // lấy danh sách lỗi chi tiết
        });
      }

      // Gán lại dữ liệu đã được parse (đã được Zod làm sạch)
      if (source === 'body') {
        req.body = result.data;
      } else if (source === 'params') {
        req.params = result.data;
      } else if (source === 'query') {
        req.query = result.data;
      } else if (source === 'all') {
        // Merge lại vào các object tương ứng
        Object.keys(result.data).forEach(key => {
          if (req.params[key] !== undefined) req.params[key] = result.data[key];
          if (req.query[key] !== undefined) req.query[key] = result.data[key];
          if (req.body[key] !== undefined) req.body[key] = result.data[key];
        });
      }
      
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
