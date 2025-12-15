import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// CẤU HÌNH API URL
// ============================================
// Để kết nối với thiết bị thật:
// 1. Kiểm tra IP máy tính: 
//    - Windows: mở CMD, gõ "ipconfig", tìm "IPv4 Address" (ví dụ: 192.168.1.100)
//    - Mac/Linux: mở Terminal, gõ "ifconfig" hoặc "ip addr", tìm IP của máy
// 2. Thay đổi SERVER_IP bên dưới bằng IP thật của máy tính
// 3. Đảm bảo điện thoại và máy tính cùng mạng WiFi
// ============================================

// IP máy tính - THAY ĐỔI KHI KẾT NỐI VỚI THIẾT BỊ THẬT
// Emulator: '10.0.2.2'
// Thiết bị thật: IP máy tính (ví dụ: '192.168.1.100')
const SERVER_IP = '10.0.2.2'; // ⚠️ THAY ĐỔI IP NÀY KHI DÙNG THIẾT BỊ THẬT
const SERVER_PORT = '3000';

const getApiBaseUrl = () => {
  // Có thể override bằng biến môi trường
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  return `http://${SERVER_IP}:${SERVER_PORT}/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();

// Export để dùng cho socket
export const getBaseUrl = () => {
  // Lấy base URL không có /api/v1
  return API_BASE_URL.replace('/api/v1', '');
};

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {"Content-Type": "application/json"},
    timeout: 30000, // 30 seconds timeout
});

// Thêm token vào request nếu có
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Xử lý response và refresh token nếu cần
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Xử lý lỗi network
        if (!error.response) {
            const networkError = new Error('Network Error');
            (networkError as any).isNetworkError = true;
            (networkError as any).message = `❌ Không thể kết nối đến backend server!\n\nVui lòng kiểm tra backend server đã được khởi động chưa.`;
            return Promise.reject(networkError);
        }
        
        // Nếu token hết hạn (401) và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });
                    
                    const { accessToken } = response.data.data;
                    await AsyncStorage.setItem('accessToken', accessToken);
                    
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

// ==================== AUTH API ====================
export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
        await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
        await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
    return response.data;
};

export const logout = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
};

export const getMe = async () => (await api.get('/auth/me')).data;

// ==================== ORDERS API ====================
// Lấy danh sách đơn sẵn sàng (chưa có driver) - cho shipper nhận đơn
export const fetchAvailableOrders = async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    // Sử dụng endpoint /orders/available để lấy đơn hàng chưa có driver
    return (await api.get(`/orders/available?${queryParams.toString()}`)).data;
};

// Lấy đơn đã nhận của shipper (PICKED_UP, DELIVERING)
export const fetchMyOrders = async (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    // Backend sẽ tự động filter theo driverId từ token
    return (await api.get(`/orders?${queryParams.toString()}`)).data;
};

// Lấy chi tiết đơn
export const fetchOrderById = async (id: string) => (await api.get(`/orders/${id}`)).data;

// Nhận đơn (accept order)
export const acceptOrder = async (orderId: string) => {
    const response = await getMe();
    if (!response.success || !response.data) {
        throw new Error('Không thể lấy thông tin driver');
    }
    const driverId = response.data.id;
    return (await api.put(`/orders/${orderId}/accept`, { driverId })).data;
};

// Cập nhật trạng thái đơn
export const updateOrderStatus = async (id: string, status: string, message?: string) => 
    (await api.put(`/orders/${id}/status`, { status, message })).data;

// ==================== DRIVER API ====================
// Cập nhật vị trí driver
export const updateDriverLocation = async (latitude: number, longitude: number) => {
    const response = await getMe();
    if (!response.success || !response.data) {
        throw new Error('Không thể lấy thông tin driver');
    }
    const driverId = response.data.id;
    return (await api.post(`/drivers/${driverId}/location`, { latitude, longitude })).data;
};

// Cập nhật trạng thái online/offline
export const updateDriverStatus = async (isOnline: boolean) => {
    const response = await getMe();
    if (!response.success || !response.data) {
        throw new Error('Không thể lấy thông tin driver');
    }
    const driverId = response.data.id;
    return (await api.put(`/drivers/${driverId}`, { isOnline })).data;
};

// ==================== RATINGS API ====================
export interface Rating {
    id: string;
    orderId: string;
    userId: string;
    driverId: string;
    rating: number; // 1-5
    comment?: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string;
    };
    order?: {
        id: string;
        totalAmount: number;
    };
}

export interface DriverRatingsResponse {
    ratings: Rating[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    averageRating: number;
}

// Lấy ratings của driver hiện tại (tự động tìm driver từ user)
export const fetchMyDriverRatings = async (params?: { page?: number; limit?: number }): Promise<DriverRatingsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await api.get(`/ratings/driver/me?${queryParams.toString()}`);
    return response.data.data; // Return data from response.data.data
};

// Lấy tất cả ratings của driver (by driverId - for admin or public)
export const fetchDriverRatings = async (driverId: string, params?: { page?: number; limit?: number }): Promise<DriverRatingsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await api.get(`/ratings/driver/${driverId}?${queryParams.toString()}`);
    return response.data.data; // Return data from response.data.data
};

// Lấy rating của một order cụ thể
export const getOrderRating = async (orderId: string): Promise<{ success: boolean; data?: Rating; message?: string }> => {
    try {
        const response = await api.get(`/ratings/order/${orderId}`);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return { success: false, message: 'Rating not found' };
        }
        throw error;
    }
};

// ==================== MESSAGES API ====================
export interface Message {
    id: string;
    orderId: string;
    senderId: string;
    text: string;
    createdAt: string;
}

export const fetchOrderMessages = async (orderId: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return (await api.get(`/messages/order/${orderId}?${queryParams.toString()}`)).data;
};

export const sendMessage = async (orderId: string, text: string) => {
    return (await api.post('/messages', { orderId, text })).data;
};

export const deleteMessage = async (messageId: string) => {
    return (await api.delete(`/messages/${messageId}`)).data;
};
