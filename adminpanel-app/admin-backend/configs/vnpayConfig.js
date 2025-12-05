/**
 * VNPay Configuration Class
 * Quản lý cấu hình VNPay từ environment variables
 */

class VNPayConfiguration {
  constructor() {
    this.config = {
      vnp_TmnCode: process.env.VNPAY_TMN_CODE || '',
      vnp_HashSecret:
        process.env.VNPAY_HASH_SECRET || process.env.VNPAY_SECRET_KEY || '',
      vnp_Url: process.env.VNPAY_URL || (() => {
        const environment = process.env.VNPAY_ENVIRONMENT || 'sandbox';
        return environment === 'production'
          ? 'https://vnpayment.vn/paymentv2/vpcpay.html'
          : 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
      })(),
      vnp_ReturnUrl:
        process.env.VNPAY_RETURN_URL ||
        'http://localhost:5000/v1/api/payments/vnpay/return',
      vnp_IpnUrl:
        process.env.VNPAY_IPN_URL ||
        'https://4d2e1111d04b.ngrok-free.app/api/v1/payments/vnpay/callback',
      vnp_IpAddr: process.env.VNPAY_IP_ADDR || '127.0.0.1',
      environment:
        (process.env.VNPAY_ENVIRONMENT === 'production'
          ? 'production'
          : 'sandbox') || 'sandbox',
    };
    this.validateConfig();
  }

  getDefaultUrl() {
    const environment = process.env.VNPAY_ENVIRONMENT || 'sandbox';
    return environment === 'production'
      ? 'https://vnpayment.vn/paymentv2/vpcpay.html'
      : 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  }

  validateConfig() {
    const requiredFields = ['vnp_TmnCode', 'vnp_HashSecret'];
    const missingFields = requiredFields.filter(
      field => !this.config[field] || this.config[field] === ''
    );

    if (missingFields.length > 0) {
      console.warn(
        `⚠️  VNPay Config Warning: Missing required fields: ${missingFields.join(
          ', '
        )}`
      );
      console.warn('Please ensure these environment variables are set:');
      missingFields.forEach(field => {
        const envKey = field
          .replace('vnp_', 'VNPAY_')
          .toUpperCase()
          .replace('TMNCODE', 'TMN_CODE')
          .replace('HASHSECRET', 'HASH_SECRET');
        console.warn(`  - ${envKey}`);
      });
    }
  }

  getConfig() {
    return {...this.config};
  }

  getTmnCode() {
    return this.config.vnp_TmnCode;
  }

  getHashSecret() {
    return this.config.vnp_HashSecret;
  }

  getUrl() {
    return this.config.vnp_Url;
  }

  getReturnUrl() {
    return this.config.vnp_ReturnUrl;
  }

  getIpnUrl() {
    return this.config.vnp_IpnUrl;
  }

  getIpAddr() {
    return this.config.vnp_IpAddr || '127.0.0.1';
  }

  getEnvironment() {
    return this.config.environment;
  }

  isProduction() {
    return this.config.environment === 'production';
  }

  isSandbox() {
    return this.config.environment === 'sandbox';
  }

  isConfigured() {
    return !!(
      this.config.vnp_TmnCode &&
      this.config.vnp_TmnCode !== '' &&
      this.config.vnp_HashSecret &&
      this.config.vnp_HashSecret !== ''
    );
  }

  getConfigForLogging() {
    return {
      vnp_TmnCode: this.config.vnp_TmnCode,
      vnp_Url: this.config.vnp_Url,
      vnp_ReturnUrl: this.config.vnp_ReturnUrl,
      vnp_IpAddr: this.config.vnp_IpAddr,
      environment: this.config.environment,
      vnp_HashSecret: this.config.vnp_HashSecret
        ? '***HIDDEN***'
        : 'NOT_SET',
    };
  }
}

// Export singleton instance
const vnpayConfig = new VNPayConfiguration();

module.exports = vnpayConfig;

