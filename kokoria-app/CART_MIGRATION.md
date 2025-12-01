# Migration từ Context API sang Zustand cho Cart

## Lợi ích của Zustand

1. **Đơn giản hơn**: Không cần Provider wrapper
2. **Performance tốt hơn**: Chỉ re-render components sử dụng state thay đổi
3. **Dễ test**: Store độc lập, dễ test
4. **TypeScript tốt hơn**: Type inference tốt hơn
5. **DevTools**: Hỗ trợ Redux DevTools

## Cách sử dụng

### 1. Không cần Provider nữa

**Trước (Context API):**
```tsx
// App.tsx
<CartProvider>
  <App />
</CartProvider>
```

**Sau (Zustand):**
```tsx
// Không cần Provider, import trực tiếp
import { useCart } from './src/store/useCartStore';
```

### 2. Sử dụng trong components

**API giống hệt như Context API:**
```tsx
import { useCart } from '../store/useCartStore';

const MyComponent = () => {
  const { cartItems, totalPrice, addItem } = useCart();
  
  // Sử dụng giống như trước
};
```

### 3. Selectors để tối ưu performance

**Chỉ subscribe vào phần state cần thiết:**
```tsx
import { useCartItems, useCartTotals } from '../store/useCartStore';

const MyComponent = () => {
  // Chỉ re-render khi cartItems thay đổi
  const cartItems = useCartItems();
  
  // Chỉ re-render khi totals thay đổi
  const { totalPrice, totalItems } = useCartTotals();
};
```

### 4. Initialize cart khi app start

**Trong App.tsx hoặc root component:**
```tsx
import { useEffect } from 'react';
import { useCartStore } from './src/store/useCartStore';

const App = () => {
  useEffect(() => {
    // Load cart khi app khởi động
    useCartStore.getState().loadCart();
  }, []);
  
  // ...
};
```

## Migration Steps

### Bước 1: Thay thế import

**Tìm và thay thế:**
```tsx
// Cũ
import { useCart } from '../context/CartContext';

// Mới
import { useCart } from '../store/useCartStore';
```

### Bước 2: Xóa CartProvider

**Xóa trong App.tsx:**
```tsx
// Xóa
import { CartProvider } from './src/context/CartContext';

// Xóa
<CartProvider>
  ...
</CartProvider>
```

### Bước 3: Initialize cart

**Thêm vào App.tsx:**
```tsx
import { useEffect } from 'react';
import { useCartStore } from './src/store/useCartStore';

useEffect(() => {
  useCartStore.getState().loadCart();
}, []);
```

### Bước 4: Test và verify

- Test tất cả các chức năng cart
- Verify sync với database
- Check performance

## Database Sync

Zustand store vẫn sync với database Cart như cũ:
- `loadCart()` - Load từ database
- `addItem()` - Thêm vào database rồi reload
- `updateItem()` - Update database rồi reload
- `removeItem()` - Xóa khỏi database rồi reload
- `clear()` - Clear database

## Lưu ý

1. **State persistence**: Nếu muốn persist state (localStorage), có thể dùng `zustand/middleware/persist`
2. **DevTools**: Có thể thêm Redux DevTools để debug
3. **Performance**: Sử dụng selectors để tối ưu re-render

