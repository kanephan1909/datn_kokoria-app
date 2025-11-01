# Hướng Dẫn Chạy FoodkaApp trên macOS và iOS

## 📋 Yêu Cầu Môi Trường

**QUAN TRỌNG**: Bạn PHẢI có máy macOS (MacBook, iMac, Mac Mini, v.v.) để có thể build và chạy ứng dụng iOS. **Không thể build iOS trên Windows**.

### 1. Cài Đặt Xcode
- Tải **Xcode** từ App Store (miễn phí, khoảng 10-15GB)
- Mở Xcode và chấp nhận license: `sudo xcodebuild -license accept`
- Cài đặt Command Line Tools:
  ```bash
  xcode-select --install
  ```

### 2. Cài Đặt Homebrew (nếu chưa có)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 3. Cài Đặt Node.js
```bash
# Sử dụng Homebrew
brew install node@18
# hoặc cài Node.js >= 18 từ nodejs.org
```

### 4. Cài Đặt Ruby và Bundler
```bash
# Kiểm tra Ruby version (cần >= 2.6.10)
ruby --version

# Cài Bundler
gem install bundler
```

### 5. Cài Đặt CocoaPods
```bash
sudo gem install cocoapods
```

## 🚀 Các Bước Chạy Ứng Dụng iOS

### Bước 1: Di chuyển vào thư mục project
```bash
cd /path/to/datn_foodka-app/foodkaapp
```

### Bước 2: Cài đặt Node Dependencies
```bash
npm install
# hoặc nếu dùng yarn: yarn install
```

### Bước 3: Cài đặt CocoaPods Dependencies
```bash
cd ios

# Lần đầu tiên: cài Bundler gems
bundle install

# Cài đặt Pods
bundle exec pod install
# hoặc nếu không dùng bundle: pod install

cd ..
```

**Lưu ý**: Nếu gặp lỗi khi chạy `pod install`, thử:
```bash
# Xóa cache Pods
rm -rf Pods Podfile.lock
pod cache clean --all

# Cài lại
bundle exec pod install
```

### Bước 4: Khởi động Metro Bundler
```bash
# Từ thư mục root của project (foodkaapp)
npm start
# hoặc: yarn start
# hoặc: npx react-native start
```

**Giữ cửa sổ terminal này mở** - Metro cần chạy liên tục.

### Bước 5: Chạy trên iOS Simulator

#### Cách 1: Sử dụng Terminal (từ cửa sổ terminal mới)
```bash
npm run ios
# hoặc: yarn ios
# hoặc: npx react-native run-ios
```

#### Cách 2: Sử dụng Xcode
1. Mở file: `foodkaapp/ios/foodkaapp.xcworkspace` (KHÔNG phải .xcodeproj)
2. Chọn Simulator từ thanh menu trên cùng (ví dụ: iPhone 15 Pro)
3. Nhấn nút **Play** (▶️) hoặc `Cmd + R`

#### Chạy trên thiết bị iOS thật
1. Kết nối iPhone/iPad qua USB
2. Mở Xcode: `ios/foodkaapp.xcworkspace`
3. Chọn thiết bị của bạn từ menu
4. Trong Xcode, vào **Signing & Capabilities**, chọn Team của bạn
5. Nhấn **Play** (▶️) để build và chạy

## 🔧 Troubleshooting

### Lỗi "Podfile.lock out of sync"
```bash
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install
cd ..
```

### Lỗi "No bundle URL present"
- Đảm bảo Metro Bundler đang chạy
- Reset Metro cache: `npm start -- --reset-cache`

### Lỗi về Code Signing
- Mở Xcode → chọn target → **Signing & Capabilities**
- Chọn Team của bạn (cần Apple Developer account)
- Hoặc đặt Bundle Identifier khác (ví dụ: `com.yourname.foodkaapp`)

### Xóa cache và build lại
```bash
# Xóa Metro cache
rm -rf node_modules/.cache

# Xóa iOS build
cd ios
rm -rf build Pods Podfile.lock
bundle exec pod install
cd ..

# Clean và build lại
npm run ios
```

### Kiểm tra iOS Simulator có sẵn
```bash
xcrun simctl list devices
```

### Mở Simulator thủ công
```bash
open -a Simulator
```

## 📝 Lưu Ý Quan Trọng

1. **Luôn mở `.xcworkspace`** chứ KHÔNG phải `.xcodeproj` khi có CocoaPods
2. **Metro Bundler phải chạy** trước khi chạy app
3. **iOS Simulator** tự động được cài khi cài Xcode
4. **Bundle Identifier** phải unique (ví dụ: `com.yourname.foodkaapp`)

## ✅ Khi Chạy Thành Công

App sẽ tự động mở trên iOS Simulator hoặc thiết bị của bạn. 

- **Reload app**: Nhấn `Cmd + R` trong Simulator
- **Mở Dev Menu**: Nhấn `Cmd + D` trong Simulator
- **Tắt app**: Nhấn `Cmd + Q` trong Simulator

---

**Chúc bạn thành công! 🎉**

