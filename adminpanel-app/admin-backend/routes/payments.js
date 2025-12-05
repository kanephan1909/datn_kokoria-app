const express = require('express');
const {
  createMoMoPayment,
  moMoCallback,
  createVNPayPayment,
  vnPayCallback,
  vnPayReturn,
  createZaloPayPayment,
  zaloPayCallback,
  verifyPayment,
  confirmPaymentSuccess,
} = require('../controllers/payments');

const authMiddleware = require('../middlesware/authMiddleware');
const router = express.Router();

// MoMo Payment Routes
router.post('/momo/create', authMiddleware, createMoMoPayment);
router.post('/momo/callback', moMoCallback);

// VNPay Payment Routes
router.post('/vnpay/create', authMiddleware, createVNPayPayment);
router.post('/vnpay/callback', vnPayCallback);
router.get('/vnpay/return', vnPayReturn);

// ZaloPay Payment Routes
router.post('/zalopay/create', authMiddleware, createZaloPayPayment);
router.post('/zalopay/callback', zaloPayCallback);

// Verify Payment
router.post('/verify', authMiddleware, verifyPayment);

// Confirm Payment Success (called from frontend)
router.post('/confirm-success', authMiddleware, confirmPaymentSuccess);

module.exports = router;

