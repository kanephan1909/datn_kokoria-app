/**
 * Injected JavaScript để detect payment success từ nội dung trang
 */
export const getPaymentInjectedScript = (): string => {
  return `
    (function() {
      // Check nếu trang hiển thị "Thành công" hoặc có resultCode=0
      function checkPaymentSuccess() {
        // Check URL params
        const urlParams = new URLSearchParams(window.location.search);
        const resultCode = urlParams.get('resultCode');
        const message = urlParams.get('message');
        
        // Check nội dung trang
        const pageText = document.body.innerText || document.body.textContent || '';
        const isSuccessPage = 
          pageText.includes('Thành công') || 
          pageText.includes('Thanh toán thành công') ||
          pageText.includes('Successful') ||
          (resultCode === '0' && message && message.toLowerCase().includes('successful'));
        
        if (isSuccessPage || resultCode === '0') {
          const orderId = urlParams.get('orderId') || '';
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_SUCCESS',
            orderId: orderId
          }));
          return true;
        }
        return false;
      }
      
      // Check ngay khi script chạy
      if (checkPaymentSuccess()) {
        return;
      }
      
      // Check lại sau khi DOM load
      if (document.readyState === 'complete') {
        checkPaymentSuccess();
      } else {
        window.addEventListener('load', checkPaymentSuccess);
      }
      
      // Check định kỳ (fallback)
      const interval = setInterval(function() {
        if (checkPaymentSuccess()) {
          clearInterval(interval);
        }
      }, 1000);
      
      // Dừng sau 10 giây
      setTimeout(function() {
        clearInterval(interval);
      }, 10000);
    })();
    true;
  `;
};

