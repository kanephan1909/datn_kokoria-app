const logger = require("../utils/logger");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const axios = require("axios");
const VNPayService = require("../services/VNPayService");
const vnpayConfig = require("../configs/vnpayConfig");

const prisma = new PrismaClient();

// ==================== MOMO PAYMENT ====================

/**
 * Tạo payment link MoMo
 * POST /payments/momo/create
 */
// async function createMoMoPayment(req, res) {
//   const {orderId, amount, orderInfo, returnUrl, notifyUrl} = req.body;

//   try {
//     // Validate
//     if (!orderId || !amount) {
//       return res.status(400).json({
//         success: false,
//         message: 'Order ID và amount là bắt buộc',
//       });
//     }

//     // Kiểm tra order có tồn tại không
//     const order = await prisma.order.findUnique({
//       where: {id: orderId},
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }

//     // Lấy config từ .env
//     const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
//     const accessKey = process.env.MOMO_ACCESS_KEY || '';
//     const secretKey = process.env.MOMO_SECRET_KEY || '';
//     const endpoint =
//       process.env.MOMO_ENDPOINT ||
//       'https://test-payment.momo.vn/v2/gateway/api/create';

//     // Kiểm tra config
//     if (!accessKey || !secretKey) {
//       logger.error('MoMo config missing: ACCESS_KEY or SECRET_KEY not set');
//       return res.status(500).json({
//         success: false,
//         message: 'MoMo chưa được cấu hình. Vui lòng kiểm tra MOMO_ACCESS_KEY và MOMO_SECRET_KEY trong file .env',
//         configStatus: {
//           hasPartnerCode: !!partnerCode,
//           hasAccessKey: !!accessKey,
//           hasSecretKey: !!secretKey,
//           endpoint: endpoint,
//         },
//       });
//     }

//     // Tạo requestId và orderId cho MoMo
//     const now = new Date();
//     const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
//     const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
//     const randomStr = Math.random().toString(36).substring(2, 8);

//     const requestId = `${dateStr}_${timeStr}_${randomStr}`;
//     const momoOrderId = `${dateStr}_${timeStr}_${order.id.slice(-8)}`;
//     const extraData = '';

//     // Tạo raw signature
//     const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${
//       notifyUrl || process.env.MOMO_NOTIFY_URL
//     }&orderId=${momoOrderId}&orderInfo=${
//       orderInfo || `Thanh toan don hang ${orderId}`
//     }&partnerCode=${partnerCode}&redirectUrl=${
//       returnUrl || process.env.MOMO_RETURN_URL
//     }&requestId=${requestId}&requestType=captureWallet`;

//     // Tạo signature
//     const signature = crypto
//       .createHmac('sha256', secretKey)
//       .update(rawSignature)
//       .digest('hex');

//     // Request body
//     const requestBody = {
//       partnerCode,
//       partnerName: 'Kokoria App',
//       storeId: 'Kokoria Store',
//       requestId,
//       amount: parseInt(amount),
//       orderId: momoOrderId,
//       orderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
//       redirectUrl: returnUrl || process.env.MOMO_RETURN_URL,
//       ipnUrl: notifyUrl || process.env.MOMO_NOTIFY_URL,
//       lang: 'vi',
//       extraData,
//       requestType: 'captureWallet',
//       autoCapture: true,
//       signature,
//     };

//     // Log request để debug
//     logger.info(`MoMo payment request:`, {
//       endpoint,
//       partnerCode,
//       amount: requestBody.amount,
//       orderId: momoOrderId,
//       requestId,
//     });

//     // Gọi API MoMo
//     const response = await axios.post(endpoint, requestBody, {
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       timeout: 30000, // 30 seconds timeout
//     });

//     logger.info(`MoMo API response:`, {
//       resultCode: response.data?.resultCode,
//       message: response.data?.message,
//       hasPayUrl: !!response.data?.payUrl,
//     });

//     if (response.data.resultCode === 0) {
//       // Cập nhật paymentMethod trong Order (phải là ONLINE, không phải MOMO)
//       await prisma.order.update({
//         where: {id: orderId},
//         data: {
//           paymentMethod: 'ONLINE',
//           paymentStatus: 'PAYMENT_PENDING',
//         },
//       });

