/**
 * VNPay Service
 * Xử lý logic tạo payment URL và verify callback từ VNPay
 */

const crypto = require('crypto');
const querystring = require('querystring');
const vnpayConfig = require('../configs/vnpayConfig');
const logger = require('../utils/logger');
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

class VNPayService {
  /**
   * Format date theo chuẩn VNPay: yyyyMMddHHmmss
   */
  formatVNPayDate(date) {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Tạo vnp_TxnRef (mã giao dịch) - tối đa 34 ký tự, chỉ chữ/số
   */
  generateTxnRef() {
    const now = new Date();
    const dateStr = this.formatVNPayDate(now);
    const randomNum = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return `${dateStr}${randomNum}`.slice(0, 34);
  }

  /**
   * Clean orderInfo để chỉ chứa chữ cái Latin, số và khoảng trắng
   */
  cleanOrderInfo(orderInfo) {
    return orderInfo
      .substring(0, 255)
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();
  }

  /**
   * Lấy IP address từ request (chuyển IPv6 mapped IPv4 về IPv4)
   */
  getIpAddress(req) {
    let ipAddr =
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    // Chuyển ::ffff:127.0.0.1 về 127.0.0.1
    if (ipAddr.startsWith('::ffff:')) {
      ipAddr = ipAddr.substring(7);
    }

    // Nếu vẫn là IPv6, dùng IP mặc định
    if (ipAddr.includes(':')) {
      ipAddr = vnpayConfig.getIpAddr();
    }

    return ipAddr;
  }

  /**
   * Tạo signature cho VNPay
   */
  createSignature(params, secretKey) {
    // Sắp xếp params theo alphabet
    const sortedKeys = Object.keys(params).sort();
    const sortedParams = {};
    sortedKeys.forEach(key => {
      sortedParams[key] = params[key];
    });

    // Tạo chuỗi để ký (format: key1=value1&key2=value2...)
    const signData = sortedKeys
      .map(key => {
        const value = String(sortedParams[key]);
        return `${key}=${value}`;
      })
      .join('&');

    // VNPay dùng SHA256 hoặc SHA512
    // Thử SHA256 trước (theo tài liệu mới nhất)
    const hmac = crypto.createHmac('sha256', secretKey);
    const signature = hmac.update(signData, 'utf-8').digest('hex');

    return {signature, signData};
  }

  /**
   * Verify signature từ VNPay callback
   */
  verifySignature(params, secureHash, secretKey) {
    // Loại bỏ vnp_SecureHash và vnp_SecureHashType khỏi params
    const cleanParams = {...params};
    delete cleanParams.vnp_SecureHash;
    delete cleanParams.vnp_SecureHashType;

    // Tạo signature từ cleanParams
    const {signature: calculatedSignature} = this.createSignature(
      cleanParams,
      secretKey
    );

    return secureHash === calculatedSignature;
  }

  /**
   * Tạo VNPay payment URL
   */
  async createVNPayPayment(payment) {
    try {
      if (!vnpayConfig.isConfigured()) {
        throw new Error(
          'VNPay chưa được cấu hình đầy đủ. Vui lòng kiểm tra VNPAY_TMN_CODE và VNPAY_HASH_SECRET trong .env'
        );
      }

      const order = await prisma.order.findUnique({
        where: {id: payment.orderId},
      });

      if (!order) {
        throw new Error('Order không tồn tại');
      }

      const tmnCode = vnpayConfig.getTmnCode();
      const secretKey = vnpayConfig.getHashSecret();
      const vnpUrl = vnpayConfig.getUrl();
      const returnUrl =
        payment.metadata?.returnUrl || vnpayConfig.getReturnUrl();

      // Định dạng thời gian
      const baseDate = new Date();
      const createDate = this.formatVNPayDate(baseDate);
      const expireDate = this.formatVNPayDate(
        new Date(baseDate.getTime() + 15 * 60 * 1000)
      );

      // Tạo vnp_TxnRef
      const vnpTxnRef = this.generateTxnRef();

      // VNPay yêu cầu amount tính bằng xu (số nguyên)
      const vnpAmount = Math.round(payment.amount * 100).toString();

      // Lấy IP address từ request object hoặc metadata
      let vnpIpAddr = '127.0.0.1';
      if (payment.metadata?.request) {
        vnpIpAddr = this.getIpAddress(payment.metadata.request);
      } else if (payment.metadata?.ipAddress) {
        vnpIpAddr = payment.metadata.ipAddress;
      } else {
        vnpIpAddr = vnpayConfig.getIpAddr();
      }

      // Clean orderInfo
      const orderInfoText = this.cleanOrderInfo(
        payment.metadata?.orderInfo || `Payment for order ${order.id}`
      );

      // Tạo params
      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: vnpTxnRef,
        vnp_OrderInfo: orderInfoText,
        vnp_OrderType: 'other',
        vnp_Amount: vnpAmount,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: vnpIpAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
      };

      // Tạo signature
      const {signature, signData} = this.createSignature(vnpParams, secretKey);
      vnpParams.vnp_SecureHash = signature;

      // Tạo URL với querystring
      const paymentUrl =
        vnpUrl + '?' + querystring.stringify(vnpParams, {encode: true});

      // Log để debug
      logger.info(`VNPay params: ${JSON.stringify(vnpParams)}`);
      logger.info(`VNPay signData: ${signData}`);
      logger.info(`VNPay signature: ${signature}`);
      logger.info(`VNPay URL length: ${paymentUrl.length}`);
      logger.info(`VNPay TMN Code: ${tmnCode}`);
      logger.info(`VNPay Secret Key length: ${secretKey.length}`);

      return paymentUrl;
    } catch (error) {
      logger.error(`VNPay payment creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Xử lý VNPay callback (IPN)
   */
  async handleVNPayCallback(callbackData) {
    try {
      const secretKey = vnpayConfig.getHashSecret();
      const secureHash = callbackData.vnp_SecureHash;

      if (!secureHash) {
        return {
          status: 'error',
          message: 'Missing vnp_SecureHash in callback data',
        };
      }

      // Verify signature
      const isValid = this.verifySignature(callbackData, secureHash, secretKey);

      if (!isValid) {
        logger.error('VNPay callback signature mismatch');
        return {status: 'error', message: 'Invalid signature'};
      }

      const orderId = callbackData.vnp_TxnRef;
      const responseCode = callbackData.vnp_ResponseCode;
      const transactionNo = callbackData.vnp_TransactionNo;
      const amount = callbackData.vnp_Amount
        ? parseInt(callbackData.vnp_Amount) / 100
        : 0;

      // Tìm order qua Payment table theo gatewayOrderId (vnp_TxnRef)
      const payment = await prisma.payment.findFirst({
        where: {
          gatewayOrderId: orderId,
          provider: 'VNPAY',
        },
        include: {order: true},
      });

      if (!payment || !payment.order) {
        logger.error(`Order not found for vnp_TxnRef: ${orderId}`);
        return {status: 'error', message: 'Order not found'};
      }

      const order = payment.order;

      // Cập nhật payment và order status
      if (responseCode === '00') {
        // Thanh toán thành công
        await Promise.all([
          prisma.order.update({
            where: {id: order.id},
            data: {
              paymentStatus: 'PAYMENT_SUCCESS',
              status: 'CONFIRMED',
              confirmedAt: new Date(),
              note: order.note
                ? `${order.note}\nVNPay Transaction: ${transactionNo}`
                : `VNPay Transaction: ${transactionNo}`,
            },
          }),
          prisma.payment.update({
            where: {id: payment.id},
            data: {
              status: 'PAYMENT_SUCCESS',
              gatewayTransId: transactionNo,
              gatewayCode: responseCode,
              gatewayMessage: 'Payment successful',
              paidAt: new Date(),
            },
          }),
        ]);

        logger.info(
          `✅ VNPay: Order ${order.id} payment confirmed (Transaction: ${transactionNo})`
        );

        return {
          status: 'success',
          message: 'Payment processed successfully',
        };
      } else {
        // Thanh toán thất bại
        await Promise.all([
          prisma.order.update({
            where: {id: order.id},
            data: {
              paymentStatus: 'PAYMENT_FAILED',
              note: order.note
                ? `${order.note}\nVNPay Error: ${responseCode}`
                : `VNPay Error: ${responseCode}`,
            },
          }),
          prisma.payment.update({
            where: {id: payment.id},
            data: {
              status: 'PAYMENT_FAILED',
              gatewayTransId: transactionNo,
              gatewayCode: responseCode,
              gatewayMessage: `Payment failed with code: ${responseCode}`,
            },
          }),
        ]);

        logger.warn(
          `❌ VNPay: Order ${order.id} payment failed (Code: ${responseCode})`
        );

        return {
          status: 'error',
          message: `Payment failed with code: ${responseCode}`,
        };
      }
    } catch (error) {
      logger.error(`VNPay callback processing error: ${error.message}`);
      return {status: 'error', message: 'Callback processing failed'};
    }
  }

  /**
   * Lấy trạng thái config
   */
  getConfigStatus() {
    return {
      configured: vnpayConfig.isConfigured(),
      environment: vnpayConfig.getEnvironment(),
      config: vnpayConfig.getConfigForLogging(),
    };
  }
}

module.exports = new VNPayService();

