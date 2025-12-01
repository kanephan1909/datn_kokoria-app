/**
 * Script để tự động thêm sản phẩm với variants vào database
 * 
 * Cách sử dụng:
 * 1. cd adminpanel-app/admin-backend
 * 2. node scripts/migrateProducts.js
 * 
 * Hoặc chạy với node:
 * node scripts/migrateProducts.js --categoryId=<ID_CATEGORY> --action=create
 * node scripts/migrateProducts.js --action=delete --oldProductNames="SỐT TỎI - Gà nguyên con,SỐT TỎI - Gà nửa con"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Cấu hình sản phẩm mới
const NEW_PRODUCTS = [
  {
    name: 'SỐT TỎI',
    price: 175000, // Giá cơ bản (Gà nửa con)
    description: 'Gà sốt tỏi thơm ngon, đậm đà',
    stock: 100,
    isActive: true,
    variants: [
      {
        type: 'size',
        name: 'Kích thước',
        required: true,
        options: [
          { id: 'ga-nua-con', name: 'Gà nửa con', price: 0 },
          { id: 'ga-nguyen-con', name: 'Gà nguyên con', price: 175000 },
          { id: 'canh-ga-cat-khuc', name: 'Cánh gà cắt khúc', price: -46000 },
          { id: 'dui-rut-xuong-l', name: 'Đùi rút xương L', price: 24000 },
        ],
      },
      {
        type: 'sauce',
        name: 'Loại sốt',
        required: true,
        options: [
          { id: 'sot-toi', name: 'Sốt tỏi', price: 0 },
          { id: 'phu-bot-pho-mai', name: 'Phủ bột phô mai', price: 25000 },
          { id: 'chao-pho-mai', name: 'Chảo phô mai', price: 30000 },
        ],
      },
    ],
  },
  {
    name: 'CHẢO PHÔ MAI',
    price: 200000, // Giá cơ bản (Nhỏ)
    description: 'Chảo phô mai béo ngậy, thơm lừng',
    stock: 100,
    isActive: true,
    variants: [
      {
        type: 'size',
        name: 'Kích thước',
        required: true,
        options: [
          { id: 'nho', name: 'Nhỏ', price: 0 },
          { id: 'vua', name: 'Vừa', price: 100000 },
          { id: 'lon', name: 'Lớn', price: 200000 },
        ],
      },
    ],
  },
  {
    name: 'PHỦ BỘT PHÔ MAI',
    price: 180000, // Giá cơ bản (Gà nửa con)
    description: 'Gà phủ bột phô mai giòn tan',
    stock: 100,
    isActive: true,
    variants: [
      {
        type: 'size',
        name: 'Kích thước',
        required: true,
        options: [
          { id: 'ga-nua-con', name: 'Gà nửa con', price: 0 },
          { id: 'ga-nguyen-con', name: 'Gà nguyên con', price: 180000 },
        ],
      },
    ],
  },
];

// Tên các sản phẩm cũ cần xóa
const OLD_PRODUCT_NAMES = [
  'SỐT TỎI - Gà nguyên con',
  'SỐT TỎI - Gà nửa con',
  'SỐT TỎI - Cánh gà cắt khúc',
  'SỐT TỎI - Đùi rút xương L',
  'CHẢO PHÔ MAI - Nhỏ',
  'CHẢO PHÔ MAI - Vừa',
  'CHẢO PHÔ MAI - Lớn',
  'PHỦ BỘT PHÔ MAI - Gà nửa con',
  'PHỦ BỘT PHÔ MAI - Gà nguyên con',
];

/**
 * Xóa các sản phẩm cũ
 */
async function deleteOldProducts() {
  console.log('🗑️  Đang xóa các sản phẩm cũ...');
  
  let deletedCount = 0;
  for (const productName of OLD_PRODUCT_NAMES) {
    try {
      const result = await prisma.product.deleteMany({
        where: {
          name: productName,
        },
      });
      deletedCount += result.count;
      if (result.count > 0) {
        console.log(`   ✓ Đã xóa: ${productName}`);
      }
    } catch (error) {
      console.error(`   ✗ Lỗi khi xóa ${productName}:`, error.message);
    }
  }
  
  console.log(`\n✅ Đã xóa ${deletedCount} sản phẩm cũ\n`);
  return deletedCount;
}

