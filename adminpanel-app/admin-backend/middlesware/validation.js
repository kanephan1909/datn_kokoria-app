const z = require("zod");
const logger = require("../utils/logger");

/**
 * Middleware validate request bằng Zod.
 *
 * @param {z.ZodSchema} schema - Zod schema để validate.
 * @param {Object} options
 * @param {'body' | 'params' | 'query' | 'all'} [options.source='body']
 *        Nguồn dữ liệu cần validate.
 */
function validate(schema, options = {}) {
  const { source = "body" } = options;

  // Helper: lấy dữ liệu nguồn theo option
  const getSourceData = (req) => {
    switch (source) {
      case "body":
        return req.body;
      case "params":
        return req.params;
      case "query":
        return req.query;
      case "all":
        return { ...req.params, ...req.query, ...req.body };
      default:
        // Nếu truyền sai source thì log cảnh báo nhưng không crash server
        logger.warn(`validate(): Unknown source "${source}", fallback to "body"`);
        return req.body;
    }
  };

  // Helper: gán lại dữ liệu đã parse vào req
  const assignParsedData = (req, parsedData) => {
    switch (source) {
      case "body":
        req.body = parsedData;
        break;
      case "params":
        req.params = parsedData;
        break;
      case "query":
        req.query = parsedData;
        break;
      case "all":
        // Với "all" thì merge theo key có thật trên req
        Object.keys(parsedData).forEach((key) => {
          if (key in req.params) req.params[key] = parsedData[key];
          if (key in req.query) req.query[key] = parsedData[key];
          if (key in req.body) req.body[key] = parsedData[key];
        });
        break;
    }
  };

  return (req, res, next) => {
    try {
      const dataToValidate = getSourceData(req);

      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const issues = result.error.issues || [];

        const formattedErrors = issues.map((issue) => ({
          field: (issue.path || []).join(".") || "unknown",
          message: issue.message || "Validation error",
        }));

        const errorMessage =
          formattedErrors.length > 0
            ? formattedErrors.map((e) => `${e.field}: ${e.message}`).join(", ")
            : "Validation failed";

        return res.status(400).json({
          success: false,
          message: errorMessage,
        });
      }

      // Dữ liệu đã sạch → gán lại vào req
      assignParsedData(req, result.data);

      return next();
    } catch (err) {
      logger.error("Error validating request:", err);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

module.exports = validate;
