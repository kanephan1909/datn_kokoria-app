# Shipper App

Ứng dụng dành cho shipper/tài xế để nhận và giao đơn hàng.

## 🚀 Tính năng

- ✅ Đăng nhập với tài khoản DRIVER
- ✅ Xem danh sách đơn hàng sẵn sàng (`READY_FOR_PICKUP`)
- ✅ Nhận đơn hàng
- ✅ Xem đơn hàng đã nhận (PICKED_UP, DELIVERING)
- ✅ Cập nhật trạng thái đơn hàng
- ✅ Mở Google Maps để điều hướng
- ✅ Xem chi tiết đơn hàng

## 📋 Yêu cầu

- Node.js >= 18
- Expo CLI
- Backend server đang chạy tại `http://10.0.2.2:3000/api/v1`

## 🛠️ Cài đặt

1. Cài đặt dependencies:
```bash
npm install
# hoặc
yarn install
```

2. Cấu hình API Base URL (nếu cần):
- Mở file `src/api/apiClient.ts`
- Thay đổi `API_BASE_URL` nếu backend chạy ở địa chỉ khác

3. Chạy app:
```bash
npm start
# hoặc
yarn start
```

4. Chạy trên Android:
```bash
npm run android
# hoặc
yarn android
```

## 📱 Cấu trúc

```
shipper-app/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Màn hình đăng nhập
│   │   ├── OrdersScreen.tsx         # Danh sách đơn sẵn sàng
│   │   ├── MyOrdersScreen.tsx       # Đơn đã nhận
│   │   ├── OrderDetailScreen.tsx    # Chi tiết đơn + actions
│   │   ├── EarningsScreen.tsx       # Thu nhập (đang phát triển)
│   │   └── ProfileScreen.tsx        # Thông tin tài khoản
│   ├── navigation/
│   │   └── RootNavigator.tsx        # Navigation setup
│   ├── context/
│   │   └── AuthContext.tsx          # Authentication context
│   └── api/
│       └── apiClient.ts             # API client
├── App.tsx
└── package.json
```

## 🔐 Authentication

- Chỉ tài khoản có role `DRIVER` mới có thể đăng nhập
- Token được lưu trong AsyncStorage
- Tự động refresh token khi hết hạn

## 📦 API Endpoints sử dụng

- `POST /auth/login` - Đăng nhập
- `GET /auth/me` - Lấy thông tin user
- `GET /orders?status=READY_FOR_PICKUP` - Lấy đơn sẵn sàng
- `GET /orders` - Lấy đơn của shipper (tự động filter theo driverId)
- `GET /orders/:id` - Lấy chi tiết đơn
- `POST /orders/:id/accept` - Nhận đơn
- `PUT /orders/:id/status` - Cập nhật trạng thái

## 🗺️ Google Maps

- Cần cấu hình Google Maps API Key trong `app.json`
- Sử dụng để mở Google Maps navigation

## 🎨 UI/UX

- Sử dụng NativeWind (Tailwind CSS cho React Native)
- Material Design icons từ @expo/vector-icons
- Responsive và user-friendly

## 📝 Notes

- App tự động refresh danh sách đơn mỗi 10 giây (OrdersScreen)
- App tự động refresh đơn của tôi mỗi 5 giây (MyOrdersScreen)
- Cần backend server chạy để app hoạt động

## 🐛 Troubleshooting

### Backend không kết nối được
- Kiểm tra backend server đã chạy chưa
- Kiểm tra API_BASE_URL trong `src/api/apiClient.ts`
- Đối với Android emulator: `http://10.0.2.2:3000/api/v1`
- Đối với thiết bị thật: `http://<IP_MÁY>:3000/api/v1`

### Không đăng nhập được
- Kiểm tra tài khoản có role `DRIVER` không
- Kiểm tra email/password đúng chưa
- Kiểm tra backend đang chạy

## 📄 License

Private project
