import {useCallback, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {confirmPaymentSuccess, createVNPayPayment, fetchOrderById} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';
import {
  parsePaymentUrl,
  parseVNPayUrl,
  isMoMoRedirectUrl,
  isVNPayCallbackUrl,
  isVNPayErrorPage,
  isPaymentSuccess,
  isPaymentFailed,
} from '../utils/paymentUrlParser';

interface UsePaymentWebViewParams {
  orderId: string;
  paymentMethod: string;
  paymentUrl?: string; // Thêm paymentUrl để có thể reload
  orderAmount?: number; // Thêm orderAmount để có thể tạo payment URL mới khi retry
}

export const usePaymentWebView = ({orderId, paymentMethod, paymentUrl, orderAmount}: UsePaymentWebViewParams) => {
  const navigation = useNavigation();
  const webViewRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const paymentProcessedRef = useRef<boolean>(false); // Track xem đã xử lý payment result chưa
  const paymentUrlRef = useRef<string | null>(paymentUrl || null); // Lưu payment URL để có thể reload
  const orderAmountRef = useRef<number | null>(orderAmount || null); // Lưu order amount
  const retryCountRef = useRef<number>(0); // Đếm số lần thử lại
  const isRetryingRef = useRef<boolean>(false); // Track xem đang trong quá trình retry hay không
  const isCreatingNewPaymentUrlRef = useRef<boolean>(false); // Track xem đang tạo payment URL mới
  const MAX_RETRY_ATTEMPTS = 3; // Giới hạn số lần thử lại

  /**
   * Xử lý payment success - confirm với backend và navigate
   */
  const handlePaymentSuccess = useCallback(
    (finalOrderId: string) => {
      // Ngăn chặn xử lý nhiều lần
      if (paymentProcessedRef.current) {
        console.log('⚠️ Payment already processed, ignoring duplicate success');
        return;
      }
      paymentProcessedRef.current = true;

      console.log('✅ Payment success detected! OrderId:', finalOrderId);

      // Gọi confirmPaymentSuccess để cập nhật database
      confirmPaymentSuccess(finalOrderId)
        .then(() => {
          console.log('✅ Payment confirmed in database');
        })
        .catch(error => {
          console.error('⚠️ Error confirming payment (will still navigate):', error);
        });

      // Chuyển đến OrderConfirmation
      console.log('🚀 Navigating to OrderConfirmation...');
      setTimeout(() => {
        (navigation as any).replace(MainRoutes.OrderConfirmation, {
          orderId: finalOrderId,
        });
      }, 500);
    },
    [navigation],
  );

  /**
   * Xử lý payment failed
   */
  const handlePaymentFailed = useCallback(
    (errorMessage?: string, allowRetry: boolean = true) => {
      // Ngăn chặn xử lý nhiều lần (trừ khi đang retry)
      if (paymentProcessedRef.current && !isRetryingRef.current) {
        console.log('⚠️ Payment already processed, ignoring duplicate failure');
        return;
      }

      // Nếu đang trong quá trình retry, reset flag
      if (isRetryingRef.current) {
        isRetryingRef.current = false;
      }

      console.log('❌ Payment failed', errorMessage);

      // Kiểm tra nếu có thể thử lại (có paymentUrl, chưa processed, và chưa vượt quá số lần thử)
      const canRetry =
        allowRetry &&
        paymentUrlRef.current &&
        !paymentProcessedRef.current &&
        retryCountRef.current < MAX_RETRY_ATTEMPTS;

      setTimeout(() => {
        // Nếu có thể thử lại, hiển thị alert với nút "Thử lại"
        if (canRetry) {
          const remainingRetries = MAX_RETRY_ATTEMPTS - retryCountRef.current;
          Alert.alert(
            'Thanh toán thất bại',
            `${errorMessage || 'Giao dịch thanh toán không thành công.'}\n\nBạn có thể thử lại với thẻ khác (còn ${remainingRetries} lần) hoặc quay lại.`,
            [
              {
                text: 'Thử lại',
                style: 'default',
                onPress: async () => {
                  // Tăng retry counter
                  retryCountRef.current += 1;
                  // Set flag đang retry
                  isRetryingRef.current = true;
                  // Reset processed flag để cho phép thử lại
                  paymentProcessedRef.current = false;

                  console.log(`🔄 Retry attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}...`);

                  try {
                    // Tạo payment URL mới thay vì dùng lại URL cũ
                    isCreatingNewPaymentUrlRef.current = true;

                    // Lấy order amount nếu chưa có
                    let amount = orderAmountRef.current;
                    if (!amount) {
                      console.log('📦 Fetching order details to get amount...');
                      const orderResponse = await fetchOrderById(orderId);
                      if (orderResponse.success && orderResponse.data) {
                        amount = orderResponse.data.totalAmount || orderResponse.data.total || 0;
                        orderAmountRef.current = amount;
                      } else {
                        throw new Error('Không thể lấy thông tin đơn hàng');
                      }
                    }

                    if (!amount || amount <= 0) {
                      throw new Error('Số tiền thanh toán không hợp lệ');
                    }

                    // Tạo payment URL mới
                    console.log('🔄 Creating new payment URL for retry...');
                    // Không truyền returnUrl - backend sẽ dùng HTTP URL và lưu appReturnUrl vào metadata
                    const paymentResponse = await createVNPayPayment({
                      orderId,
                      amount,
                      orderInfo: `Thanh toan don hang ${orderId}`,
                      // Không truyền returnUrl - backend sẽ tự xử lý
                    });

                    if (paymentResponse.success && paymentResponse.data?.payUrl) {
                      const newPaymentUrl = paymentResponse.data.payUrl;
                      paymentUrlRef.current = newPaymentUrl;
                      console.log('✅ New payment URL created, loading...');

                      // Load payment URL mới
                      if (webViewRef.current) {
                        const escapedUrl = newPaymentUrl.replace(/'/g, "\\'");
                        setTimeout(() => {
                          isCreatingNewPaymentUrlRef.current = false;
                          webViewRef.current.injectJavaScript(
                            `window.location.href = '${escapedUrl}'; true;`
                          );
                        }, 500);
                      }
                    } else {
                      throw new Error(paymentResponse.message || 'Không thể tạo payment URL mới');
                    }
                  } catch (error: any) {
                    console.error('❌ Error creating new payment URL:', error);
                    isCreatingNewPaymentUrlRef.current = false;
                    isRetryingRef.current = false;
                    Alert.alert(
                      'Lỗi',
                      error.message || 'Không thể tạo payment URL mới. Vui lòng thử lại sau.',
                      [{text: 'Đóng', onPress: () => navigation.goBack()}],
                    );
                  }
                },
              },
              {
                text: 'Quay lại',
                style: 'cancel',
                onPress: () => {
                  paymentProcessedRef.current = true;
                  retryCountRef.current = 0; // Reset retry counter
                  navigation.goBack();
                },
              },
            ],
          );
        } else {
          // Nếu không thể thử lại, chỉ hiển thị alert đóng
          paymentProcessedRef.current = true;
          retryCountRef.current = 0; // Reset retry counter
          navigation.goBack();
          const finalMessage =
            retryCountRef.current >= MAX_RETRY_ATTEMPTS
              ? 'Đã vượt quá số lần thử lại. ' + (errorMessage || 'Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác.')
              : errorMessage || 'Giao dịch thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.';
          Alert.alert('Thanh toán thất bại', finalMessage, [{text: 'Đóng', style: 'default'}]);
        }
      }, 1000);
    },
    [navigation, orderId],
  );

  /**
   * Xử lý navigation state change
   */
  const handleNavigationStateChange = useCallback(
    (navState: any) => {
      setCanGoBack(navState.canGoBack);
      setLoading(navState.loading);

      console.log('🔍 Navigation state changed:', navState.url);

      try {
        // Nếu đang retry và đây là payment URL gốc, reset retry flag và cho phép tiếp tục
        if (isRetryingRef.current && navState.url === paymentUrlRef.current) {
          console.log('✅ Successfully navigated to payment URL during retry');
          isRetryingRef.current = false;
          // Không return, cho phép tiếp tục xử lý
        }

        // Xử lý VNPay error page (chỉ khi không đang retry hoặc đã quay lại error page sau retry)
        if (isVNPayErrorPage(navState.url)) {
          // Nếu đang retry, đợi một chút để xem có load được payment URL không
          if (isRetryingRef.current) {
            console.log('⏳ Error page detected during retry, waiting...');
            return; // Bỏ qua lần này, sẽ xử lý ở lần sau
          }

          // Ngăn chặn xử lý nếu đã processed
          if (paymentProcessedRef.current) {
            return;
          }

          console.log('❌ VNPay error page detected:', navState.url);
          const vnpayParams = parseVNPayUrl(navState.url);
          const errorCode = vnpayParams.code || 'Unknown';
          console.log('VNPay error code:', errorCode);

          // Map error code thành message
          const errorMessages: Record<string, string> = {
            '03': 'Thẻ/Tài khoản của bạn đã bị khóa hoặc chưa đăng ký dịch vụ InternetBanking',
            '04': 'Thẻ/Tài khoản của bạn chưa đăng ký làm thẻ thanh toán online',
            '05': 'Giao dịch không thành công do tài khoản của bạn không đủ số dư để thực hiện giao dịch',
            '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
            '09': 'Thẻ/Tài khoản của bạn chưa đăng ký dịch vụ',
            '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
            '11': 'Đã hết hạn chờ thanh toán. Vui lòng vui lòng thực hiện lại giao dịch',
            '12': 'Thẻ/Tài khoản của bạn bị khóa',
            '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP)',
            '51': 'Tài khoản của bạn không đủ số dư để thực hiện giao dịch',
            '65': 'Tài khoản của bạn đã vượt quá hạn mức giao dịch trong ngày',
            '75': 'Ngân hàng thanh toán đang bảo trì',
            '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
          };

          const errorMessage =
            errorMessages[errorCode] ||
            `Giao dịch không thành công. Mã lỗi: ${errorCode}`;
          handlePaymentFailed(errorMessage);
          return;
        }

        // Xử lý VNPay callback
        if (isVNPayCallbackUrl(navState.url) && !isVNPayErrorPage(navState.url)) {
          const vnpayParams = parseVNPayUrl(navState.url);
          const responseCode = vnpayParams.vnp_ResponseCode;
          const status = vnpayParams.status;

          console.log('VNPay callback params:', {responseCode, status, url: navState.url});

          if (responseCode === '00' || status === 'success') {
            handlePaymentSuccess(orderId);
            return;
          } else if (responseCode && responseCode !== '00') {
            console.log('VNPay payment failed with code:', responseCode);

            // Map response code thành message
            const errorMessages: Record<string, string> = {
              '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ',
              '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ',
              '10': 'Xác thực thông tin thẻ/tài khoản không đúng',
              '11': 'Đã hết hạn chờ thanh toán',
              '12': 'Thẻ/Tài khoản bị khóa',
              '51': 'Tài khoản không đủ số dư',
              '65': 'Tài khoản đã vượt quá hạn mức giao dịch',
              '75': 'Ngân hàng đang bảo trì',
            };

            const errorMessage =
              errorMessages[responseCode] ||
              `Giao dịch không thành công. Mã lỗi: ${responseCode}`;
            handlePaymentFailed(errorMessage);
            return;
          }
        }

        // Xử lý MoMo redirect
        if (isMoMoRedirectUrl(navState.url)) {
          console.log('🔍 Processing MoMo redirect URL:', navState.url);
          const params = parsePaymentUrl(navState.url);

          console.log('📋 URL params:', params);

          if (isPaymentSuccess(params)) {
            const finalOrderId = params?.orderId || orderId;
            handlePaymentSuccess(finalOrderId);
            return;
          } else if (isPaymentFailed(params)) {
            handlePaymentFailed();
            return;
          } else {
            console.log('⏳ Payment status unclear, waiting...', params);
          }
        }
      } catch (error) {
        console.log('URL parsing error:', error);
      }
    },
    [orderId, handlePaymentSuccess, handlePaymentFailed],
  );

  /**
   * Xử lý should start load with request (intercept navigation)
   */
  const handleShouldStartLoadWithRequest = useCallback(
    (request: any) => {
      const url = request.url;
      console.log('🔍 onShouldStartLoadWithRequest:', url);

      // Ngăn chặn xử lý nếu đã xử lý payment result (trừ khi đang retry)
      if (paymentProcessedRef.current && !isRetryingRef.current) {
        console.log('⚠️ Payment already processed, blocking navigation');
        return false;
      }

      // Nếu đang retry và đây là payment URL gốc, cho phép load
      if (isRetryingRef.current && url === paymentUrlRef.current) {
        console.log('✅ Allowing retry navigation to payment URL');
        return true;
      }

      // Xử lý VNPay error page - ngăn chặn load và xử lý lỗi ngay
      if (isVNPayErrorPage(url)) {
        // Nếu đang retry, bỏ qua error page lần đầu để cho phép reload
        if (isRetryingRef.current) {
          console.log('⏳ Retry in progress, allowing error page to load temporarily');
          // Reset retry flag sau một delay ngắn
          setTimeout(() => {
            isRetryingRef.current = false;
          }, 1000);
          return true; // Cho phép load để có thể xử lý sau
        }

        console.log('❌ VNPay error page detected in onShouldStartLoadWithRequest:', url);
        const vnpayParams = parseVNPayUrl(url);
        const errorCode = vnpayParams.code || 'Unknown';
        console.log('VNPay error code:', errorCode);

        // Map error code thành message
        const errorMessages: Record<string, string> = {
          '03': 'Thẻ/Tài khoản của bạn đã bị khóa hoặc chưa đăng ký dịch vụ InternetBanking',
          '04': 'Thẻ/Tài khoản của bạn chưa đăng ký làm thẻ thanh toán online',
          '05': 'Giao dịch không thành công do tài khoản của bạn không đủ số dư để thực hiện giao dịch',
          '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
          '09': 'Thẻ/Tài khoản của bạn chưa đăng ký dịch vụ',
          '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
          '11': 'Đã hết hạn chờ thanh toán. Vui lòng vui lòng thực hiện lại giao dịch',
          '12': 'Thẻ/Tài khoản của bạn bị khóa',
          '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP)',
          '51': 'Tài khoản của bạn không đủ số dư để thực hiện giao dịch',
          '65': 'Tài khoản của bạn đã vượt quá hạn mức giao dịch trong ngày',
          '75': 'Ngân hàng thanh toán đang bảo trì',
          '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
        };

        const errorMessage =
          errorMessages[errorCode] ||
          `Giao dịch không thành công. Mã lỗi: ${errorCode}`;
        handlePaymentFailed(errorMessage);

        // Không load error page trong WebView
        return false;
      }

      // Kiểm tra nếu là redirect URL từ MoMo
      if (isMoMoRedirectUrl(url)) {
        const params = parsePaymentUrl(url);

        if (isPaymentSuccess(params)) {
          const finalOrderId = params?.orderId || orderId;
          console.log('✅ Payment success detected in onShouldStartLoadWithRequest!', finalOrderId);
          handlePaymentSuccess(finalOrderId);

          // Không load URL này trong WebView
          return false;
        }
      }

      // Cho phép load các URL khác
      return true;
    },
    [orderId, handlePaymentSuccess, handlePaymentFailed],
  );

  /**
   * Xử lý message từ injected JavaScript
   */
  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'PAYMENT_SUCCESS') {
          console.log('✅ Payment success detected via injected script!', data.orderId);
          const finalOrderId = data.orderId || orderId;
          handlePaymentSuccess(finalOrderId);
        }
      } catch (error) {
        // Không phải JSON message, bỏ qua
      }
    },
    [orderId, handlePaymentSuccess],
  );

  /**
   * Xử lý go back
   */
  const handleGoBack = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      Alert.alert(
        'Hủy thanh toán',
        'Bạn có chắc muốn hủy thanh toán?',
        [
          {
            text: 'Tiếp tục thanh toán',
            style: 'cancel',
          },
          {
            text: 'Hủy',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    }
  }, [canGoBack, navigation]);

  /**
   * Get payment method name
   */
  const getPaymentMethodName = useCallback(() => {
    switch (paymentMethod.toUpperCase()) {
      case 'VNPAY':
        return 'VNPay';
      case 'MOMO':
        return 'MoMo';
      default:
        return 'Thanh toán';
    }
  }, [paymentMethod]);

  /**
   * Reload payment page để thử lại
   */
  const retryPayment = useCallback(() => {
    if (webViewRef.current && paymentUrlRef.current) {
      if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
        Alert.alert(
          'Đã vượt quá số lần thử lại',
          'Bạn đã thử lại quá nhiều lần. Vui lòng quay lại và thử lại sau.',
          [{text: 'Đóng', onPress: () => navigation.goBack()}],
        );
        return;
      }

      retryCountRef.current += 1;
      isRetryingRef.current = true;
      paymentProcessedRef.current = false;
      console.log(`🔄 Retry attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}...`);
      // Navigate về payment URL gốc bằng injectJavaScript
      const escapedUrl = paymentUrlRef.current.replace(/'/g, "\\'");
      setTimeout(() => {
        webViewRef.current.injectJavaScript(
          `window.location.href = '${escapedUrl}'; true;`
        );
      }, 500);
    }
  }, [navigation]);

  return {
    webViewRef,
    loading,
    canGoBack,
    handleNavigationStateChange,
    handleShouldStartLoadWithRequest,
    handleMessage,
    handleGoBack,
    getPaymentMethodName,
    retryPayment,
  };
};

