# 📱 KOKORIA APP - WORKFLOW CHI TIẾT

## 🏗️ CẤU TRÚC NAVIGATION

```
RootNavigator
├── AuthStack (khi chưa đăng nhập)
│   ├── Login
│   ├── Register
│   └── ...
│
└── MainTabs (khi đã đăng nhập)
    └── MainNavigator
        ├── MainTabs (Bottom Tab Navigator)
        │   ├── 🏠 Home (HomeScreen)
        │   ├── 🍽️ Menu (MenuScreen)
        │   ├── 📋 Đơn Hàng (OrderHistoryScreen) - Tab "Order"
        │   └── 👤 Tôi (UserScreen)
        │
        └── Stack Screens (các màn hình overlay)
            ├── Giỏ hàng (CartScreen)
            ├── Thanh toán (OrderScreen) - Route: Checkout
            ├── Chi tiết sản phẩm (ProductDetailsScreen)
            ├── Danh mục (CategoryScreen)
            ├── Lịch sử đơn hàng (OrderHistoryScreen) - Stack version
            ├── Chi tiết đơn hàng (OrderDetailsScreen)
            ├── Danh sách địa chỉ (AddressListScreen)
            ├── Thêm địa chỉ (AddAddressScreen)
            └── Sửa địa chỉ (EditAddressScreen)
```

---

## 🛒 WORKFLOW ĐẶT HÀNG (ORDER FLOW)

### 1️⃣ XEM SẢN PHẨM
```
HomeScreen / MenuScreen
    ↓ (Click sản phẩm)
ProductDetailsScreen
    ↓ (Add to Cart)
    → Thêm vào giỏ hàng (CartContext)
    ↓ (Nếu có sản phẩm trong giỏ)
    → Hiện nút "Go to orders" → Navigate đến Tab "Đơn Hàng"
```

### 2️⃣ XEM GIỎ HÀNG
```
Bất kỳ màn hình nào
    ↓ (Click icon giỏ hàng)
CartScreen
    ↓ (Click "Thanh toán")
Checkout (OrderScreen)
```

### 3️⃣ THANH TOÁN & ĐẶT HÀNG
```
OrderScreen (Checkout)
    ├── Hiển thị danh sách sản phẩm trong giỏ
    ├── Chọn địa chỉ giao hàng
    │   ├── Nếu chưa có địa chỉ → "Add Delivery Address"
    │   │   → AddAddressScreen
    │   └── Nếu có địa chỉ → Chọn từ danh sách
    │       → Có thể "Change Address" → AddressListScreen
    │
    └── Click "Place Order"
        ├── Hiện dialog xác nhận
        ├── Gọi API createOrder()
        ├── Xóa giỏ hàng (clear cart)
        └── Navigate đến OrderDetailsScreen
            → Xem đơn hàng vừa tạo
```

---

## 📋 WORKFLOW XEM ĐƠN HÀNG

### 1️⃣ TỪ TAB "ĐƠN HÀNG"
```
Tab "Đơn Hàng" (OrderHistoryScreen)
    ├── Hiển thị danh sách đơn hàng
    ├── Click vào order card
    │   → Navigate đến OrderDetailsScreen
    │
    └── Click nút "Track"
        → Navigate đến OrderDetailsScreen
```

### 2️⃣ TỪ PROFILE
```
UserScreen (Tab "Tôi")
    ├── Click "My Orders"
    │   → Navigate đến OrderHistoryScreen (Stack version)
    │       → Click order → OrderDetailsScreen
    │
    └── Click "Settings"
        → Alert (chưa implement)
```

### 3️⃣ SAU KHI ĐẶT HÀNG
```
OrderScreen → Place Order → OrderDetailsScreen
    → Xem chi tiết đơn hàng vừa tạo
```

---

## 🗺️ NAVIGATION PATTERNS

### ✅ Navigate đến TAB (từ Stack Screen)
```typescript
navigation.navigate('MainTabs', {
  screen: MainRoutes.Order,  // hoặc Home, Menu, Profile
});
```

### ✅ Navigate đến STACK SCREEN
```typescript
// Đơn giản
navigation.navigate(MainRoutes.Cart);

// Với params
navigation.navigate(MainRoutes.ProductDetails, {
  productId: '123',
});
```

### ✅ Navigate từ TAB (trong Tab Navigator)
```typescript
// Chỉ cần navigate trực tiếp
navigation.navigate(MainRoutes.Order);
```

