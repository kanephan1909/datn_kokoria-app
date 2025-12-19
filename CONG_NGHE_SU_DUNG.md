# 📚 CÁC CÔNG NGHỆ SỬ DỤNG

## 🎯 TỔNG QUAN DỰ ÁN
Hệ thống đặt đồ ăn online **KOKORIA** bao gồm 3 ứng dụng mobile và 1 backend server.

---

## 🔧 BACKEND (Admin Backend Server)

### Core Framework & Runtime
- **Node.js** - Runtime environment
- **Express.js** v5.1.0 - Web framework
- **JavaScript/TypeScript** - Programming languages

### Database & ORM
- **MongoDB** v7.0.0 - NoSQL database
- **Prisma** v6.19.0 - ORM (Object-Relational Mapping)
- **@prisma/client** v6.19.0 - Prisma Client

### Authentication & Security
- **JWT (jsonwebtoken)** v9.0.2 - Token-based authentication
- **bcryptjs** v3.0.3 - Password hashing
- **Helmet** v8.1.0 - Security headers
- **CORS** v2.8.5 - Cross-Origin Resource Sharing
- **express-rate-limit** v8.2.1 - Rate limiting

### Real-time Communication
- **Socket.IO** v4.8.1 - Real-time bidirectional communication

### File Upload & Storage
- **Cloudinary** v2.8.0 - Cloud image/video storage
- **Multer** v2.0.2 - File upload handling

### Payment Integration
- **VNPay** - Payment gateway integration

### AI Integration
- **@google/generative-ai** v0.24.1 - Google Gemini AI for chatbot

### Utilities
- **dotenv** v17.2.3 - Environment variables
- **body-parser** v2.2.0 - Request body parsing
- **nodemailer** v7.0.10 - Email sending
- **pdfkit** v0.17.2 - PDF generation
- **winston** v3.18.3 - Logging
- **zod** v4.1.12 - Schema validation
- **buffer** v6.0.3 - Buffer polyfill

### Development Tools
- **nodemon** v3.1.11 - Auto-restart development server

---

## 📱 MOBILE APPS

### 1. Kokoria App (Customer App)

#### Core Framework
- **React Native** v0.79.0 - Mobile framework
- **React** v19.0.0 - UI library
- **TypeScript** v5.0.4 - Type-safe JavaScript

#### Navigation
- **@react-navigation/native** v7.1.19 - Navigation library
- **@react-navigation/native-stack** v7.6.1 - Stack navigator
- **@react-navigation/bottom-tabs** v7.7.2 - Tab navigator

#### State Management
- **Zustand** v5.0.9 - Lightweight state management
- **@tanstack/react-query** v5.90.10 - Server state management (React Query)

#### Styling
- **NativeWind** v4.2.1 - Tailwind CSS for React Native
- **Tailwind CSS** v3.3.2 - Utility-first CSS framework
- **react-native-linear-gradient** v2.8.3 - Linear gradients

#### API & Network
- **Axios** v1.13.2 - HTTP client
- **Socket.IO Client** v4.8.1 - Real-time communication

#### Maps & Location
- **react-native-maps** v1.26.0 - Maps integration
- **@react-native-community/geolocation** v3.4.0 - Geolocation

#### Authentication
- **@react-native-google-signin/google-signin** v12.1.0 - Google Sign-In
- **@invertase/react-native-apple-authentication** v2.3.1 - Apple Sign-In
- **react-native-fbsdk-next** v13.4.1 - Facebook SDK

#### UI Components & Icons
- **react-native-vector-icons** v10.3.0 - Icon library
  - Ant Design icons
  - Entypo icons
  - Evil icons
  - Feather icons
  - Font Awesome icons
  - Fontisto icons
  - Ionicons
  - Material Design icons
  - Material icons

#### Media & Images
- **react-native-image-picker** v8.2.1 - Image picker

#### Other Features
- **@react-native-voice/voice** v3.2.4 - Voice recognition
- **react-native-webview** v13.16.0 - WebView component
- **react-native-worklets** v0.6.1 - Worklets support
- **@react-native-async-storage/async-storage** v2.2.0 - Local storage

#### UI & Animation
- **react-native-reanimated** v4.1.3 - Animations
- **react-native-safe-area-context** v5.6.2 - Safe area handling
- **react-native-screens** v4.18.0 - Native screen components
- **react-native-gesture-handler** - Gesture handling

#### Development Tools
- **Babel** - JavaScript compiler
  - @babel/core v7.25.2
  - @babel/preset-env v7.25.3
  - @babel/runtime v7.25.0
  - metro-react-native-babel-preset v0.77.0
- **ESLint** v8.19.0 - Code linting
- **Prettier** v3.6.2 - Code formatting
  - prettier-plugin-tailwindcss v0.5.11
- **Jest** v29.6.3 - Testing framework

---

### 2. Shipper App (Driver App)

#### Core Framework
- **Expo** ~54.0.23 - React Native framework
- **React Native** v0.81.5 - Mobile framework
- **React** v19.1.0 - UI library
- **TypeScript** ~5.9.2 - Type-safe JavaScript

#### Navigation
- **@react-navigation/native** v7.1.20 - Navigation library
- **@react-navigation/native-stack** v7.6.3 - Stack navigator
- **@react-navigation/bottom-tabs** v7.8.5 - Tab navigator

