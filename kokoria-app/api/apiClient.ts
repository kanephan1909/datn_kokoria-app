import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - có thể thay đổi tùy theo môi trường
// Đối với Android emulator: http://10.0.2.2:3000/api/v1
// Đối với iOS simulator: http://localhost:3000/api/v1
// Đối với thiết bị thật: http://<IP_MÁY>:3000/api/v1

// Tự động detect môi trường hoặc sử dụng biến môi trường
const getApiBaseUrl = () => {
  // Nếu có biến môi trường, ưu tiên sử dụng
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // Mặc định cho Android emulator
  // Nếu không hoạt động, thử các URL khác:
  // - http://localhost:3000/api/v1 (cho Genymotion hoặc một số emulator)
  // - http://127.0.0.1:3000/api/v1
  // - http://<IP_MÁY_CỦA_BẠN>:3000/api/v1 (cho thiết bị thật)
  
  return 'http://10.0.2.2:3000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {'Content-Type': 'application/json'},
  timeout: 10000, // 10 seconds timeout
});

// Thêm token vào request nếu có
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Xử lý response và refresh token nếu cần
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Xử lý lỗi network - Backend không chạy hoặc không kết nối được
    if (!error.response) {
      // Network error - không có response từ server
      const networkError = new Error('Network Error');
      (networkError as any).isNetworkError = true;
      (networkError as any).isBackendOffline = true;
      
      // Xác định loại lỗi và thông báo phù hợp
      let errorMessage = '';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = '⏱ Request timeout. Vui lòng thử lại.';
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        errorMessage = `Backend server chưa chạy!\n\n` +
          `Vui lòng kiểm tra:\n` +
          `• Backend server đã được khởi động chưa?\n` +
          `• Đúng địa chỉ API: ${API_BASE_URL}\n` +
          `• Kết nối mạng có ổn định không?\n\n`;
      } else if (error.message?.includes('Network request failed')) {
        errorMessage = `❌ Không thể kết nối đến backend server!\n\n` +
          `Có thể do:\n` +
          `• Backend server chưa được khởi động\n` +
          `• URL API không đúng: ${API_BASE_URL}\n` +
          `• Mạng không kết nối được\n\n` +
          `Vui lòng kiểm tra lại backend server và thử lại.`;
      } else {
        errorMessage = `❌ Lỗi kết nối!\n\n` +
          `Không thể kết nối đến backend server tại:\n${API_BASE_URL}\n\n` +
          `Vui lòng đảm bảo backend server đã được khởi động.`;
      }
      
      (networkError as any).message = errorMessage;
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

          const {accessToken} = response.data.data;
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
  },
);

// ==================== AUTH API ====================
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', {email, password});
  if (response.data.success) {
    await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
  }
  return response.data;
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) => {
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

// ==================== FORGOT PASSWORD API ====================
/**
 * Gửi email chứa mã xác nhận để đặt lại mật khẩu
 * @param email - Email của người dùng
 */
export const forgotPasswordByEmail = async (email: string) => {
  try {
    const response = await api.post('/auth/forgot-password/email', {email});
    return response.data;
  } catch (error: any) {
    // Nếu backend chưa có endpoint này, trả về error message thân thiện
    if (error.response?.status === 404) {
      return {
        success: false,
        message:
          'Chức năng quên mật khẩu qua email chưa được triển khai trên server. Vui lòng liên hệ admin.',
      };
    }
    throw error;
  }
};

/**
 * Gửi SMS chứa mã xác nhận để đặt lại mật khẩu
 * @param phone - Số điện thoại của người dùng
 */
export const forgotPasswordBySMS = async (phone: string) => {
  try {
    const response = await api.post('/auth/forgot-password/sms', {phone});
    return response.data;
  } catch (error: any) {
    // Nếu backend chưa có endpoint này, trả về error message thân thiện
    if (error.response?.status === 404) {
      return {
        success: false,
        message:
          'Chức năng quên mật khẩu qua SMS chưa được triển khai trên server. Vui lòng liên hệ admin.',
      };
    }
    throw error;
  }
};

/**
 * Đặt lại mật khẩu với mã xác nhận (qua Email hoặc SMS)
 * @param data - { email?, phone?, code, newPassword, method: 'email' | 'sms' }
 */
export const resetPassword = async (data: {
  email?: string;
  phone?: string;
  code: string;
  newPassword: string;
  method: 'email' | 'sms';
}) => {
  try {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  } catch (error: any) {
    // Nếu backend chưa có endpoint này, trả về error message thân thiện
    if (error.response?.status === 404) {
      return {
        success: false,
        message:
          'Chức năng đặt lại mật khẩu chưa được triển khai trên server. Vui lòng liên hệ admin.',
      };
    }
    throw error;
  }
};

// Backward compatibility - giữ lại function cũ
export const forgotPassword = forgotPasswordByEmail;

// ==================== CATEGORIES API ====================
export const fetchCategories = async () => (await api.get('/categories')).data;
export const fetchCategory = async (id: string) =>
  (await api.get(`/categories/${id}`)).data;

// ==================== PRODUCTS API ====================
export const fetchProducts = async (params?: {
  categoryId?: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.categoryId) {
    queryParams.append('categoryId', params.categoryId);
  }
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  return (await api.get(`/products?${queryParams.toString()}`)).data;
};

export const fetchProductById = async (id: string) =>
  (await api.get(`/products/${id}`)).data;

// ==================== ORDERS API ====================
export const fetchOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.status) {
    queryParams.append('status', params.status);
  }
  return (await api.get(`/orders?${queryParams.toString()}`)).data;
};

