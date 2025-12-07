# 🍔 KOKORIA - Hệ Thống Đặt Đồ Ăn Online

Dự án tốt nghiệp - Hệ thống đặt đồ ăn online với đầy đủ tính năng cho khách hàng, quản trị viên và shipper.

## 📱 Các Ứng Dụng

### 1. **Kokoria App** - Ứng dụng khách hàng
- Đặt món ăn, đồ uống
- Quản lý giỏ hàng
- Theo dõi đơn hàng real-time
- Chat với chatbot AI (Gemini)
- Thanh toán VNPay
- Đánh giá sản phẩm

### 2. **Admin Panel App** - Ứng dụng quản trị
- Quản lý sản phẩm, danh mục
- Quản lý đơn hàng
- Quản lý người dùng, tài xế
- Quản lý voucher
- Dashboard thống kê

### 3. **Shipper App** - Ứng dụng tài xế
- Xem đơn hàng sẵn sàng
- Nhận đơn hàng
- Cập nhật trạng thái giao hàng
- Điều hướng Google Maps
- Theo dõi thu nhập

### 4. **Backend Server** - API Server
- RESTful API
- Socket.IO cho real-time updates
- Tích hợp VNPay
- Tích hợp Gemini AI
- Upload ảnh Cloudinary

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Node.js** + **Express**
- **MongoDB** + **Prisma ORM**
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Cloudinary** - Image storage
- **VNPay** - Payment gateway
- **Google Gemini AI** - Chatbot

### Frontend (Mobile Apps)
- **React Native** / **Expo**
- **TypeScript**
- **NativeWind** (Tailwind CSS)
- **React Navigation**
- **TanStack Query** (React Query)
- **Zustand** - State management
- **Socket.IO Client** - Real-time

## 📂 Cấu Trúc Dự Án

```
datn_kokoria-app/
├── adminpanel-app/          # Admin Panel App
│   ├── admin-backend/       # Backend Server
│   └── src/                 # Admin Panel Frontend
├── kokoria-app/             # App Khách Hàng
├── shipper-app/             # App Shipper
├── start-demo.ps1           # Script helper (Windows)
└── start-demo.sh            # Script helper (Mac/Linux)
```

## 🚀 Bắt Đầu Nhanh

### Yêu cầu
- Node.js >= 18
- MongoDB (local hoặc Atlas)
- npm hoặc yarn

### Cài đặt và chạy

1. **Clone repository**
```bash
git clone <repository-url>
cd datn_kokoria-app
```

2. **Cấu hình Backend**
```bash
cd adminpanel-app/admin-backend
npm install
# Tạo file .env (xem HUONG_DAN_DEMO.md)
npx prisma generate
npx prisma db push
npm start
```

3. **Chạy các ứng dụng**

Sử dụng script helper:
```bash
# Windows
.\start-demo.ps1

# Mac/Linux
chmod +x start-demo.sh
./start-demo.sh
```

Hoặc chạy thủ công từng app (xem `HUONG_DAN_DEMO.md`)

## 📖 Tài Liệu

- **[HUONG_DAN_DEMO.md](./HUONG_DAN_DEMO.md)** - Hướng dẫn demo chi tiết
- **[kokoria-app/README.md](./kokoria-app/README.md)** - Hướng dẫn app khách hàng
- **[shipper-app/README.md](./shipper-app/README.md)** - Hướng dẫn app shipper

## 🔐 Authentication & Authorization

- **Roles**: `USER`, `ADMIN`, `DRIVER`
- JWT token-based authentication
- Refresh token mechanism
- Role-based access control

## 📡 API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Chính
- `/auth` - Authentication
- `/products` - Sản phẩm
- `/categories` - Danh mục
- `/orders` - Đơn hàng
- `/users` - Người dùng
- `/drivers` - Tài xế
- `/vouchers` - Voucher
- `/payments` - Thanh toán
- `/chatbot` - Chatbot AI
- `/ratings` - Đánh giá

## 🔄 Real-time Features

- Socket.IO cho:
  - Cập nhật trạng thái đơn hàng real-time
  - Thông báo cho khách hàng
  - Thông báo cho shipper
  - Chat real-time

## 💳 Payment

- Tích hợp VNPay
- WebView để xử lý thanh toán
- Callback URL để cập nhật trạng thái đơn hàng

## 🤖 AI Chatbot

- Sử dụng Google Gemini AI
- Hỗ trợ tư vấn sản phẩm
- Trả lời câu hỏi về đơn hàng

## 📊 Database Schema

Sử dụng Prisma với MongoDB:
- User (với roles)
- Product (với variants)
- Category
- Order (với status tracking)
- Driver
- Voucher
- Rating
- Address
- Cart

## 🎨 UI/UX

- Material Design
- Responsive design
- Dark mode support (một số màn hình)
- Smooth animations
- NativeWind (Tailwind CSS)

## 📝 License

Private project - Dự án tốt nghiệp

## 👥 Tác Giả

- **kanephan1909**

## 🙏 Acknowledgments

- React Native Community
- Expo Team
- Prisma Team
- VNPay
- Google Gemini AI

---

**Lưu ý**: Đây là dự án demo/portfolio. Một số tính năng có thể cần cấu hình thêm (API keys, database, etc.)

