const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
    logger.error(`${req.method} ${req.url} - ${err.message}`);
    logger.error('Error stack:', err.stack);
    
    // Trong development, hiển thị chi tiết lỗi hơn
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(isDevelopment && {
            error: err.message,
            stack: err.stack,
            path: req.url,
            method: req.method,
        }),
    });
}

module.exports = errorHandler;