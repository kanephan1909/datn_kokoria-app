# Script de chay demo du an Kokoria
# Su dung PowerShell tren Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   KOKORIA PROJECT - DEMO SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiem tra Node.js
Write-Host "Dang kiem tra Node.js..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCheck) {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Node.js chua duoc cai dat!" -ForegroundColor Red
    Write-Host "Vui long cai dat Node.js >= 18" -ForegroundColor Red
    exit 1
}

# Kiem tra MongoDB
Write-Host "Dang kiem tra MongoDB..." -ForegroundColor Yellow
$mongoCheck = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($mongoCheck) {
    Write-Host "[OK] MongoDB service da duoc tim thay" -ForegroundColor Green
} else {
    Write-Host "[WARNING] MongoDB service khong tim thay (co the dang chay hoac dung MongoDB Atlas)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Chon service de chay:" -ForegroundColor Cyan
Write-Host "1. Backend Server" -ForegroundColor White
Write-Host "2. Admin Panel App" -ForegroundColor White
Write-Host "3. Kokoria App (Khach hang)" -ForegroundColor White
Write-Host "4. Shipper App" -ForegroundColor White
Write-Host "5. Chay tat ca (mo nhieu terminal)" -ForegroundColor White
Write-Host "0. Thoat" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Nhap lua chon (0-5)"

switch ($choice) {
    "1" {
        Write-Host "Dang khoi dong Backend Server..." -ForegroundColor Yellow
        Set-Location "adminpanel-app\admin-backend"
        
        # Kiem tra .env
        if (-not (Test-Path ".env")) {
            Write-Host "[WARNING] File .env khong ton tai!" -ForegroundColor Yellow
            Write-Host "Vui long tao file .env trong adminpanel-app/admin-backend/" -ForegroundColor Yellow
            Write-Host "Xem huong dan trong HUONG_DAN_DEMO.md" -ForegroundColor Yellow
        }
        
        # Kiem tra node_modules
        if (-not (Test-Path "node_modules")) {
            Write-Host "Dang cai dat dependencies..." -ForegroundColor Yellow
            npm install
        }
        
        Write-Host "Khoi dong server tai http://localhost:3000" -ForegroundColor Green
        npm start
    }
    
    "2" {
        Write-Host "Dang khoi dong Admin Panel App..." -ForegroundColor Yellow
        Set-Location "adminpanel-app"
        
        if (-not (Test-Path "node_modules")) {
            Write-Host "Dang cai dat dependencies..." -ForegroundColor Yellow
            npm install
        }
        
        Write-Host "Khoi dong Expo..." -ForegroundColor Green
        npm start
    }
    
    "3" {
        Write-Host "Dang khoi dong Kokoria App..." -ForegroundColor Yellow
        Set-Location "kokoria-app"
        
        if (-not (Test-Path "node_modules")) {
            Write-Host "Dang cai dat dependencies..." -ForegroundColor Yellow
            npm install
        }
        
        Write-Host "Khoi dong Metro bundler..." -ForegroundColor Green
        npm start
    }
    
    "4" {
        Write-Host "Dang khoi dong Shipper App..." -ForegroundColor Yellow
        Set-Location "shipper-app"
        
        if (-not (Test-Path "node_modules")) {
            Write-Host "Dang cai dat dependencies..." -ForegroundColor Yellow
            npm install
        }
        
        Write-Host "Khoi dong Expo..." -ForegroundColor Green
        npm start
    }
    
    "5" {
        Write-Host "Dang mo cac terminal cho tat ca services..." -ForegroundColor Yellow
        Write-Host "[WARNING] Luu y: Ban can chay Backend truoc!" -ForegroundColor Yellow
        Write-Host ""
        
        # Backend
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\adminpanel-app\admin-backend'; Write-Host 'Backend Server' -ForegroundColor Cyan; npm start"
        Start-Sleep -Seconds 2
        
        # Admin Panel
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\adminpanel-app'; Write-Host 'Admin Panel App' -ForegroundColor Cyan; npm start"
        Start-Sleep -Seconds 2
        
        # Kokoria App
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\kokoria-app'; Write-Host 'Kokoria App' -ForegroundColor Cyan; npm start"
        Start-Sleep -Seconds 2
        
        # Shipper App
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\shipper-app'; Write-Host 'Shipper App' -ForegroundColor Cyan; npm start"
        
        Write-Host "[OK] Da mo 4 terminal windows" -ForegroundColor Green
        Write-Host "1. Backend Server" -ForegroundColor White
        Write-Host "2. Admin Panel App" -ForegroundColor White
        Write-Host "3. Kokoria App" -ForegroundColor White
        Write-Host "4. Shipper App" -ForegroundColor White
    }
    
    "0" {
        Write-Host "Thoat..." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "Lua chon khong hop le!" -ForegroundColor Red
    }
}

