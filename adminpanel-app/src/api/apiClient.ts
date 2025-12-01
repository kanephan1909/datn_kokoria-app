import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_BASE_URL = 'http://localhost:3000/api/v1';
const API_BASE_URL = 'http://10.0.2.2:3000/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {"Content-Type": "application/json"},
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
                // Refresh token cũng hết hạn, đăng xuất
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
                // Có thể navigate đến login screen
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);


// Categories API
export const fetchCategories = async () => (await api.get('/categories')).data;
export const fetchCategory = async (id:string) => (await api.get(`/categories/${id}`)).data;
export const createCategory = async (data:{name:string,imageUrl?:string,isActive?:boolean}) => (await api.post('/categories', data)).data;
export const updateCategory = async (id:string, data:{name?:string,imageUrl?:string,isActive?:boolean}) => (await api.put(`/categories/${id}`, data)).data;
export const deleteCategory = async (id:string) => (await api.delete(`/categories/${id}`)).data;

// Auth API
export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
        await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
        await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
    return response.data;
};

export const register = async (data: { name: string; email: string; password: string; phone?: string }) => {
    const response = await api.post('/auth/register', data);
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

// Products API
export const fetchProducts = async (params?: { categoryId?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return (await api.get(`/products?${queryParams.toString()}`)).data;
};

export const fetchProductById = async (id: string) => (await api.get(`/products/${id}`)).data;
export const createProduct = async (data: { name: string; price: number; imageUrl?: string; description?: string; categoryId: string; stock?: number; isActive?: boolean }) => (await api.post('/products', data)).data;
export const updateProduct = async (id: string, data: { name?: string; price?: number; imageUrl?: string; description?: string; categoryId?: string; stock?: number; isActive?: boolean }) => (await api.put(`/products/${id}`, data)).data;
export const deleteProduct = async (id: string) => (await api.delete(`/products/${id}`)).data;

// Users API
export const fetchUsers = async (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);
    return (await api.get(`/users?${queryParams.toString()}`)).data;
};

export const fetchUserById = async (id: string) => (await api.get(`/users/${id}`)).data;
export const createUser = async (data: { name: string; email: string; password: string; phone?: string; role?: string }) => (await api.post('/users', data)).data;
export const updateUser = async (id: string, data: { name?: string; email?: string; password?: string; phone?: string; role?: string }) => (await api.put(`/users/${id}`, data)).data;
export const deleteUser = async (id: string) => (await api.delete(`/users/${id}`)).data;

// Orders API
export const fetchOrders = async (params?: { page?: number; limit?: number; status?: string; userId?: string; driverId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.driverId) queryParams.append('driverId', params.driverId);
    return (await api.get(`/orders?${queryParams.toString()}`)).data;
};

export const fetchOrderById = async (id: string) => (await api.get(`/orders/${id}`)).data;
export const createOrder = async (data: any) => (await api.post('/orders', data)).data;
export const confirmOrder = async (id: string, message?: string) => (await api.put(`/orders/${id}/confirm`, { message })).data;
export const updateOrderStatus = async (id: string, status: string, message?: string) => (await api.put(`/orders/${id}/status`, { status, message })).data;

// Dashboard API
export const fetchDashboardStats = async () => (await api.get('/dashboard/stats')).data;

// Drivers API
export const fetchDrivers = async (params?: { page?: number; limit?: number; isOnline?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isOnline) queryParams.append('isOnline', params.isOnline);
    return (await api.get(`/drivers?${queryParams.toString()}`)).data;
};

export const fetchDriverById = async (id: string) => (await api.get(`/drivers/${id}`)).data;
export const createDriver = async (data: { name: string; phone: string; avatar?: string; isOnline?: boolean; deviceToken?: string }) => (await api.post('/drivers', data)).data;
export const updateDriver = async (id: string, data: { name?: string; phone?: string; avatar?: string; isOnline?: boolean; deviceToken?: string; currentLat?: number; currentLng?: number }) => (await api.put(`/drivers/${id}`, data)).data;
export const deleteDriver = async (id: string) => (await api.delete(`/drivers/${id}`)).data;
export const updateDriverLocation = async (id: string, latitude: number, longitude: number) => (await api.post(`/drivers/${id}/location`, { latitude, longitude })).data;

// Vouchers API
export const fetchVouchers = async (params?: { page?: number; limit?: number; expired?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.expired) queryParams.append('expired', params.expired);
    return (await api.get(`/vouchers?${queryParams.toString()}`)).data;
};

export const fetchVoucherById = async (id: string) => (await api.get(`/vouchers/${id}`)).data;
export const fetchVoucherByCode = async (code: string) => (await api.get(`/vouchers/code/${code}`)).data;
export const createVoucher = async (data: { code: string; discount: number; minOrder?: number; maxDeduct?: number; expiry: string }) => (await api.post('/vouchers', data)).data;
export const updateVoucher = async (id: string, data: { code?: string; discount?: number; minOrder?: number; maxDeduct?: number; expiry?: string }) => (await api.put(`/vouchers/${id}`, data)).data;
export const deleteVoucher = async (id: string) => (await api.delete(`/vouchers/${id}`)).data;

// Upload API
export const uploadImage = async (imageUri: string) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('image', {
        uri: imageUri,
        type: type,
        name: filename,
    } as any);

    return (await api.post('/upload/image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })).data;
};
