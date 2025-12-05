import {useCallback, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {confirmPaymentSuccess} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';
import {
  parsePaymentUrl,
  isMoMoRedirectUrl,
  isVNPayCallbackUrl,
  isPaymentSuccess,
  isPaymentFailed,
} from '../utils/paymentUrlParser';

interface UsePaymentWebViewParams {
  orderId: string;
  paymentMethod: string;
}

export const usePaymentWebView = ({orderId, paymentMethod}: UsePaymentWebViewParams) => {
  const navigation = useNavigation();
  const webViewRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  /**
   * Xử lý payment success - confirm với backend và navigate
   */
  const handlePaymentSuccess = useCallback(
    (finalOrderId: string) => {
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
  const handlePaymentFailed = useCallback(() => {
    console.log('❌ Payment failed');
    setTimeout(() => {
      navigation.goBack();
      Alert.alert('Thất bại', 'Thanh toán thất bại. Vui lòng thử lại.');
    }, 1000);
  }, [navigation]);

  /**
   * Xử lý navigation state change
   */
  const handleNavigationStateChange = useCallback(
    (navState: any) => {
      setCanGoBack(navState.canGoBack);
      setLoading(navState.loading);

      console.log('🔍 Navigation state changed:', navState.url);

      try {
        // Xử lý VNPay callback
        if (isVNPayCallbackUrl(navState.url)) {
          const params = parsePaymentUrl(navState.url);
          const url = new URL(navState.url);
          const responseCode = url.searchParams.get('vnp_ResponseCode');
          const status = url.searchParams.get('status');

          if (responseCode === '00' || status === 'success') {
            handlePaymentSuccess(orderId);
            return;
          } else if (responseCode && responseCode !== '00') {
            handlePaymentFailed();
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
    [orderId, handlePaymentSuccess],
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

  return {
    webViewRef,
    loading,
    canGoBack,
    handleNavigationStateChange,
    handleShouldStartLoadWithRequest,
    handleMessage,
    handleGoBack,
    getPaymentMethodName,
  };
};