#### State Management
- **@tanstack/react-query** v5.90.9 - Server state management (React Query)

#### Styling
- **NativeWind** v4.2.1 - Tailwind CSS for React Native
- **Tailwind CSS** v3.4.18 - Utility-first CSS framework

#### API & Network
- **Axios** v1.13.2 - HTTP client
- **Socket.IO Client** v4.8.1 - Real-time communication

#### Maps & Location
- **react-native-maps** v1.18.0 - Maps integration
- **expo-location** ~18.0.7 - Location services

#### UI Components
- **@expo/vector-icons** ^15.0.3 - Icon library
- **expo-status-bar** ~3.0.8 - Status bar

#### Storage
- **@react-native-async-storage/async-storage** v2.2.0 - Local storage

#### UI & Animation
- **react-native-reanimated** v4.1.5 - Animations
- **react-native-safe-area-context** ~5.6.0 - Safe area handling
- **react-native-screens** ~4.16.0 - Native screen components
- **react-native-gesture-handler** v2.29.1 - Gesture handling

#### Development Tools
- **babel-preset-expo** ^54.0.7 - Babel preset for Expo
- **TypeScript** ~5.9.2 - Type checking

---

### 3. Admin Panel App

#### Core Framework
- **Expo** ~54.0.23 - React Native framework
- **React Native** v0.81.5 - Mobile framework
- **React** v19.1.0 - UI library
- **TypeScript** ~5.9.2 - Type-safe JavaScript

#### Navigation
- **@react-navigation/native** v7.1.20 - Navigation library
- **@react-navigation/native-stack** v7.6.3 - Stack navigator
- **@react-navigation/bottom-tabs** v7.8.5 - Tab navigator
- **@react-navigation/drawer** v7.7.3 - Drawer navigator

#### State Management
- **@tanstack/react-query** v5.90.9 - Server state management (React Query)

#### Styling
- **NativeWind** v4.2.1 - Tailwind CSS for React Native
- **Tailwind CSS** v3.4.18 - Utility-first CSS framework

#### API & Network
- **Axios** v1.13.2 - HTTP client

#### Media & Images
- **expo-image-picker** ^17.0.8 - Image picker

#### UI Components
- **@expo/vector-icons** ^15.0.3 - Icon library
- **expo-status-bar** ~3.0.8 - Status bar

#### Storage
- **@react-native-async-storage/async-storage** v2.2.0 - Local storage

#### UI & Animation
- **react-native-reanimated** v4.1.5 - Animations
- **react-native-safe-area-context** ~5.6.0 - Safe area handling
- **react-native-screens** ~4.16.0 - Native screen components
- **react-native-gesture-handler** v2.29.1 - Gesture handling

#### Development Tools
- **babel-preset-expo** ^54.0.7 - Babel preset for Expo
- **TypeScript** ~5.9.2 - Type checking

---

## 🛠️ DEVELOPMENT TOOLS & BUILD SYSTEMS

### Build Tools
- **Metro** - React Native bundler
- **Babel** - JavaScript compiler/transpiler
- **Webpack/Vite** (via Expo) - Module bundler

### Version Control
- **Git** - Version control system

### Package Managers
- **npm** - Node Package Manager

### Scripts & Automation
- **PowerShell** (.ps1) - Windows automation scripts
- **Shell Script** (.sh) - Unix/Linux automation scripts

---

## 📊 KIẾN TRÚC TỔNG QUAN

### Client-Server Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Kokoria App    │     │  Shipper App    │     │ Admin Panel App │
│  (Customer)     │     │  (Driver)       │     │  (Admin)        │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  HTTP/REST + Socket.IO │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Backend Server        │
                    │   (Express + Socket.IO) │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      MongoDB            │
                    │   (via Prisma ORM)      │
                    └─────────────────────────┘
```

---

## 🔑 KEY TECHNOLOGIES SUMMARY

### Backend Stack
✅ Node.js + Express.js  
✅ MongoDB + Prisma ORM  
✅ Socket.IO (Real-time)  
✅ JWT Authentication  
✅ Cloudinary (Image storage)  
✅ VNPay Integration  
✅ Google Gemini AI  

### Frontend Stack (Mobile)
✅ React Native / Expo  
✅ TypeScript  
✅ NativeWind (Tailwind CSS)  
✅ React Navigation  
✅ TanStack Query (React Query)  
✅ Zustand (State management - Kokoria App only)  
✅ Socket.IO Client  

### Development Tools
✅ TypeScript  
✅ ESLint  
✅ Prettier  
✅ Jest (Testing)  
✅ Babel  
✅ Metro Bundler  

---

## 📝 NOTES

- **Node.js version**: >= 18 (required for Kokoria App)
- **Database**: MongoDB (có thể dùng local hoặc MongoDB Atlas)
- **Real-time**: Socket.IO được sử dụng cho cập nhật đơn hàng real-time và chat
- **Styling**: Tất cả apps đều sử dụng NativeWind (Tailwind CSS cho React Native)
- **Type Safety**: Tất cả apps đều sử dụng TypeScript
- **State Management**: 
  - Kokoria App: Zustand + React Query
  - Shipper App & Admin Panel: Chỉ React Query

---

**Cập nhật lần cuối**: Dựa trên package.json files trong dự án