/**
 * Tạo sản phẩm mới với variants
 */
async function createNewProducts(categoryId) {
  console.log('➕ Đang tạo sản phẩm mới với variants...\n');
  
  if (!categoryId) {
    console.error('❌ Lỗi: Cần cung cấp categoryId');
    console.log('   Sử dụng: node scripts/migrateProducts.js --categoryId=<ID>');
    return;
  }

  // Kiểm tra category có tồn tại không
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    console.error(`❌ Không tìm thấy category với ID: ${categoryId}`);
    return;
  }

  console.log(`📁 Category: ${category.name} (${categoryId})\n`);

  const createdProducts = [];

  for (const productData of NEW_PRODUCTS) {
    try {
      // Kiểm tra xem sản phẩm đã tồn tại chưa
      const existing = await prisma.product.findFirst({
        where: {
          name: productData.name,
          categoryId: categoryId,
        },
      });

      if (existing) {
        console.log(`⚠️  Sản phẩm "${productData.name}" đã tồn tại, đang cập nhật...`);
        
        const updated = await prisma.product.update({
          where: { id: existing.id },
          data: {
            ...productData,
            categoryId,
            variants: productData.variants || null,
          },
        });
        
        createdProducts.push(updated);
        console.log(`   ✓ Đã cập nhật: ${productData.name}`);
      } else {
        const product = await prisma.product.create({
          data: {
            ...productData,
            categoryId,
            variants: productData.variants || null,
          },
        });
        
        createdProducts.push(product);
        console.log(`   ✓ Đã tạo: ${productData.name}`);
        console.log(`     - Giá: ${productData.price.toLocaleString('vi-VN')} ₫`);
        console.log(`     - Variants: ${productData.variants?.length || 0} variant(s)`);
        if (productData.variants) {
          productData.variants.forEach((variant, idx) => {
            console.log(`       ${idx + 1}. ${variant.name} (${variant.options.length} options)`);
          });
        }
      }
      console.log('');
    } catch (error) {
      console.error(`   ✗ Lỗi khi tạo "${productData.name}":`, error.message);
      console.log('');
    }
  }

  console.log(`\n✅ Đã tạo/cập nhật ${createdProducts.length} sản phẩm\n`);
  return createdProducts;
}

/**
 * Lấy danh sách categories để người dùng chọn
 */
async function listCategories() {
  console.log('📋 Danh sách categories:\n');
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  if (categories.length === 0) {
    console.log('   Không có category nào');
    return;
  }

  categories.forEach((cat, index) => {
    console.log(`   ${index + 1}. ${cat.name} (ID: ${cat.id})`);
  });
  console.log('');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const action = args.find(arg => arg.startsWith('--action='))?.split('=')[1] || 'all';
  const categoryId = args.find(arg => arg.startsWith('--categoryId='))?.split('=')[1];
  const oldProductNames = args.find(arg => arg.startsWith('--oldProductNames='))?.split('=')[1];

  console.log('🚀 Bắt đầu migration products...\n');

  try {
    if (action === 'delete' || action === 'all') {
      if (oldProductNames) {
        // Xóa các sản phẩm được chỉ định
        const names = oldProductNames.split(',');
        for (const name of names) {
          await prisma.product.deleteMany({
            where: { name: name.trim() },
          });
        }
        console.log(`✅ Đã xóa ${names.length} sản phẩm\n`);
      } else {
        await deleteOldProducts();
      }
    }

    if (action === 'create' || action === 'all') {
      if (!categoryId) {
        console.log('⚠️  Chưa có categoryId, hiển thị danh sách categories:\n');
        await listCategories();
        console.log('💡 Sử dụng: node scripts/migrateProducts.js --categoryId=<ID> --action=create');
        return;
      }
      await createNewProducts(categoryId);
    }

    if (action === 'list') {
      await listCategories();
    }

    console.log('✨ Hoàn thành!\n');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
if (require.main === module) {
  main();
}

module.exports = { deleteOldProducts, createNewProducts, listCategories };

