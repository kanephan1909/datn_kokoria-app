import {ProductVariant, ProductOption} from '../types/product';

/**
 * Tự động tạo variant "Kích thước" với các options phổ biến
 */
export const createSizeVariant = (options: {
  basePrice: number;
  sizes: Array<{name: string; price: number}>;
}): ProductVariant => {
  const {basePrice, sizes} = options;

  const variantOptions: ProductOption[] = sizes.map(size => ({
    id: `size-${size.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: size.name,
    price: size.price - basePrice, // Tính giá bổ sung
  }));

  return {
    type: 'size',
    name: 'Kích thước',
    required: true,
    options: variantOptions,
  };
};

/**
 * Tự động tạo variant "Loại sốt" với các options phổ biến
 */
export const createSauceVariant = (sauces: Array<{name: string; priceAdjustment: number}>): ProductVariant => {
  const variantOptions: ProductOption[] = sauces.map(sauce => ({
    id: `sauce-${sauce.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: sauce.name,
    price: sauce.priceAdjustment,
  }));

  return {
    type: 'sauce',
    name: 'Loại sốt',
    required: true,
    options: variantOptions,
  };
};

/**
 * Preset cho sản phẩm "SỐT TỎI"
 * Tự động tạo variants với các options phổ biến
 */
export const getSotToiPreset = () => {
  const basePrice = 175000; // Giá cơ bản (Gà nửa con)

  const sizeVariant = createSizeVariant({
    basePrice,
    sizes: [
      {name: 'Gà nửa con', price: 175000},
      {name: 'Gà nguyên con', price: 350000},
      {name: 'Cánh gà cắt khúc', price: 129000},
      {name: 'Đùi rút xương L', price: 199000},
    ],
  });

  const sauceVariant = createSauceVariant([
    {name: 'Sốt tỏi', priceAdjustment: 0},
    {name: 'Phủ bột phô mai', priceAdjustment: 25000},
    {name: 'Chảo phô mai', priceAdjustment: 30000},
  ]);

  return {
    basePrice,
    variants: [sizeVariant, sauceVariant],
  };
};

/**
 * Preset cho sản phẩm "CHẢO PHÔ MAI"
 */
export const getChaoPhoMaiPreset = () => {
  const basePrice = 200000; // Giá cơ bản

  const sizeVariant = createSizeVariant({
    basePrice,
    sizes: [
      {name: 'Nhỏ', price: 200000},
      {name: 'Vừa', price: 300000},
      {name: 'Lớn', price: 400000},
    ],
  });

  return {
    basePrice,
    variants: [sizeVariant],
  };
};

/**
 * Preset cho sản phẩm "PHỦ BỘT PHÔ MAI"
 */
export const getPhuBotPhoMaiPreset = () => {
  const basePrice = 180000; // Giá cơ bản

  const sizeVariant = createSizeVariant({
    basePrice,
    sizes: [
      {name: 'Gà nửa con', price: 180000},
      {name: 'Gà nguyên con', price: 360000},
    ],
  });

  return {
    basePrice,
    variants: [sizeVariant],
  };
};

/**
 * Tự động điền form data với preset
 */
export const applyPreset = (
  presetName: 'sot-toi' | 'chao-pho-mai' | 'phu-bot-pho-mai',
  currentFormData: any,
) => {
  let preset: {basePrice: number; variants: ProductVariant[]};

  switch (presetName) {
    case 'sot-toi':
      preset = getSotToiPreset();
      break;
    case 'chao-pho-mai':
      preset = getChaoPhoMaiPreset();
      break;
    case 'phu-bot-pho-mai':
      preset = getPhuBotPhoMaiPreset();
      break;
    default:
      return currentFormData;
  }

  return {
    ...currentFormData,
    price: preset.basePrice.toString(),
    variants: preset.variants,
  };
};