//       // Tạo Payment record với provider = MOMO
//       await prisma.payment.create({
//         data: {
//           orderId: orderId,
//           provider: 'MOMO',
//           method: 'ONLINE',
//           status: 'PAYMENT_PENDING',
//           amount: parseInt(amount),
//           currency: 'VND',
//           gatewayOrderId: momoOrderId,
//           gatewayTransId: response.data?.transId || null,
//           gatewayCode: response.data?.resultCode?.toString() || null,
//           gatewayMessage: response.data?.message || null,
//           gatewayResponse: response.data || null,
//         },
//       });

//       return res.json({
//         success: true,
//         data: {
//           payUrl: response.data.payUrl,
//           deeplink: response.data.deeplink,
//           qrCodeUrl: response.data.qrCodeUrl,
//           orderId: momoOrderId,
//           requestId,
//         },
//         message: 'MoMo payment link created successfully',
//       });
//     } else {
//       logger.error(
//         `MoMo payment failed: ${response.data.message || 'Unknown error'}`
//       );
//       return res.status(400).json({
//         success: false,
//         message: response.data.message || 'Failed to create MoMo payment',
//         errorCode: response.data.resultCode,
//         errorData: response.data,
//       });
//     }
//   } catch (error) {
//     // Log chi tiết lỗi từ MoMo
//     logger.error(`Error creating MoMo payment: ${error.message}`);
//     logger.error('Error stack:', error.stack);

//     if (error.response) {
//       logger.error(
//         `MoMo API error: ${
//           error.response.data?.message || 'Unknown error'
//         } (Status: ${error.response.status})`
//       );
//       logger.error('MoMo API response data:', JSON.stringify(error.response.data));
//       return res.status(error.response.status || 400).json({
//         success: false,
//         message: error.response.data?.message || 'MoMo payment error',
//         errorCode: error.response.data?.resultCode,
//         errorData: error.response.data,
//       });
//     }

//     // Kiểm tra nếu thiếu config
//     if (!process.env.MOMO_ACCESS_KEY || !process.env.MOMO_SECRET_KEY) {
//       return res.status(500).json({
//         success: false,
//         message: 'MoMo chưa được cấu hình. Vui lòng kiểm tra MOMO_ACCESS_KEY và MOMO_SECRET_KEY trong file .env',
//       });
//     }

