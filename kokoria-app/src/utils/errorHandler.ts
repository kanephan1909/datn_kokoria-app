import {Alert} from 'react-native';

/**
 * Xử lý lỗi từ API và hiển thị thông báo phù hợp
 * @param error - Lỗi từ API call
 * @param customMessage - Thông báo tùy chỉnh (optional)
 */
export const handleApiError = (error: any, customMessage?: string) => {
  // Kiểm tra nếu là lỗi network/backend offline
  if (error?.isNetworkError || error?.isBackendOffline) {
    const message = error?.message || customMessage || 'Backend server chưa chạy!';
    
    Alert.alert(
      '❌ Lỗi kết nối',
      message,
      [
        {
          text: 'Đã hiểu',
          style: 'default',
        },
      ],
      {cancelable: true},
    );
    return;
  }

  // Lỗi từ server (có response)
  if (error?.response) {
    const status = error.response.status;
    const serverMessage = error.response?.data?.message || error.message;

    let alertTitle = '❌ Lỗi';
    let alertMessage = serverMessage || 'Đã xảy ra lỗi. Vui lòng thử lại.';

    switch (status) {
      case 400:
        alertTitle = '⚠️ Yêu cầu không hợp lệ';
        break;
      case 401:
        alertTitle = '🔒 Phiên đăng nhập hết hạn';
        alertMessage = 'Vui lòng đăng nhập lại.';
        break;
      case 403:
        alertTitle = '🚫 Không có quyền truy cập';
        break;
      case 404:
        alertTitle = '🔍 Không tìm thấy';
        break;
      case 429:
        alertTitle = '⏱ Quá nhiều yêu cầu';
        alertMessage = 'Vui lòng đợi vài phút trước khi thử lại.';
        break;
      case 500:
        alertTitle = '🔧 Lỗi server';
        alertMessage = 'Server đang gặp sự cố. Vui lòng thử lại sau.';
        break;
      case 503:
        alertTitle = '🔧 Server không khả dụng';
        alertMessage = 'Server đang bảo trì. Vui lòng thử lại sau.';
        break;
      default:
        alertTitle = `❌ Lỗi ${status}`;
    }

    Alert.alert(alertTitle, alertMessage, [{text: 'OK', style: 'default'}]);
    return;
  }

  // Lỗi khác (timeout, unknown, etc.)
  const message = customMessage || error?.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
  
  Alert.alert(
    '❌ Lỗi',
    message,
    [{text: 'OK', style: 'default'}],
  );
};

/**
 * Kiểm tra xem lỗi có phải là lỗi backend offline không
 */
export const isBackendOffline = (error: any): boolean => {
  return (
    error?.isNetworkError === true ||
    error?.isBackendOffline === true ||
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNREFUSED' ||
    (!error?.response && error?.message?.includes('Network'))
  );
};

/**
 * Lấy thông báo lỗi thân thiện từ error object
 */
export const getErrorMessage = (error: any): string => {
  if (error?.isNetworkError || error?.isBackendOffline) {
    return error?.message || 'Backend server chưa chạy. Vui lòng kiểm tra lại.';
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
};

