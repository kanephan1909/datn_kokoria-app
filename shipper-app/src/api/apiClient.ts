import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - tương tự adminpanel-app
const API_BASE_URL = 'http://10.0.2.2:3000/api/v1';

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
