import {create} from 'zustand';
import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  fetchProductById,
} from '../../api/apiClient';

interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    description?: string;
  };
  quantity: number;
  price: number;
  note?: string; // Ghi chú về options đã chọn
}

interface CartState {
  // State
  cartItems: CartItem[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, note?: string) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refreshCart: () => Promise<void>;
  reset: () => void; // Reset cart state (dùng khi logout)
}

// Helper để tính toán totalPrice và totalItems
const calculateTotals = (items: CartItem[]) => {
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  return {totalPrice, totalItems};
};

export const useCartStore = create<CartState>((set, get) => {
  let loadingRef = false;

  return {
    // Initial state
    cartItems: [],
    isLoading: false,
    isInitialized: false,

    // Load cart from database
    loadCart: async () => {
      // Tránh gọi nhiều lần cùng lúc
      if (loadingRef) {
        return;
      }

      try {
        loadingRef = true;
        set({isLoading: true});
        const response = await fetchCart();

        // Xử lý các trường hợp lỗi đặc biệt
        if (!response.success) {
          if (
            response.message === 'User not authenticated' ||
            response.message?.includes('Too many requests')
          ) {
            // Giữ nguyên cart items nếu là rate limit
            if (response.message?.includes('Too many requests')) {
              return;
            }
            // Set cart rỗng nếu chưa đăng nhập
            set({cartItems: [], isInitialized: true});
            return;
          }
          throw new Error(response.message || 'Failed to load cart');
        }

        if (response.data) {
          const cart = response.data;
          const items = cart.items || [];

          // Nếu cart rỗng
          if (items.length === 0) {
            set({cartItems: [], isInitialized: true});
            return;
          }

          // Map items và fetch product details
          const cartItemsWithProducts = await Promise.all(
            items.map(async (item: any) => {
              try {
                const productResponse = await fetchProductById(item.productId);
                const product = productResponse.success
                  ? productResponse.data
                  : productResponse;

                return {
                  id: item.productId,
                  productId: item.productId,
                  product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    description: product.description,
                  },
                  quantity: item.quantity,
                  price: item.price || product.price,
                  note: item.note, // Lưu note về options
                };
              } catch (error) {
                console.error('Error fetching product:', error);
                return {
                  id: item.productId,
                  productId: item.productId,
                  product: {
                    id: item.productId,
                    name: 'Unknown Product',
                    price: item.price || 0,
                  },
                  quantity: item.quantity,
                  price: item.price || 0,
                };
              }
            }),
          );

          set({
            cartItems: cartItemsWithProducts,
            isInitialized: true,
          });
        } else {
          set({cartItems: [], isInitialized: true});
        }
      } catch (error: any) {
        // Chỉ log lỗi nếu không phải authentication hoặc rate limit
        if (error.response?.status !== 401 && error.response?.status !== 429) {
          console.error('Error loading cart:', error);
        }
        // Nếu lỗi 429, giữ nguyên data cũ
        if (error.response?.status === 429) {
          return;
        }
        set({cartItems: [], isInitialized: true});
      } finally {
        set({isLoading: false});
        loadingRef = false;
      }
    },

    // Add item to cart
    addItem: async (productId: string, quantity: number, note?: string) => {
      try {
        const response = await addToCart({productId, quantity, note});

        if (!response.success) {
          if (
            response.message === 'User not authenticated' ||
            response.message?.includes('Too many requests')
          ) {
            if (response.message?.includes('Too many requests')) {
              return;
            }
            set({cartItems: []});
            return;
          }
          throw new Error(response.message || 'Failed to add item to cart');
        }

        if (response.success) {
          await get().loadCart();
        }
      } catch (error: any) {
        if (error.response?.status !== 401 && error.response?.status !== 429) {
          console.error('Error adding to cart:', error);
          throw error;
        }
        if (error.response?.status === 401) {
          set({cartItems: []});
          return;
        }
        if (error.response?.status === 429) {
          return;
        }
      }
    },

    // Update item quantity
    updateItem: async (itemId: string, quantity: number) => {
      try {
        const response = await updateCartItem(itemId, quantity);

        if (!response.success) {
          if (
            response.message === 'User not authenticated' ||
            response.message?.includes('Too many requests')
          ) {
            if (response.message?.includes('Too many requests')) {
              return;
            }
            set({cartItems: []});
            return;
          }
          throw new Error(response.message || 'Failed to update cart item');
        }

        if (response.success) {
          await get().loadCart();
        }
      } catch (error: any) {
        if (error.response?.status !== 401 && error.response?.status !== 429) {
          console.error('Error updating cart item:', error);
          throw error;
        }
        if (error.response?.status === 401) {
          set({cartItems: []});
          return;
        }
        if (error.response?.status === 429) {
          return;
        }
      }
    },

    // Remove item from cart
    removeItem: async (itemId: string) => {
      try {
        const response = await removeFromCart(itemId);

        if (!response.success) {
          if (
            response.message === 'User not authenticated' ||
            response.message?.includes('Too many requests')
          ) {
            if (response.message?.includes('Too many requests')) {
              return;
            }
            set({cartItems: []});
            return;
          }
          throw new Error(response.message || 'Failed to remove item');
        }

        if (response.success) {
          // Optimistic update
          set(state => ({
            cartItems: state.cartItems.filter(item => item.id !== itemId),
          }));
          // Then reload to sync
          await get().loadCart();
        }
      } catch (error: any) {
        if (error.response?.status !== 401 && error.response?.status !== 429) {
          console.error('Error removing cart item:', error);
          await get().loadCart();
          throw error;
        }
        if (error.response?.status === 401) {
          set({cartItems: []});
          return;
        }
        if (error.response?.status === 429) {
          return;
        }
      }
    },

    // Clear cart
    clear: async () => {
      try {
        const response = await clearCart();
        if (response.success) {
          set({cartItems: []});
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
        throw error;
      }
    },

    // Refresh cart
    refreshCart: async () => {
      await get().loadCart();
    },

    // Reset cart state (dùng khi logout hoặc đăng nhập user mới)
    reset: () => {
      set({
        cartItems: [],
        isLoading: false,
        isInitialized: false,
      });
    },
  };
});

// Selectors để tối ưu re-render và tính toán
export const useCartItems = () => useCartStore(state => state.cartItems);
export const useCartLoading = () => useCartStore(state => state.isLoading);
export const useCartTotals = () =>
  useCartStore(state => calculateTotals(state.cartItems));

// Hook tương thích với API cũ (để dễ migrate)
export const useCart = () => {
  const store = useCartStore();
  return {
    cartItems: store.cartItems,
    isLoading: store.isLoading,
    totalPrice: calculateTotals(store.cartItems).totalPrice,
    totalItems: calculateTotals(store.cartItems).totalItems,
    loadCart: store.loadCart,
    addItem: store.addItem,
    updateItem: store.updateItem,
    removeItem: store.removeItem,
    clear: store.clear,
    refreshCart: store.refreshCart,
    reset: store.reset,
  };
};

