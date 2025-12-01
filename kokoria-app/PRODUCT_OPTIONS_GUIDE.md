# Hướng dẫn sử dụng Product Options/Variants

## Tổng quan

Hệ thống đã được cập nhật để hỗ trợ **options/variants** cho sản phẩm. Thay vì tạo nhiều sản phẩm riêng biệt cho từng size/sốt, bạn có thể tạo 1 sản phẩm với các options.

## Cấu trúc dữ liệu

### Product với Variants

```typescript
{
  id: "product-123",
  name: "Gà sốt tỏi",
  price: 150000, // Giá cơ bản
  imageUrl: "...",
  description: "...",
  variants: [
    {
      type: "size", // Loại variant
      name: "Kích thước", // Tên hiển thị
      required: true, // Bắt buộc chọn
      options: [
        { id: "size-1", name: "Nguyên con", price: 0 },
        { id: "size-2", name: "Nửa con", price: -50000 },
        { id: "size-3", name: "1/4 con", price: -75000 }
      ]
    },
    {
      type: "sauce",
      name: "Loại sốt",
      required: true,
      options: [
        { id: "sauce-1", name: "Sốt tỏi", price: 0 },
        { id: "sauce-2", name: "Sốt phô mai", price: 20000 },
        { id: "sauce-3", name: "Sốt mật ong", price: 15000 }
      ]
    }
  ]
}
```

## Ví dụ cụ thể

### 1. Gà sốt tỏi (với size và sốt)

```json
{
  "name": "Gà sốt tỏi",
  "price": 200000,
  "variants": [
    {
      "type": "size",
      "name": "Kích thước",
      "required": true,
      "options": [
        { "id": "nguyen-con", "name": "Nguyên con", "price": 0 },
        { "id": "nua-con", "name": "Nửa con", "price": -100000 },
        { "id": "1-4-con", "name": "1/4 con", "price": -150000 }
      ]
    },
    {
      "type": "sauce",
      "name": "Loại sốt",
      "required": true,
      "options": [
        { "id": "sot-toi", "name": "Sốt tỏi", "price": 0 },
        { "id": "sot-pho-mai", "name": "Phủ bột phô mai", "price": 25000 },
        { "id": "sot-mat-ong", "name": "Sốt mật ong", "price": 20000 }
      ]
    }
  ]
}
```

### 2. Chảo phô mai (chỉ có size)

```json
{
  "name": "Chảo phô mai",
  "price": 250000,
  "variants": [
    {
      "type": "size",
      "name": "Kích thước",
      "required": true,
      "options": [
        { "id": "size-s", "name": "Nhỏ (S)", "price": 0 },
        { "id": "size-m", "name": "Vừa (M)", "price": 50000 },
        { "id": "size-l", "name": "Lớn (L)", "price": 100000 }
      ]
    }
  ]
}
```

## Cách tính giá

Giá cuối cùng = `Giá cơ bản + Tổng giá của các options đã chọn`

Ví dụ:
- Gà sốt tỏi: 200,000đ (giá cơ bản)
- Chọn: Nửa con (-100,000đ) + Phủ bột phô mai (+25,000đ)
- **Giá cuối cùng: 200,000 - 100,000 + 25,000 = 125,000đ**

## Lưu ý

1. **Required options**: Nếu `required: true`, user phải chọn option đó trước khi thêm vào giỏ
2. **Price trong options**: 
   - `0` = không thay đổi giá
   - Số dương = tăng giá
   - Số âm = giảm giá
3. **Cart**: Mỗi combination của options sẽ được coi là một item riêng trong cart
4. **Note**: Options đã chọn sẽ được lưu trong `note` field của cart item

## Backend Implementation

Backend cần hỗ trợ:
- Lưu `variants` trong product schema
- Lưu `note` trong cart item để track options đã chọn
- Khi tạo product, có thể thêm field `variants` (JSON array)

