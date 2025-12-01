# Scripts Migration

## migrateProducts.js

Script để tự động thêm sản phẩm với variants vào database.

### Cách sử dụng:

1. **Cập nhật Prisma schema** (nếu chưa):
   ```bash
   cd adminpanel-app/admin-backend
   npx prisma generate
   ```

2. **Xem danh sách categories**:
   ```bash
   node scripts/migrateProducts.js --action=list
   ```

3. **Xóa các sản phẩm cũ**:
   ```bash
   node scripts/migrateProducts.js --action=delete
   ```

4. **Tạo sản phẩm mới với variants**:
   ```bash
   node scripts/migrateProducts.js --categoryId=<CATEGORY_ID> --action=create
   ```

5. **Làm tất cả (xóa cũ + tạo mới)**:
   ```bash
   node scripts/migrateProducts.js --categoryId=<CATEGORY_ID> --action=all
   ```

### Ví dụ:

```bash
# Bước 1: Xem danh sách categories để lấy ID
node scripts/migrateProducts.js --action=list

# Bước 2: Xóa sản phẩm cũ và tạo mới
node scripts/migrateProducts.js --categoryId=507f1f77bcf86cd799439011 --action=all
```

### Sản phẩm sẽ được tạo:

1. **SỐT TỎI** (175.000 ₫)
   - Variant: Kích thước (4 options)
   - Variant: Loại sốt (3 options)

2. **CHẢO PHÔ MAI** (200.000 ₫)
   - Variant: Kích thước (3 options)

3. **PHỦ BỘT PHÔ MAI** (180.000 ₫)
   - Variant: Kích thước (2 options)

### Lưu ý:

- Script sẽ tự động kiểm tra và cập nhật nếu sản phẩm đã tồn tại
- Các sản phẩm cũ sẽ được xóa trước khi tạo mới
- Đảm bảo database đã được kết nối và Prisma client đã được generate