//     // Lỗi khác
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//     });
//   }
// }
async function createMoMoPayment(req, res) {
  const { orderId, amount, orderInfo, returnUrl, notifyUrl } = req.body;

  try {
    // Validate
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Order ID và amount là bắt buộc",
      });
    }

    // Check order exist
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Get config
    const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
    const accessKey = process.env.MOMO_ACCESS_KEY || "";
    const secretKey = process.env.MOMO_SECRET_KEY || "";
    const endpoint =
      process.env.MOMO_ENDPOINT ||
      "https://test-payment.momo.vn/v2/gateway/api/create";

    if (!accessKey || !secretKey) {
      logger.error("Thiếu AccessKey hoặc SecretKey MoMo");
      return res.status(500).json({
        success: false,
        message:
          "MoMo chưa được cấu hình. Kiểm tra MOMO_ACCESS_KEY & MOMO_SECRET_KEY",
      });
    }

    // Generate MoMo internal IDs
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const randomStr = Math.random().toString(36).substring(2, 8);

    const requestId = `${dateStr}_${timeStr}_${randomStr}`;
    const momoOrderId = `${dateStr}_${timeStr}_${order.id.slice(-8)}`;
    const extraData = "";

    // Build raw signature
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${notifyUrl || process.env.MOMO_NOTIFY_URL}` +
      `&orderId=${momoOrderId}` +
      `&orderInfo=${orderInfo || `Thanh toan don hang ${orderId}`}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${returnUrl || process.env.MOMO_RETURN_URL}` +
      `&requestId=${requestId}` +
      `&requestType=captureWallet`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    // Build body
    const requestBody = {
      partnerCode,
      partnerName: "Kokoria App",
      storeId: "Kokoria Store",
      requestId,
      amount: parseInt(amount),
      orderId: momoOrderId,
      orderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
      redirectUrl: returnUrl || process.env.MOMO_RETURN_URL,
      ipnUrl: notifyUrl || process.env.MOMO_NOTIFY_URL,
      lang: "vi",
      extraData,
      requestType: "captureWallet",
      autoCapture: true,
      signature,
    };

    // LOG REQUEST
    logger.info("📤 MoMo REQUEST:", {
      endpoint,
      partnerCode,
      amount: requestBody.amount,
      momoOrderId,
      requestId,
    });

    // CALL API MOMO
    const response = await axios.post(endpoint, requestBody, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    // LOG FULL RESPONSE
    logger.info("📥 MoMo RESPONSE FULL:", {
      resultCode: response.data?.resultCode,
      message: response.data?.message,
      payUrl: response.data?.payUrl,
      deeplink: response.data?.deeplink,
      qrCodeUrl: response.data?.qrCodeUrl,
    });

    // Handle success
    if (response.data.resultCode === 0) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: "ONLINE",
          paymentStatus: "PAYMENT_PENDING",
        },
      });

      await prisma.payment.create({
        data: {
          orderId: orderId,
          provider: "MOMO",
          method: "ONLINE",
          status: "PAYMENT_PENDING",
          amount: parseInt(amount),
          currency: "VND",
          gatewayOrderId: momoOrderId,
          gatewayTransId: response.data?.transId || null,
          gatewayCode: response.data?.resultCode?.toString() || null,
          gatewayMessage: response.data?.message || null,
          gatewayResponse: response.data,
        },
      });

      // RETURN TO MOBILE ⇩⇩⇩
      return res.json({
        success: true,
        message: "MoMo link created successfully",
        data: {
          payUrl: response.data.payUrl,
          deeplink: response.data.deeplink,
          qrCodeUrl: response.data.qrCodeUrl,
          momoOrderId,
          requestId,
        },
      });
    }

    // MoMo failed
    logger.error("❌ MoMo error:", response.data);
    return res.status(400).json({
      success: false,
      message: response.data.message || "MoMo payment failed",
      errorCode: response.data.resultCode,
      raw: response.data,
    });
  } catch (error) {
    logger.error("❌ Error createMoMoPayment:", error.message);
    logger.error(error.stack);

    if (error.response) {
      logger.error("MoMo Error Response:", error.response.data);
      return res.status(error.response.status || 400).json({
        success: false,
        message: error.response.data?.message || "MoMo error",
        errorData: error.response.data,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

/**
 * Webhook callback từ MoMo
 * POST /payments/momo/callback
 */
async function moMoCallback(req, res) {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.body;

    // Verify signature
    const secretKey = process.env.MOMO_SECRET_KEY || "";
    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const calculatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    if (calculatedSignature !== signature) {
      logger.error("MoMo callback signature mismatch");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // Tìm order qua Payment table theo gatewayOrderId (momoOrderId)
    const payment = await prisma.payment.findFirst({
      where: { 
        gatewayOrderId: orderId,
        provider: "MOMO"
      },
      include: { order: true },
    });

    if (!payment || !payment.order) {
      logger.error(`MoMo callback: Order not found for momoOrderId: ${orderId}`);
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const order = payment.order;

    // Cập nhật payment status
    const paymentStatus =
      resultCode === 0 ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED";
    const momoPaymentStatus = resultCode === 0 ? "SUCCESS" : "FAILED";

    // Cập nhật order payment status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus,
      },
    });

    // Cập nhật payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        gatewayTransId: transId,
        gatewayCode: resultCode.toString(),
        gatewayMessage: message,
        gatewayResponse: req.body,
        paidAt: resultCode === 0 ? new Date() : null,
      },
    });

    // Nếu payment thành công, cập nhật order status
    if (resultCode === 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });
      
      logger.info(`✅ MoMo payment success for order ${order.id}`);
    } else {
      logger.warn(`❌ MoMo payment failed for order ${order.id}: ${message}`);
    }

    return res.json({ success: true, message: "Callback processed" });
  } catch (error) {
    logger.error(`Error processing MoMo callback: ${error}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ==================== VNPAY PAYMENT ====================

/**
 * Tạo payment link VNPay
 * POST /payments/vnpay/create
 */