export const fetchOrderById = async (id: string) =>
  (await api.get(`/orders/${id}`)).data;

export const createOrder = async (data: {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  address: {
    name: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    city: string;
  };
  note?: string;
  shippingDistance?: number;
  shippingFee?: number;
  restaurantLat?: number;
  restaurantLng?: number;
  paymentMethod?: string;
  voucherCode?: string;
}) => (await api.post('/orders', data)).data;

export const cancelOrder = async (id: string, reason?: string) =>
  (await api.put(`/orders/${id}/cancel`, {reason})).data;

// ==================== CARTS API ====================
// Get current user's cart (creates if doesn't exist)
export const fetchCart = async () => {
    try {
        // First, get current user info to get userId
        const meResponse = await api.get('/auth/me');
        const userId = meResponse.data.data?.id;

        if (!userId) {
            return {
                success: false,
                message: 'User not authenticated',
                data: null,
            };
        }

        // Get user's cart
        const cartResponse = await api.get(`/carts/user/${userId}`);
        return cartResponse.data;
    } catch (error: any) {
        // Nếu lỗi 401 (unauthorized), trả về response với success: false
        if (error.response?.status === 401) {
            return {
                success: false,
                message: 'User not authenticated',
                data: null,
            };
        }
        // Nếu lỗi 429 (rate limit), trả về response với success: false để không throw
        if (error.response?.status === 429) {
            return {
                success: false,
                message: 'Too many requests. Please try again later.',
                data: null,
            };
        }
        // Nếu lỗi khác, throw để xử lý ở nơi gọi
        throw error;
    }
};

// Add item to cart
export const addToCart = async (data: {
  productId: string;
  quantity: number;
  note?: string; // Ghi chú về options đã chọn
}) => {
  try {
    // Get current cart
    const cartResponse = await fetchCart();
    
    // Xử lý các trường hợp lỗi đặc biệt
    if (!cartResponse.success) {
      if (cartResponse.message === 'User not authenticated' || 
          cartResponse.message?.includes('Too many requests')) {
        return {
          success: false,
          message: cartResponse.message,
          data: null,
        };
      }
      throw new Error(cartResponse.message || 'Failed to get cart');
    }

    if (!cartResponse.data) {
      throw new Error('Cart data is empty');
    }

    const cart = cartResponse.data;
    const items = cart.items || [];

    // Check if product already exists in cart with same options (same note)
    // Nếu có note khác nhau, coi như là item khác
    const existingItemIndex = items.findIndex(
      (item: any) => 
        item.productId === data.productId && 
        (item.note || '') === (data.note || ''),
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists with same options
      items[existingItemIndex].quantity += data.quantity;
    } else {
      // Add new item
      // Need to get product info to get price
      try {
        const productResponse = await api.get(`/products/${data.productId}`);
        const product = productResponse.data.data;
        items.push({
          productId: data.productId,
          quantity: data.quantity,
          price: product.price,
          note: data.note || undefined, // Lưu note về options
        });
      } catch (error) {
        throw new Error('Failed to get product information');
      }
    }

    // Update cart
    return (await api.put(`/carts/${cart.id}`, {items})).data;
  } catch (error: any) {
    // Nếu là lỗi từ API (401, 429), trả về response thay vì throw
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'User not authenticated',
        data: null,
      };
    }
    if (error.response?.status === 429) {
      return {
        success: false,
        message: 'Too many requests. Please try again later.',
        data: null,
      };
    }
    throw error;
  }
};

