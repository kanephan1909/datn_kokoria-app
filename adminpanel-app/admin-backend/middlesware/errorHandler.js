const logger = require("../utils/logger");


function errorHandler(err, req, res, next) {
    logger.error(`${req.method} ${req.url} - ${err.message}`);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
}

module.exports = errorHandler;