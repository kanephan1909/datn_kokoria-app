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
 * Parse query parameters từ URL string (không dùng URLSearchParams)
 */
const parseQueryParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  try {
    const queryString = url.split('?')[1] || '';
    if (!queryString) {
      return params;
    }

    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=').map(decodeURIComponent);
      if (key) {
        params[key] = value || '';
      }
    }
  } catch (error) {
    console.error('Error parsing query params:', error);
  }
  return params;
};

/**
 * Parse URL và extract payment parameters
 */
export const parsePaymentUrl = (url: string): PaymentUrlParams | null => {
  try {
    const urlString = url.startsWith('kokoriaapp://')
      ? url.replace('kokoriaapp://', 'https://')
      : url;

    const params = parseQueryParams(urlString);

    return {
      resultCode: params.resultCode || null,
      message: params.message || null,
      orderId: params.orderId || null,
      status: params.status || null,
    };
  } catch (error) {
    console.error('Error parsing payment URL:', error);
    return null;
  }
};

/**
 * Parse VNPay URL parameters
 */
export const parseVNPayUrl = (url: string): Record<string, string> => {
  return parseQueryParams(url);
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
  return (
    url.includes('vnp_ResponseCode') ||
    url.includes('vnpay') ||
    url.includes('vnpayment.vn')
  );
};

/**
 * Kiểm tra nếu URL là VNPay error page
 */
export const isVNPayErrorPage = (url: string): boolean => {
  return url.includes('vnpayment.vn') && url.includes('Error.html');
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

