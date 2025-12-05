/**
 * Environment Configuration
 * Quản lý các biến môi trường cho ứng dụng
 *
 * CÁCH SỬ DỤNG:
 * 1. Cách 1 (Khuyến nghị): Cài react-native-config
 *    - npm install react-native-config
 *    - Tạo file .env trong thư mục root
 *    - Thêm GOOGLE_MAPS_API_KEY=your_api_key vào .env
 *    - Rebuild app: npx react-native run-android
 *
 * 2. Cách 2: Hardcode trực tiếp trong file này (chỉ dùng cho development)
 *    - Thay YOUR_GOOGLE_MAPS_API_KEY bằng API key thật của bạn
 *    - Lưu ý: Không commit API key thật lên git!
 */

interface EnvConfig {
  GOOGLE_MAPS_API_KEY: string;
  API_BASE_URL?: string;
  SOCKET_URL?: string;
}

// ============================================
// CẤU HÌNH API KEY TẠI ĐÂY (Cách 2 - Development)
// ============================================
// Thay YOUR_GOOGLE_MAPS_API_KEY bằng API key thật của bạn
// Lấy API key từ: https://console.cloud.google.com/google/maps-apis
// Bật các API: Maps SDK for Android, Maps SDK for iOS, Geocoding API, Directions API
const HARDCODED_GOOGLE_MAPS_API_KEY = 'AIzaSyCXzcgigGuTcQ0H3meiX11tF7g1yiF47Ss';

// ============================================

const getEnvConfig = (): EnvConfig => {
  // Ưu tiên 1: Sử dụng react-native-config nếu có
  try {
    const Config = require('react-native-config').default;
    if (Config.GOOGLE_MAPS_API_KEY && Config.GOOGLE_MAPS_API_KEY !== 'AIzaSyCXzcgigGuTcQ0H3meiX11tF7g1yiF47Ss') {
      return {
        GOOGLE_MAPS_API_KEY: Config.GOOGLE_MAPS_API_KEY,
        API_BASE_URL: Config.API_BASE_URL,
        SOCKET_URL: Config.SOCKET_URL,
      };
    }
  } catch (error) {
    // react-native-config chưa được cài đặt, bỏ qua
  }

  // Ưu tiên 2: Sử dụng hardcoded value
  if (HARDCODED_GOOGLE_MAPS_API_KEY && HARDCODED_GOOGLE_MAPS_API_KEY !== 'AIzaSyCXzcgigGuTcQ0H3meiX11tF7g1yiF47Ss') {
    return {
      GOOGLE_MAPS_API_KEY: HARDCODED_GOOGLE_MAPS_API_KEY,
      API_BASE_URL: undefined,
      SOCKET_URL: undefined,
    };
  }

  // Fallback: giá trị mặc định (sẽ không hoạt động)
  return {
    GOOGLE_MAPS_API_KEY: 'AIzaSyCXzcgigGuTcQ0H3meiX11tF7g1yiF47Ss',
    API_BASE_URL: undefined,
    SOCKET_URL: undefined,
  };
};

export const env = getEnvConfig();

// Export các biến môi trường thường dùng
export const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;
export const API_BASE_URL = env.API_BASE_URL;
export const SOCKET_URL = env.SOCKET_URL;
