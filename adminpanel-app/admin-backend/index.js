require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlesware/errorHandler.js');

const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const addressesRoutes = require('./routes/addresses');
const restaurantsRoutes = require('./routes/restaurants');
const driversRoutes = require('./routes/drivers');
const ordersRoutes = require('./routes/orders');
const vouchersRoutes = require('./routes/vouchers');
const cartsRoutes = require('./routes/carts');
const messagesRoutes = require('./routes/messages');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/upload');
const paymentsRoutes = require('./routes/payments');

const app = express();

/**
 * CORS - Chỉ cho phép frontend truy cập API
 * FRONTEND_URL được khai báo trong .env (VD: http://localhost:5173)
 */
app.use(cors({ origin: process.env.FRONTEND_URL }));

/**
 * Helmet - bảo vệ API trước các vấn đề bảo mật phổ biến
 * (XSS, clickjacking, MIME sniffing, ...)
 */
app.use(helmet());

/**
 * Rate Limit - Giới hạn số lượng request để chống DDOS / spam API
 * - Development: 1000 requests / 15 phút / mỗi IP
 * - Production: 100 requests / 15 phút / mỗi IP
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

// Rate limit chung cho tất cả routes
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 1000 : 100, // Tăng limit cho development
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  })
);

// Rate limit riêng cho auth routes (register/login) - chặt hơn để chống spam
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // Development: 50 requests (tăng từ 20), Production: 5 requests
  message: 'Quá nhiều yêu cầu đăng ký/đăng nhập, vui lòng đợi vài phút trước khi thử lại.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Không đếm các request thành công
});

/**
 * Middleware parse JSON body
 * express.json() giúp parse JSON incoming request
 */
// Đặt limit lớn để xử lý variants (có thể có nhiều data)
app.use(express.json({ limit: '10mb' }));

/**
 * Parse form-data kiểu application/x-www-form-urlencoded
 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * bodyParser.raw() — chỉ dùng nếu bạn nhận JSON dưới dạng raw buffer,
 * thường dùng để verify webhook (Stripe, PayPal,...)
 * -> Comment lại để tránh conflict với express.json()
 * -> Chỉ uncomment nếu thực sự cần verify webhook
 */
// app.use(bodyParser.raw({ type: 'application/json' }));

// Routes with API VERSIONING
app.use('/api/v1/auth', authRateLimit, authRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/addresses', addressesRoutes);
app.use('/api/v1/restaurants', restaurantsRoutes);
app.use('/api/v1/drivers', driversRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/vouchers', vouchersRoutes);
app.use('/api/v1/carts', cartsRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/payments', paymentsRoutes);

// Error handler phải đặt sau tất cả routes
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;
