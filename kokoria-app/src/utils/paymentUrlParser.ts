/**
 * Utility functions để parse và xử lý payment URL
 */

export interface PaymentUrlParams {
  resultCode: string | null;
  message: string | null;
  orderId: string | null;
  status: string | null;
}

/**
 * Parse URL và extract payment parameters
 */
export const parsePaymentUrl = (url: string): PaymentUrlParams | null => {
  try {
    const urlString = url.startsWith('kokoriaapp://')
      ? url.replace('kokoriaapp://', 'https://')
      : url;
    const urlObj = new URL(urlString);

    return {
      resultCode: urlObj.searchParams.get('resultCode'),
      message: urlObj.searchParams.get('message'),
      orderId: urlObj.searchParams.get('orderId'),
      status: urlObj.searchParams.get('status'),
    };
  } catch (error) {
    console.error('Error parsing payment URL:', error);
    return null;
  }
};

/**
 * Kiểm tra nếu URL là MoMo redirect URL
 */
export const isMoMoRedirectUrl = (url: string): boolean => {
  return (
    url.includes('test-payment.momo.vn/v2/gateway/redirect') ||
    url.includes('payment.momo.vn/v2/gateway/redirect') ||
    url.includes('momo.vn/v2/gateway/redirect') ||
    url.startsWith('kokoriaapp://') ||
    (url.includes('momo.vn') && url.includes('resultCode='))
  );
};

/**
 * Kiểm tra nếu URL là VNPay callback URL
 */
export const isVNPayCallbackUrl = (url: string): boolean => {
  return url.includes('vnp_ResponseCode') || url.includes('vnpay');
};

/**
 * Kiểm tra nếu payment thành công từ URL params
 */
export const isPaymentSuccess = (params: PaymentUrlParams | null): boolean => {
  if (!params) {
    return false;
  }

  return (
    params.resultCode === '0' ||
    (params.resultCode === '0' &&
      params.message !== null &&
      params.message.toLowerCase().includes('successful')) ||
    params.status === 'success'
  );
};

/**
 * Kiểm tra nếu payment thất bại từ URL params
 */
export const isPaymentFailed = (params: PaymentUrlParams | null): boolean => {
  if (!params) {
    return false;
  }

  return (
    (params.resultCode !== null && params.resultCode !== '0') ||
    params.status === 'failed' ||
    (params.message !== null && params.message.toLowerCase().includes('failed'))
  );
};