---

## 🔄 CÁC FLOW CHÍNH

### Flow 1: MUA HÀNG
```
HomeScreen
  → ProductDetailsScreen (click sản phẩm)
    → Add to Cart
      → CartScreen (click giỏ hàng)
        → OrderScreen/Checkout (click "Thanh toán")
          → Chọn địa chỉ
            → Place Order
              → OrderDetailsScreen (xem đơn vừa tạo)
```

### Flow 2: XEM ĐƠN HÀNG
```
Tab "Đơn Hàng" (OrderHistoryScreen)
  → Click order card
    → OrderDetailsScreen
      → Xem chi tiết, có thể hủy đơn
```

### Flow 3: QUẢN LÝ ĐỊA CHỈ
```
OrderScreen
  → "Add Delivery Address" hoặc "Change Address"
    → AddressListScreen
      → "Thêm địa chỉ" → AddAddressScreen
      → "Chỉnh sửa" → EditAddressScreen
```

### Flow 4: TỪ PRODUCT DETAILS
```
ProductDetailsScreen
  → Nếu có sản phẩm trong giỏ
    → "Go to orders" button
      → Navigate đến Tab "Đơn Hàng"
```

---

## 📍 CÁC MÀN HÌNH QUAN TRỌNG

### 🏠 HomeScreen
- **Vị trí**: Tab "Trang chủ"
- **Chức năng**: 
  - Hiển thị banner, categories
  - Popular items
  - Search bar với voice search
- **Navigate đến**: ProductDetailsScreen, CategoryScreen

### 🍽️ MenuScreen
- **Vị trí**: Tab "Menu"
- **Chức năng**: 
  - Hiển thị danh mục và sản phẩm
  - Filter theo category
- **Navigate đến**: ProductDetailsScreen

### 📋 OrderHistoryScreen
- **Vị trí**: 
  - Tab "Đơn Hàng" (MainTabNavigator)
  - Stack Screen (MainNavigator) - có thể navigate từ UserScreen
- **Chức năng**: 
  - Hiển thị danh sách đơn hàng
  - Có nút "Place Order" để đặt hàng mới
- **Navigate đến**: OrderDetailsScreen, Tab "Đơn Hàng"

### 🛒 CartScreen
- **Vị trí**: Stack Screen
- **Chức năng**: 
  - Xem giỏ hàng
  - Thay đổi số lượng
  - Xóa sản phẩm
- **Navigate đến**: 
  - Checkout (OrderScreen) - khi click "Thanh toán"
  - Tab "Trang chủ" - khi giỏ hàng trống

### 💳 OrderScreen (Checkout)
- **Vị trí**: Stack Screen (Route: Checkout)
- **Chức năng**: 
  - Xem tóm tắt đơn hàng
  - Chọn địa chỉ giao hàng
  - Đặt hàng (Place Order)
- **Navigate đến**: 
  - OrderDetailsScreen - sau khi đặt hàng thành công
  - AddressListScreen - khi "Change Address"
  - AddAddressScreen - khi "Add Delivery Address"

### 📄 OrderDetailsScreen
- **Vị trí**: Stack Screen
- **Chức năng**: 
  - Xem chi tiết đơn hàng
  - Hủy đơn hàng (nếu pending/confirmed)
- **Được gọi từ**: 
  - OrderHistoryScreen (click order card hoặc nút Track)
  - OrderScreen (sau khi đặt hàng thành công)

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **"Đơn Hàng" là TAB**, không phải Stack Screen
   - Để navigate đến tab này từ Stack Screen: `navigate('MainTabs', { screen: MainRoutes.Order })`

2. **OrderHistoryScreen được dùng 2 lần**:
   - Là component của Tab "Đơn Hàng"
   - Là Stack Screen riêng (có thể navigate từ UserScreen)

3. **Checkout = OrderScreen**:
   - Route name: `MainRoutes.Checkout`
   - Component: `OrderScreen`

4. **Cart không phải Tab**:
   - Cart là Stack Screen, chỉ navigate đến khi cần

---

## 🎯 TÓM TẮT NHANH

```
MUA HÀNG:
Home/Menu → ProductDetails → Add to Cart → Cart → Checkout → Place Order → OrderDetails

XEM ĐƠN:
Tab "Đơn Hàng" → Click order → OrderDetails

QUẢN LÝ ĐỊA CHỈ:
Checkout → AddressList → Add/Edit Address
```

