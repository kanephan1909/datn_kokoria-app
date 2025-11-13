// Dữ liệu menu cho ứng dụng

export interface MenuItem {
  id: string;
  name: string;
  price?: number;
  description?: string;
  category: string;
  image?: string;
  sizes?: {name: string; price: number}[];
  sauces?: string[];
  badge?: 'BEST' | 'HOT' | 'NEW';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Danh mục
export const CATEGORIES: Category[] = [
  {id: '1', name: 'Gà rán', icon: 'restaurant', color: '#F97316'},
  {id: '2', name: 'Món ăn kèm', icon: 'layers', color: '#EF4444'},
  {id: '3', name: 'Đồ uống', icon: 'cafe', color: '#3B82F6'},
  {id: '4', name: 'Combo', icon: 'basket', color: '#10B981'},
  {id: '5', name: 'Hot Plate', icon: 'flame', color: '#F59E0B'},
  {id: '6', name: 'Lẩu', icon: 'nutrition', color: '#8B5CF6'},
  {id: '7', name: 'Tokbokki', icon: 'disc', color: '#EC4899'},
  {id: '8', name: 'Mì & Cơm', icon: 'fast-food', color: '#14B8A6'},
];

// Menu Gà rán
export const CHICKEN_MENU: MenuItem[] = [
  {
    id: 'chicken-1',
    name: 'Đùi rút xương',
    category: 'Gà rán',
    sizes: [
      {name: 'M', price: 129000},
      {name: 'L', price: 199000},
    ],
    sauces: [
      'Sốt cay',
      'Sốt kem hành',
      'Sốt phô mai',
      'Sốt tỏi',
      'Sốt mật ong',
      'Sốt Koko (Ngọt, cay)',
      'Sốt mù tạt mật ong',
      'Phủ bột phô mai',
    ],
  },
  {
    id: 'chicken-2',
    name: 'Cánh gà cắt khúc',
    category: 'Gà rán',
    price: 129000,
    sauces: [
      'Sốt cay',
      'Sốt kem hành',
      'Sốt phô mai',
      'Sốt tỏi',
      'Sốt mật ong',
      'Sốt Koko',
    ],
  },
  {
    id: 'chicken-3',
    name: 'Gà nửa con',
    category: 'Gà rán',
    price: 175000,
    sauces: ['Sốt cay', 'Sốt kem hành', 'Sốt phô mai', 'Sốt tỏi'],
  },
  {
    id: 'chicken-4',
    name: 'Gà nguyên con',
    category: 'Gà rán',
    price: 350000,
    sauces: ['Sốt cay', 'Sốt kem hành', 'Sốt phô mai'],
  },
  {
    id: 'chicken-5',
    name: 'Mix 2 vị',
    category: 'Gà rán',
    price: 255000,
    description: 'Đùi rút xương',
    badge: 'HOT',
  },
  {
    id: 'chicken-6',
    name: 'Mix 3 vị',
    category: 'Gà rán',
    price: 380000,
    description: 'Đùi rút xương',
    badge: 'BEST',
  },
];

// Món ăn kèm
export const SIDE_DISHES: MenuItem[] = [
  {
    id: 'side-1',
    name: 'Khoai tây chiên bơ tỏi',
    category: 'Món ăn kèm',
    price: 40000,
    description: 'French Fries with Garlic Butter Powder',
  },
  {
    id: 'side-2',
    name: 'Cheese Ball',
    category: 'Món ăn kèm',
    sizes: [
      {name: '3 viên', price: 39000},
      {name: '5 viên', price: 59000},
    ],
    badge: 'BEST',
  },
  {
    id: 'side-3',
    name: 'Mandu Chiên',
    category: 'Món ăn kèm',
    price: 79000,
    description: 'Fried Mandu (5 PCS)',
  },
  {
    id: 'side-4',
    name: 'Salad',
    category: 'Món ăn kèm',
    price: 40000,
  },
];

// Đồ uống
export const DRINKS: MenuItem[] = [
  {
    id: 'drink-1',
    name: 'Soda',
    category: 'Đồ uống',
    price: 30000,
    description: 'Đào, Kiwi, Việt Quất, Dâu, Xoài, Cam, Nha Đam, Phúc Bồn Tử, Nho Đen',
  },
  {
    id: 'drink-2',
    name: 'Soda Yakult',
    category: 'Đồ uống',
    price: 40000,
    description: 'Strawberry, Mango, Kiwi, Blueberry, Raspberry',
  },
  {
    id: 'drink-3',
    name: 'Tea',
    category: 'Đồ uống',
    price: 45000,
    description: 'Trà đào cam sả',
  },
  {
    id: 'drink-4',
    name: 'Yogurt Peach',
    category: 'Đồ uống',
    price: 35000,
  },
  {
    id: 'drink-5',
    name: 'Soft Drink',
    category: 'Đồ uống',
    price: 20000,
    description: 'Coca, Pepsi, 7up, Sting',
  },
  {
    id: 'drink-6',
    name: 'Beer',
    category: 'Đồ uống',
    price: 30000,
    description: 'Tiger',
  },
];

// Combo
export const COMBOS: MenuItem[] = [
  {
    id: 'combo-1',
    name: 'Combo Mix 2 vị',
    category: 'Combo',
    price: 345000,
    description: 'Gà Mix 2 vị, Khoai tây chiên bơ tỏi, Mandu (3 pcs), Coca-Cola 660ml',
    badge: 'HOT',
  },
  {
    id: 'combo-2',
    name: 'Combo đầy đủ',
    category: 'Combo',
    price: 235000,
    description: 'Gà rút xương chiên giòn, Khoai tây chiên, Bánh gạo',
  },
];

// Hot Plate
export const HOT_PLATES: MenuItem[] = [
  {
    id: 'hotplate-1',
    name: 'Hot Plate',
    category: 'Hot Plate',
    sizes: [
      {name: 'Vừa', price: 209000},
      {name: 'Lớn', price: 279000},
    ],
    sauces: ['Sốt Koko (Ngọt, cay)', 'Sốt cay'],
  },
  {
    id: 'hotplate-2',
    name: 'Chảo sườn phô mai',
    category: 'Hot Plate',
    price: 320000,
    description: 'One Size',
    sauces: ['Sốt BBQ', 'Sốt cay'],
  },
];

// Tokbokki
export const TOKBOKKI: MenuItem[] = [
  {
    id: 'tokbokki-1',
    name: 'Tokbokki',
    category: 'Tokbokki',
    price: 59000,
    description: 'Korean spicy rice cake',
  },
  {
    id: 'tokbokki-2',
    name: 'Tok Mi',
    category: 'Tokbokki',
    price: 69000,
    description: 'Korean spicy rice cake with noodles',
  },
  {
    id: 'tokbokki-3',
    name: 'Tok Lắc Phô Mai',
    category: 'Tokbokki',
    price: 39000,
    description: 'Fried rice cake with cheese powder',
  },
];

// Lẩu
export const HOTPOTS: MenuItem[] = [
  {
    id: 'hotpot-1',
    name: 'Lẩu chả cá',
    category: 'Lẩu',
    price: 179000,
    description: 'Korean Fish Cake Hotpot',
  },
  {
    id: 'hotpot-2',
    name: 'Lẩu gà cay',
    category: 'Lẩu',
    price: 259000,
    description: 'Spicy Chicken Hotpot',
  },
];

// Mì & Cơm
export const NOODLES_RICE: MenuItem[] = [
  {
    id: 'noodle-1',
    name: 'Cơm trộn thịt bò',
    category: 'Mì & Cơm',
    price: 69000,
    description: 'Beef Mixed Rice',
  },
  {
    id: 'noodle-2',
    name: 'Cơm trộn cá ngừ',
    category: 'Mì & Cơm',
    price: 69000,
    description: 'Tuna Mixed Rice',
  },
  {
    id: 'noodle-3',
    name: 'Mì cay Samyang',
    category: 'Mì & Cơm',
    price: 55000,
    description: 'Samyang Spicy Noodles',
  },
  {
    id: 'noodle-4',
    name: 'Mì Shin',
    category: 'Mì & Cơm',
    price: 55000,
    description: 'Shin Noodles',
  },
  {
    id: 'noodle-5',
    name: 'Mì lạnh nước/trộn',
    category: 'Mì & Cơm',
    price: 79000,
    description: 'Cold noodles (Soup/Mixed Sauce)',
  },
  {
    id: 'noodle-6',
    name: 'Mì tương đen',
    category: 'Mì & Cơm',
    price: 69000,
    description: 'Korean Black Bean noodles',
  },
];

// Tất cả món ăn
export const ALL_MENU_ITEMS: MenuItem[] = [
  ...CHICKEN_MENU,
  ...SIDE_DISHES,
  ...DRINKS,
  ...COMBOS,
  ...HOT_PLATES,
  ...TOKBOKKI,
  ...HOTPOTS,
  ...NOODLES_RICE,
];