// Update cart item quantity
export const updateCartItem = async (itemId: string, quantity: number) => {
  try {
    // Get current cart
    const cartResponse = await fetchCart();
    
    // Xử lý các trường hợp lỗi đặc biệt
    if (!cartResponse.success) {
      // Nếu là lỗi authentication hoặc rate limit, không throw error
      if (cartResponse.message === 'User not authenticated' || 
          cartResponse.message?.includes('Too many requests')) {
        return {
          success: false,
          message: cartResponse.message,
          data: null,
        };
      }
      // Các lỗi khác thì throw
      throw new Error(cartResponse.message || 'Failed to get cart');
    }

    if (!cartResponse.data) {
      throw new Error('Cart data is empty');
    }

    const cart = cartResponse.data;
    const items = cart.items || [];

    // Find and update item (itemId is productId in this case)
    const itemIndex = items.findIndex((item: any) => item.productId === itemId);
    if (itemIndex >= 0) {
      items[itemIndex].quantity = quantity;
    } else {
      throw new Error('Item not found in cart');
    }

    // Update cart
    return (await api.put(`/carts/${cart.id}`, {items})).data;
  } catch (error: any) {
    // Nếu là lỗi từ API (401, 429), trả về response thay vì throw
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'User not authenticated',
        data: null,
      };
    }
    if (error.response?.status === 429) {
      return {
        success: false,
        message: 'Too many requests. Please try again later.',
        data: null,
      };
    }
    // Các lỗi khác thì throw
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (itemId: string) => {
  try {
    // Get current cart
    const cartResponse = await fetchCart();
    
    // Xử lý các trường hợp lỗi đặc biệt
    if (!cartResponse.success) {
      if (cartResponse.message === 'User not authenticated' || 
          cartResponse.message?.includes('Too many requests')) {
        return {
          success: false,
          message: cartResponse.message,
          data: null,
        };
      }
      throw new Error(cartResponse.message || 'Failed to get cart');
    }

    if (!cartResponse.data) {
      throw new Error('Cart data is empty');
    }

    const cart = cartResponse.data;
    const items = cart.items || [];

    // Remove item (itemId is productId in this case)
    const filteredItems = items.filter((item: any) => item.productId !== itemId);

    // Update cart
    return (await api.put(`/carts/${cart.id}`, {items: filteredItems})).data;
  } catch (error: any) {
    // Nếu là lỗi từ API (401, 429), trả về response thay vì throw
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'User not authenticated',
        data: null,
      };
    }
    if (error.response?.status === 429) {
      return {
        success: false,
        message: 'Too many requests. Please try again later.',
        data: null,
      };
    }
    throw error;
  }
};

// Clear cart
export const clearCart = async () => {
  try {
    // Get current cart
    const cartResponse = await fetchCart();
    
    // Xử lý các trường hợp lỗi đặc biệt
    if (!cartResponse.success) {
      if (cartResponse.message === 'User not authenticated' || 
          cartResponse.message?.includes('Too many requests')) {
        return {
          success: false,
          message: cartResponse.message,
          data: null,
        };
      }
      throw new Error(cartResponse.message || 'Failed to get cart');
    }

    if (!cartResponse.data) {
      throw new Error('Cart data is empty');
    }

    const cart = cartResponse.data;

    // Clear items
    return (await api.put(`/carts/${cart.id}`, {items: []})).data;
  } catch (error: any) {
    // Nếu là lỗi từ API (401, 429), trả về response thay vì throw
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'User not authenticated',
        data: null,
      };
    }
    if (error.response?.status === 429) {
      return {
        success: false,
        message: 'Too many requests. Please try again later.',
        data: null,
      };
    }
    throw error;
  }
};

// ==================== ADDRESSES API ====================
export const fetchAddresses = async () => (await api.get('/addresses')).data;

export const fetchAddressById = async (id: string) =>
  (await api.get(`/addresses/${id}`)).data;

export const createAddress = async (data: {
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}) => (await api.post('/addresses', data)).data;

export const updateAddress = async (
  id: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    ward?: string;
    district?: string;
    city?: string;
    isDefault?: boolean;
    latitude?: number;
    longitude?: number;
  },
) => (await api.put(`/addresses/${id}`, data)).data;

export const deleteAddress = async (id: string) =>
  (await api.delete(`/addresses/${id}`)).data;

// ==================== VOUCHERS API ====================
export const fetchVouchers = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  return (await api.get(`/vouchers?${queryParams.toString()}`)).data;
};

export const fetchVoucherByCode = async (code: string) =>
  (await api.get(`/vouchers/code/${code}`)).data;

// ==================== RESTAURANTS API ====================
export const fetchRestaurants = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  return (await api.get(`/restaurants?${queryParams.toString()}`)).data;
};

export const fetchRestaurantById = async (id: string) =>
  (await api.get(`/restaurants/${id}`)).data;

// ==================== UPLOAD API ====================
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

  return (
    await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  ).data;
};

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export interface ProductOption {
  id: string;
  name: string;
  price: number; // Giá bổ sung (có thể là 0)
}

export interface ProductVariant {
  type: 'size' | 'sauce' | 'other'; // Loại variant
  name: string; // Tên hiển thị (ví dụ: "Kích thước", "Loại sốt")
  options: ProductOption[]; // Danh sách options
  required: boolean; // Bắt buộc chọn hay không
}

export interface Product {
  id: string;
  name: string;
  price: number; // Giá cơ bản
  imageUrl: string;
  description: string;
  variants?: ProductVariant[]; // Danh sách variants (size, sốt, ...)
  categoryId?: string;
  stock?: number;
  isActive?: boolean;
  rating?: number;
  reviews?: number;
}
