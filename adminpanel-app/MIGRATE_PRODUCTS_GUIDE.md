# Hướng dẫn gộp sản phẩm cũ thành sản phẩm với Variants

## Tình huống
Bạn có nhiều sản phẩm riêng biệt như:
- "SỐT TỎI - Gà nguyên con" (350.000 ₫)
- "SỐT TỎI - Gà nửa con" (175.000 ₫)
- "SỐT TỎI - Cánh gà cắt khúc" (129.000 ₫)
- "SỐT TỎI - Đùi rút xương L" (199.000 ₫)

Bạn muốn gộp chúng thành **1 sản phẩm duy nhất** "SỐT TỎI" với các options để chọn kích thước.

## Các bước thực hiện

### Bước 1: Ghi chú thông tin sản phẩm cũ
Trước khi xóa, hãy ghi lại:
- **Tên sản phẩm**: "SỐT TỎI"
- **Giá cơ bản**: Chọn giá của option nhỏ nhất hoặc giá trung bình (ví dụ: 175.000 ₫ cho "Gà nửa con")
- **Danh mục**: Ghi lại categoryId của các sản phẩm cũ
- **Ảnh**: Lưu lại URL ảnh của sản phẩm (nếu có)
- **Mô tả**: Ghi lại mô tả (nếu có)
- **Tồn kho**: Ghi lại số lượng tồn kho

### Bước 2: Xóa các sản phẩm cũ
1. Vào màn hình **Sản Phẩm** trong admin panel
2. Tìm và xóa từng sản phẩm cũ:
   - "SỐT TỎI - Gà nguyên con"
   - "SỐT TỎI - Gà nửa con"
   - "SỐT TỎI - Cánh gà cắt khúc"
   - "SỐT TỎI - Đùi rút xương L"
3. Nhấn icon **🗑️ (trash)** bên cạnh mỗi sản phẩm để xóa

### Bước 3: Tạo sản phẩm mới với Variants
1. Nhấn nút **"Thêm"** (màu xanh) ở màn hình Sản Phẩm
2. Điền thông tin cơ bản:
   - **Tên sản phẩm**: `SỐT TỎI`
   - **Giá**: `175000` (giá cơ bản - giá của option nhỏ nhất)
   - **Danh mục**: Chọn danh mục phù hợp (ví dụ: "Gà Chiên Giòn")
   - **Ảnh**: Upload hoặc nhập URL ảnh
   - **Mô tả**: Nhập mô tả sản phẩm
   - **Tồn kho**: Nhập số lượng tồn kho
   - **Trạng thái**: Chọn "Đang bán"

3. Scroll xuống phần **"Tùy chọn sản phẩm (Variants)"**

4. Nhấn **"Thêm variant"**

5. Cấu hình Variant đầu tiên - **Kích thước**:
   - **Loại variant**: Chọn **"Kích thước"**
   - **Tên hiển thị**: `Kích thước`
   - **Bắt buộc chọn**: ✅ Bật
   - **Thêm Options**:
     - Option 1:
       - Tên: `Gà nửa con`
       - Giá bổ sung: `0` (vì đây là giá cơ bản)
     - Option 2:
       - Tên: `Gà nguyên con`
       - Giá bổ sung: `175000` (350.000 - 175.000 = 175.000)
     - Option 3:
       - Tên: `Cánh gà cắt khúc`
       - Giá bổ sung: `-46000` (129.000 - 175.000 = -46.000)
     - Option 4:
       - Tên: `Đùi rút xương L`
       - Giá bổ sung: `24000` (199.000 - 175.000 = 24.000)

6. (Tùy chọn) Nếu có loại sốt khác, thêm Variant thứ 2:
   - **Loại variant**: Chọn **"Sốt"**
   - **Tên hiển thị**: `Loại sốt`
   - **Bắt buộc chọn**: ✅ Bật
   - **Thêm Options**:
     - Option 1: `Sốt tỏi` (giá: 0)
     - Option 2: `Phủ bột phô mai` (giá: +25.000)
     - Option 3: `Chảo phô mai` (giá: +30.000)

7. Nhấn **"Lưu"** để tạo sản phẩm

## Cách tính giá bổ sung

**Công thức**: `Giá bổ sung = Giá option - Giá cơ bản`

**Ví dụ:**
- Giá cơ bản (Gà nửa con): 175.000 ₫
- Gà nguyên con: 350.000 ₫
  - Giá bổ sung = 350.000 - 175.000 = **+175.000 ₫**
- Cánh gà cắt khúc: 129.000 ₫
  - Giá bổ sung = 129.000 - 175.000 = **-46.000 ₫** (giảm giá)

## Kết quả

Sau khi hoàn thành, trong app khách hàng sẽ thấy:
- **1 sản phẩm duy nhất**: "SỐT TỎI"
- Khi click vào, sẽ có options để chọn:
  - Kích thước: Gà nửa con, Gà nguyên con, Cánh gà cắt khúc, Đùi rút xương L
- Giá sẽ tự động tính: Giá cơ bản + Giá bổ sung của option đã chọn

## Lưu ý quan trọng

1. **Giá cơ bản**: Nên đặt bằng giá của option rẻ nhất để các option khác có giá bổ sung dương
2. **Xóa sản phẩm cũ**: Đảm bảo xóa hết các sản phẩm cũ trước khi tạo mới để tránh trùng lặp
3. **Kiểm tra lại**: Sau khi tạo, vào app khách hàng để kiểm tra xem options hiển thị đúng chưa
4. **Backup dữ liệu**: Nếu có thể, backup database trước khi xóa sản phẩm cũ

