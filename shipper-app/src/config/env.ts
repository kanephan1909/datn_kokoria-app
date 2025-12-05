/**
 * Environment Configuration cho shipper-app
 * Quản lý các biến môi trường
 */

interface EnvConfig {
  GOOGLE_MAPS_API_KEY: string;
  API_BASE_URL?: string;
  SOCKET_URL?: string;
}

// ============================================
// CẤU HÌNH API KEY TẠI ĐÂY
// ============================================
// Lấy API key từ: https://console.cloud.google.com/google/maps-apis
// Bật các API: Maps SDK for Android, Maps SDK for iOS, Distance Matrix API, Directions API
const HARDCODED_GOOGLE_MAPS_API_KEY = 'AIzaSyA-SkUtfGlqdwhs1qeRPjQuXkn3KrlbdHo';

// ============================================

const getEnvConfig = (): EnvConfig => {
  // Ưu tiên 1: Sử dụng react-native-config nếu có
  try {
    const Config = require('react-native-config').default;
    if (Config.GOOGLE_MAPS_API_KEY && Config.GOOGLE_MAPS_API_KEY !== 'AIzaSyA-SkUtfGlqdwhs1qeRPjQuXkn3KrlbdHo') {
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
  if (HARDCODED_GOOGLE_MAPS_API_KEY && HARDCODED_GOOGLE_MAPS_API_KEY !== 'AIzaSyA-SkUtfGlqdwhs1qeRPjQuXkn3KrlbdHo') {
    return {
      GOOGLE_MAPS_API_KEY: HARDCODED_GOOGLE_MAPS_API_KEY,
      API_BASE_URL: undefined,
      SOCKET_URL: undefined,
    };
  }

  // Fallback: giá trị mặc định
  return {
    GOOGLE_MAPS_API_KEY: 'AIzaSyA-SkUtfGlqdwhs1qeRPjQuXkn3KrlbdHo',
    API_BASE_URL: undefined,
    SOCKET_URL: undefined,
  };
};

export const env = getEnvConfig();

// Export các biến môi trường thường dùng
export const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;
export const API_BASE_URL = env.API_BASE_URL;
export const SOCKET_URL = env.SOCKET_URL;
