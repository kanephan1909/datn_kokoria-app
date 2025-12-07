import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {usePaymentWebView} from '../hooks/usePaymentWebView';
import {getPaymentInjectedScript} from '../utils/paymentInjectedScript';
import {testMoMoPaymentSuccess} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';

// Import WebView với error handling
let WebView: any;
try {
  const webviewModule = require('react-native-webview');
  WebView = webviewModule?.default || webviewModule?.WebView || webviewModule;
  if (!WebView) {
    throw new Error('WebView module not found');
  }
} catch (error) {
  console.error('WebView import error:', error);
  WebView = null;
}

const PaymentWebViewScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const routeParams = route.params as {
    paymentUrl: string;
    orderId: string;
    paymentMethod: string;
    orderAmount?: number;
  };

  const {paymentUrl, orderId, paymentMethod, orderAmount} = routeParams;

  // Sử dụng custom hook để xử lý payment logic
  const {
    webViewRef,
    loading,
    handleNavigationStateChange,
    handleShouldStartLoadWithRequest,
    handleMessage,
    handleGoBack,
    getPaymentMethodName,
  } = usePaymentWebView({orderId, paymentMethod, paymentUrl, orderAmount});

  // Validate params
  useEffect(() => {
    if (!paymentUrl) {
      console.error('PaymentWebView: paymentUrl is missing!', routeParams);
      Alert.alert(
        'Lỗi',
        'Không có URL thanh toán. Vui lòng thử lại.',
        [
          {
            text: 'Quay lại',
            onPress: () => navigation.goBack(),
          },
        ],
      );
      return;
    }
    if (!orderId) {
      console.error('PaymentWebView: orderId is missing!', routeParams);
      Alert.alert(
        'Lỗi',
        'Không có thông tin đơn hàng. Vui lòng thử lại.',
        [
          {
            text: 'Quay lại',
            onPress: () => navigation.goBack(),
          },
        ],
      );
      return;
    }
    console.log('PaymentWebView initialized:', {
      hasPaymentUrl: !!paymentUrl,
      paymentUrlLength: paymentUrl?.length,
      orderId,
      paymentMethod,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kiểm tra WebView có sẵn không
  if (!WebView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lỗi</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            WebView chưa được cài đặt đúng.{'\n'}
            Vui lòng rebuild ứng dụng.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getPaymentMethodName()}</Text>
        {/* TEST Button - chỉ hiển thị khi paymentMethod là MOMO và đang ở môi trường dev */}
        {paymentMethod === 'MOMO' && __DEV__ ? (
          <TouchableOpacity
            onPress={async () => {
              Alert.alert(
                'Test Payment',
                'Bạn có muốn simulate thanh toán thành công?',
                [
                  {text: 'Hủy', style: 'cancel'},
                  {
                    text: 'OK',
                    onPress: async () => {
                      try {
                        await testMoMoPaymentSuccess(orderId);
                        // Navigate to confirmation screen
                        setTimeout(() => {
                          (navigation as any).replace(MainRoutes.OrderConfirmation, {
                            orderId: orderId,
                          });
                        }, 500);
                      } catch (error: any) {
                        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể test payment');
                      }
                    },
                  },
                ],
              );
            }}
            style={styles.testButton}>
            <Text style={styles.testButtonText}>TEST</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{uri: paymentUrl}}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onError={(syntheticEvent: any) => {
          const {nativeEvent} = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
          Alert.alert('Lỗi', 'Không thể tải trang thanh toán. Vui lòng thử lại.');
        }}
        onHttpError={(syntheticEvent: any) => {
          const {nativeEvent} = syntheticEvent;
          console.error('WebView HTTP error: ', nativeEvent);
        }}
        onMessage={handleMessage}
        injectedJavaScript={getPaymentInjectedScript()}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
          </View>
        )}
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Đang xử lý...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PaymentWebViewScreen;