async function createVNPayPayment(req, res) {
  const { orderId, amount, orderInfo, returnUrl, bankCode } = req.body;

  try {
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Order ID và amount là bắt buộc",
      });
    }

    // Kiểm tra config
    if (!vnpayConfig.isConfigured()) {
      logger.error("VNPay config missing: TMN_CODE or HASH_SECRET not set");
      return res.status(500).json({
        success: false,
        message: "VNPay chưa được cấu hình. Vui lòng kiểm tra file .env",
        configStatus: vnpayConfig.getConfigForLogging(),
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Lấy IP address từ request
    let ipAddr =
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "127.0.0.1";
    if (ipAddr.startsWith("::ffff:")) {
      ipAddr = ipAddr.substring(7);
    }
    if (ipAddr.includes(":")) {
      ipAddr = vnpayConfig.getIpAddr();
    }

    // VNPay không chấp nhận custom URL scheme (kokoriaapp://)
    // Phải dùng HTTP/HTTPS URL, sau đó redirect về app
    // Lưu appReturnUrl để dùng sau khi redirect
    const appReturnUrl = returnUrl && returnUrl.startsWith('kokoriaapp://') 
      ? returnUrl 
      : `kokoriaapp://payment/return?orderId=${orderId}`;

    // Tạo payment object để truyền vào service
    // Dùng backend HTTP URL cho VNPay (không dùng custom scheme)
    const payment = {
      orderId: order.id,
      amount: parseFloat(amount),
      metadata: {
        orderInfo: orderInfo || `Payment for order ${orderId}`,
        returnUrl: vnpayConfig.getReturnUrl(), // Dùng backend HTTP URL
        appReturnUrl: appReturnUrl, // Lưu appReturnUrl để dùng sau
        ipAddress: ipAddr,
        request: req,
      },
    };

    // Sử dụng VNPayService để tạo payment URL
    let paymentUrl;
    let vnpTxnRef;

    try {
      paymentUrl = await VNPayService.createVNPayPayment(payment);

      // Lấy vnp_TxnRef từ URL (hoặc generate lại)
      try {
        const urlParams = new URL(paymentUrl).searchParams;
        vnpTxnRef = urlParams.get("vnp_TxnRef");
      } catch (urlError) {
        logger.error("Error parsing payment URL:", urlError);
        // Nếu không parse được, tạo vnpTxnRef mới
        vnpTxnRef = `VNPAY_${Date.now()}_${order.id.slice(-8)}`;
      }
    } catch (serviceError) {
      logger.error("VNPayService error:", serviceError);
      throw serviceError;
    }

    // Cập nhật paymentMethod trong Order (phải là ONLINE, không phải VNPAY)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "ONLINE",
        paymentStatus: "PAYMENT_PENDING",
      },
    });

    // Kiểm tra xem đã có payment record chưa (retry case)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        orderId: orderId,
        provider: "VNPAY",
        status: {
          in: ["PAYMENT_PENDING", "PAYMENT_FAILED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingPayment) {
      // Update payment record với payment URL mới (retry)
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: "PAYMENT_PENDING",
          gatewayOrderId: vnpTxnRef,
          gatewayResponse: { 
            paymentUrl: paymentUrl,
            appReturnUrl: appReturnUrl, // Lưu appReturnUrl vào gatewayResponse
          },
          // Prisma tự động cập nhật updatedAt nếu có @updatedAt trong schema
        },
      });
      logger.info(`Updated existing payment record for order ${orderId} (retry)`);
    } else {
      // Tạo Payment record mới với provider = VNPAY
      await prisma.payment.create({
        data: {
          orderId: orderId,
          provider: "VNPAY",
          method: "ONLINE",
          status: "PAYMENT_PENDING",
          amount: parseFloat(amount),
          currency: "VND",
          gatewayOrderId: vnpTxnRef,
          gatewayResponse: { 
            paymentUrl: paymentUrl,
            appReturnUrl: appReturnUrl, // Lưu appReturnUrl vào gatewayResponse
          },
        },
      });
    }

    return res.json({
      success: true,
      data: {
        payUrl: paymentUrl,
        orderId: vnpTxnRef,
      },
      message: "VNPay payment link created successfully",
    });
  } catch (error) {
    logger.error(`Error creating VNPay payment: ${error.message || error}`);
    logger.error("Error stack:", error.stack);

    // Kiểm tra nếu là lỗi config
    if (
      error.message?.includes("chưa được cấu hình") ||
      error.message?.includes("config")
    ) {
      return res.status(500).json({
        success: false,
        message:
          "VNPay chưa được cấu hình. Vui lòng kiểm tra VNPAY_TMN_CODE và VNPAY_HASH_SECRET trong file .env",
        configStatus: vnpayConfig.getConfigForLogging(),
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/**
 * Webhook callback từ VNPay (IPN)
 * POST /payments/vnpay/callback
 */
async function vnPayCallback(req, res) {
  try {
    // VNPay gửi callback qua query string hoặc body
    const callbackData = req.method === "POST" ? req.body : req.query;

    // Sử dụng VNPayService để xử lý callback
    const result = await VNPayService.handleVNPayCallback(callbackData);

    if (result.status === "success") {
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    logger.error(`Error processing VNPay callback: ${error.message || error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Return URL từ VNPay (redirect sau khi thanh toán)
 * GET /payments/vnpay/return
 */
async function vnPayReturn(req, res) {
  try {
    const vnpParams = req.query;
    const {
      vnp_TxnRef,
      vnp_ResponseCode,
      vnp_TransactionNo,
      vnp_Amount,
      vnp_SecureHash,
      ...otherParams
    } = vnpParams;

    // Gọi callback để xử lý kết quả thanh toán
    try {
      const callbackData = {
        vnp_TxnRef,
        vnp_ResponseCode,
        vnp_TransactionNo,
        vnp_Amount,
        vnp_SecureHash,
        ...otherParams,
      };

      await VNPayService.handleVNPayCallback(callbackData);
    } catch (callbackError) {
      logger.error("VNPay callback error in return handler:", callbackError);
    }

    const orderId = vnp_TxnRef ? String(vnp_TxnRef) : undefined;
    const amountValue =
      typeof vnp_Amount === "string"
        ? (Number(vnp_Amount) / 100).toString()
        : undefined;
    const transactionNo =
      typeof vnp_TransactionNo === "string" ? vnp_TransactionNo : undefined;

    // Tìm order qua Payment table theo gatewayOrderId (vnp_TxnRef)
    let order = null;
    let payment = null;
    if (orderId) {
      payment = await prisma.payment.findFirst({
        where: {
          gatewayOrderId: orderId,
          provider: 'VNPAY',
        },
        include: {order: true},
      });
      order = payment?.order || null;
    }

    // Lấy appReturnUrl từ payment gatewayResponse
    const gatewayResponse = payment?.gatewayResponse || {};
    const appReturnUrl = gatewayResponse.appReturnUrl;
    
    if (vnp_ResponseCode === "00") {
      // Thanh toán thành công
      if (appReturnUrl && appReturnUrl.startsWith('kokoriaapp://')) {
        // Redirect về app qua deep link
        const deepLink = `${appReturnUrl}&status=success&transId=${transactionNo || ""}`;
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Đang chuyển hướng...</title>
          </head>
          <body>
            <script>
              window.location.href = "${deepLink}";
              setTimeout(function() {
                window.close();
              }, 1000);
            </script>
            <p>Đang chuyển hướng về ứng dụng...</p>
          </body>
          </html>
        `);
      } else {
        // Fallback về frontend URL
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const successUrl = `${frontendUrl}/payment/success?orderId=${
          order?.id || orderId
        }&status=success&transId=${transactionNo || ""}`;
        return res.redirect(successUrl);
      }
    } else {
      // Thanh toán thất bại
      if (appReturnUrl && appReturnUrl.startsWith('kokoriaapp://')) {
        // Redirect về app qua deep link
        const deepLink = `${appReturnUrl}&status=failed&code=${vnp_ResponseCode || ""}`;
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Đang chuyển hướng...</title>
          </head>
          <body>
            <script>
              window.location.href = "${deepLink}";
              setTimeout(function() {
                window.close();
              }, 1000);
            </script>
            <p>Đang chuyển hướng về ứng dụng...</p>
          </body>
          </html>
        `);
      } else {
        // Fallback về frontend URL
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const cancelUrl = `${frontendUrl}/payment/failed?orderId=${
          order?.id || orderId
        }&status=failed&code=${vnp_ResponseCode || ""}`;
        return res.redirect(cancelUrl);
      }
    }
  } catch (error) {
    logger.error(`VNPay return error: ${error.message || error}`);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/payment/error`);
  }
}

// ==================== ZALOPAY PAYMENT ====================

/**
 * Tạo payment link ZaloPay
 * POST /payments/zalopay/create
 */
async function createZaloPayPayment(req, res) {
  const { orderId, amount, description, callbackUrl } = req.body;

  try {
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Order ID và amount là bắt buộc",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const appId = process.env.ZALOPAY_APP_ID || "";
    const key1 = process.env.ZALOPAY_KEY1 || "";
    const key2 = process.env.ZALOPAY_KEY2 || "";
    const endpoint =
      process.env.ZALOPAY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create";

    const appTransId = `${Date.now()}`;
    const appTime = Date.now();
    const embedData = JSON.stringify({});
    const items = JSON.stringify([
      {
        itemid: orderId,
        itemname: description || `Don hang ${orderId}`,
        itemprice: parseInt(amount),
        itemquantity: 1,
      },
    ]);

    // Tạo orderId cho ZaloPay
    const zalopayOrderId = `ZALOPAY_${Date.now()}_${order.id}`;

    // Tạo mac
    const macData = `${appId}|${zalopayOrderId}|${amount}|${embedData}|${items}|${appTime}`;
    const mac = crypto.createHmac("sha256", key1).update(macData).digest("hex");

    const requestBody = {
      app_id: parseInt(appId),
      app_user: order.userId,
      app_time: appTime,
      amount: parseInt(amount),
      app_trans_id: zalopayOrderId,
      item: items,
      description: description || `Thanh toan don hang ${orderId}`,
      embed_data: embedData,
      bank_code: "zalopayapp",
      callback_url: callbackUrl || process.env.ZALOPAY_CALLBACK_URL,
      mac,
    };

    const response = await axios.post(endpoint, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data.return_code === 1) {
      // Cập nhật paymentMethod trong Order (phải là ONLINE, không phải ZALOPAY)
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: "ONLINE",
          paymentStatus: "PAYMENT_PENDING",
        },
      });

      // Tạo Payment record với provider = ZALOPAY
      await prisma.payment.create({
        data: {
          orderId: orderId,
          provider: "ZALOPAY",
          method: "ONLINE",
          status: "PAYMENT_PENDING",
          amount: parseInt(amount),
          currency: "VND",
          gatewayOrderId: zalopayOrderId,
          gatewayTransId: response.data?.zp_trans_token || null,
          gatewayCode: response.data?.return_code?.toString() || null,
          gatewayMessage: response.data?.return_message || null,
          gatewayResponse: response.data || null,
        },
      });

      return res.json({
        success: true,
        data: {
          payUrl: response.data.order_url,
          orderId: zalopayOrderId,
          zpTransToken: response.data.zp_trans_token,
        },
        message: "ZaloPay payment link created successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message:
          response.data.return_message || "Failed to create ZaloPay payment",
      });
    }
  } catch (error) {
    logger.error(`Error creating ZaloPay payment: ${error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Webhook callback từ ZaloPay
 * POST /payments/zalopay/callback
 */
async function zaloPayCallback(req, res) {
  try {
    const { data, mac } = req.body;

    const key2 = process.env.ZALOPAY_KEY2 || "";
    const dataStr = JSON.stringify(data);
    const macCalculated = crypto
      .createHmac("sha256", key2)
      .update(dataStr)
      .digest("hex");

    if (macCalculated !== mac) {
      logger.error("ZaloPay callback signature mismatch");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const { app_trans_id, zp_trans_id, amount, status } = data;

    // Tìm order theo zalopayOrderId
    const order = await prisma.order.findFirst({
      where: { zalopayOrderId: app_trans_id },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const paymentStatus = status === 1 ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED";
    const zalopayPaymentStatus = status === 1 ? "SUCCESS" : "FAILED";

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus,
        zalopayPaymentId: zp_trans_id,
        zalopayPaymentStatus: zalopayPaymentStatus,
        zalopayPaymentDate: new Date(),
        zalopayPaymentAmount: amount,
        zalopayPaymentCurrency: "VND",
        zalopayPaymentGateway: "ZALOPAY",
        zalopayPaymentGatewayResponse: req.body,
        zalopayPaymentGatewayResponseMessage:
          status === 1 ? "Success" : "Failed",
        zalopayPaymentGatewayResponseCode: status.toString(),
      },
    });

    if (status === 1) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });
    }

    return res.json({ return_code: 1, return_message: "Success" });
  } catch (error) {
    logger.error(`Error processing ZaloPay callback: ${error}`);
    res
      .status(500)
      .json({ return_code: -1, return_message: "Internal server error" });
  }
}

/**
 * Verify payment status
 * POST /payments/verify
 */
async function verifyPayment(req, res) {
  const { orderId } = req.body;

  try {
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID là bắt buộc",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          where: {
            provider: { in: ["MOMO", "VNPAY", "ZALOPAY"] },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Nếu payment status vẫn là PENDING nhưng có payment record với status SUCCESS, cập nhật order
    if (
      order.paymentStatus === "PAYMENT_PENDING" &&
      order.payments.length > 0
    ) {
      const latestPayment = order.payments[0];
      
      // Kiểm tra nếu payment đã thành công từ gateway response
      if (
        latestPayment.gatewayCode === "0" ||
        latestPayment.status === "PAYMENT_SUCCESS" ||
        (latestPayment.gatewayResponse &&
          (latestPayment.gatewayResponse.resultCode === 0 ||
            latestPayment.gatewayResponse.status === 1))
      ) {
        // Cập nhật order payment status
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAYMENT_SUCCESS",
            status: order.status === "PENDING" ? "CONFIRMED" : order.status,
            confirmedAt:
              order.status === "PENDING" ? new Date() : order.confirmedAt,
          },
        });

        // Cập nhật payment record
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: {
            status: "PAYMENT_SUCCESS",
          },
        });

        logger.info(`Payment verified and updated for order ${orderId}`);

        return res.json({
          success: true,
          data: {
            orderId: order.id,
            paymentStatus: "PAYMENT_SUCCESS",
            paymentMethod: order.paymentMethod,
            updated: true,
          },
          message: "Payment verified and updated successfully",
        });
      }
    }

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        updated: false,
      },
      message: "Payment status retrieved successfully",
    });
  } catch (error) {
    logger.error(`Error verifying payment: ${error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Confirm payment success (called from frontend when payment is detected as successful)
 * POST /payments/confirm-success
 */
async function confirmPaymentSuccess(req, res) {
  const { orderId, paymentData } = req.body;

  try {
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID là bắt buộc",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          where: {
            provider: { in: ["MOMO", "VNPAY", "ZALOPAY"] },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Nếu payment đã được xác nhận rồi, không cần cập nhật lại
    if (order.paymentStatus === "PAYMENT_SUCCESS") {
      return res.json({
        success: true,
        data: {
          orderId: order.id,
          paymentStatus: order.paymentStatus,
          alreadyConfirmed: true,
        },
        message: "Payment already confirmed",
      });
    }

    // Cập nhật order payment status thành SUCCESS
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAYMENT_SUCCESS",
        status: order.status === "PENDING" ? "CONFIRMED" : order.status,
        confirmedAt:
          order.status === "PENDING" ? new Date() : order.confirmedAt,
      },
    });

    // Cập nhật payment record nếu có
    if (order.payments.length > 0) {
      await prisma.payment.update({
        where: { id: order.payments[0].id },
        data: {
          status: "PAYMENT_SUCCESS",
        },
      });
    }

    logger.info(`Payment confirmed for order ${orderId} from frontend`);

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        paymentStatus: "PAYMENT_SUCCESS",
        updated: true,
      },
      message: "Payment confirmed successfully",
    });
  } catch (error) {
    logger.error(`Error confirming payment: ${error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  createMoMoPayment,
  moMoCallback,
  createVNPayPayment,
  vnPayCallback,
  vnPayReturn,
  createZaloPayPayment,
  zaloPayCallback,
  verifyPayment,
  confirmPaymentSuccess,
};
