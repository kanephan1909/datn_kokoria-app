// Product types for admin panel
export interface ProductOption {
  id: string;
  name: string;
  price: number; // Giá bổ sung (có thể là 0, dương hoặc âm)
}

export interface ProductVariant {
  type: 'size' | 'sauce' | 'other';
  name: string; // Tên hiển thị (ví dụ: "Kích thước", "Loại sốt")
  options: ProductOption[];
  required: boolean; // Bắt buộc chọn hay không
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  categoryId: string;
  stock?: number;
  isActive?: boolean;
  variants?: ProductVariant[];
}

