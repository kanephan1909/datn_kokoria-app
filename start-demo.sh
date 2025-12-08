#!/bin/bash
# Script để chạy demo dự án Kokoria
# Sử dụng cho Mac/Linux

echo "========================================"
echo "   KOKORIA PROJECT - DEMO SCRIPT"
echo "========================================"
echo ""

# Kiểm tra Node.js
echo "Đang kiểm tra Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js: $NODE_VERSION"
else
    echo "✗ Node.js chưa được cài đặt!"
    echo "Vui lòng cài đặt Node.js >= 18"
    exit 1
fi

# Kiểm tra MongoDB
echo "Đang kiểm tra MongoDB..."
if pgrep -x "mongod" > /dev/null; then
    echo "✓ MongoDB đang chạy"
else
    echo "⚠ MongoDB không chạy (có thể dùng MongoDB Atlas)"
fi

echo ""
echo "Chọn service để chạy:"
echo "1. Backend Server"
echo "2. Admin Panel App"
echo "3. Kokoria App (Khách hàng)"
echo "4. Shipper App"
echo "5. Chạy tất cả (mở nhiều terminal)"
echo "0. Thoát"
echo ""

read -p "Nhập lựa chọn (0-5): " choice

case $choice in
    1)
        echo "Đang khởi động Backend Server..."
        cd adminpanel-app/admin-backend
        
        # Kiểm tra .env
        if [ ! -f ".env" ]; then
            echo "⚠ File .env không tồn tại!"
            echo "Vui lòng tạo file .env trong adminpanel-app/admin-backend/"
            echo "Xem hướng dẫn trong HUONG_DAN_DEMO.md"
        fi
        
        # Kiểm tra node_modules
        if [ ! -d "node_modules" ]; then
            echo "Đang cài đặt dependencies..."
            npm install
        fi
        
        echo "Khởi động server tại http://localhost:3000"
        npm start
        ;;
    
    2)
        echo "Đang khởi động Admin Panel App..."
        cd adminpanel-app
        
        if [ ! -d "node_modules" ]; then
            echo "Đang cài đặt dependencies..."
            npm install
        fi
        
        echo "Khởi động Expo..."
        npm start
        ;;
    
    3)
        echo "Đang khởi động Kokoria App..."
        cd kokoria-app
        
        if [ ! -d "node_modules" ]; then
            echo "Đang cài đặt dependencies..."
            npm install
        fi
        
        echo "Khởi động Metro bundler..."
        npm start
        ;;
    
    4)
        echo "Đang khởi động Shipper App..."
        cd shipper-app
        
        if [ ! -d "node_modules" ]; then
            echo "Đang cài đặt dependencies..."
            npm install
        fi
        
        echo "Khởi động Expo..."
        npm start
        ;;
    
    5)
        echo "Đang mở các terminal cho tất cả services..."
        echo "⚠ Lưu ý: Bạn cần chạy Backend trước!"
        echo ""
        
        # Lấy đường dẫn hiện tại
        SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        
        # Backend
        osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/adminpanel-app/admin-backend' && echo 'Backend Server' && npm start\""
        sleep 2
        
        # Admin Panel
        osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/adminpanel-app' && echo 'Admin Panel App' && npm start\""
        sleep 2
        
        # Kokoria App
        osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/kokoria-app' && echo 'Kokoria App' && npm start\""
        sleep 2
        
        # Shipper App
        osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/shipper-app' && echo 'Shipper App' && npm start\""
        
        echo "✓ Đã mở 4 terminal windows"
        echo "1. Backend Server"
        echo "2. Admin Panel App"
        echo "3. Kokoria App"
        echo "4. Shipper App"
        ;;
    
    0)
        echo "Thoát..."
        exit 0
        ;;
    
    *)
        echo "Lựa chọn không hợp lệ!"
        ;;
esac


