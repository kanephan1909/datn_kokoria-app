/**
 * Migration script: Migrate variants từ JSON field sang ProductVariant và ProductVariantOption tables
 * 
 * Chạy script này sau khi đã update Prisma schema và chạy prisma generate
 * 
 * Usage: node scripts/migrate-variants-to-tables.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateVariants() {
    try {
        console.log('🚀 Bắt đầu migration variants...');

        // Lấy tất cả products có variants (JSON)
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { variants: { not: null } },
                    { productVariants: { none: {} } }, // Chưa có variants trong bảng mới
                ],
            },
        });

        console.log(`📦 Tìm thấy ${products.length} products cần kiểm tra`);

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                // Kiểm tra xem đã có ProductVariant chưa
                const existingVariants = await prisma.productVariant.findMany({
                    where: { productId: product.id },
                });

                if (existingVariants.length > 0) {
                    console.log(`⏭️  Product ${product.id} đã có variants trong bảng mới, bỏ qua`);
                    skippedCount++;
                    continue;
                }

                let variantsData = null;

                // Parse variants từ JSON
                if (product.variants) {
                    if (typeof product.variants === 'string') {
                        try {
                            variantsData = JSON.parse(product.variants);
                        } catch (e) {
                            console.error(`❌ Lỗi parse JSON cho product ${product.id}:`, e.message);
                            errorCount++;
                            continue;
                        }
                    } else if (Array.isArray(product.variants)) {
                        variantsData = product.variants;
                    } else if (typeof product.variants === 'object') {
                        variantsData = [product.variants];
                    }
                }

                if (!variantsData || !Array.isArray(variantsData) || variantsData.length === 0) {
                    console.log(`⚠️  Product ${product.id} không có variants hợp lệ, bỏ qua`);
                    skippedCount++;
                    continue;
                }

                // Tạo ProductVariant và ProductVariantOption
                for (let i = 0; i < variantsData.length; i++) {
                    const variantData = variantsData[i];

                    const variant = await prisma.productVariant.create({
                        data: {
                            productId: product.id,
                            type: variantData.type || 'other',
                            name: variantData.name || '',
                            required: variantData.required !== undefined ? variantData.required : true,
                            order: i,
                        },
                    });

                    // Tạo options cho variant
                    if (variantData.options && Array.isArray(variantData.options) && variantData.options.length > 0) {
                        await prisma.productVariantOption.createMany({
                            data: variantData.options.map((option, optIndex) => ({
                                variantId: variant.id,
                                name: option.name || '',
                                price: typeof option.price === 'number' ? option.price : 0,
                                order: optIndex,
                            })),
                        });
                    }
                }

                migratedCount++;
                console.log(`✅ Đã migrate product ${product.id} (${product.name})`);
            } catch (error) {
                console.error(`❌ Lỗi khi migrate product ${product.id}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📊 Kết quả migration:');
        console.log(`✅ Thành công: ${migratedCount} products`);
        console.log(`⏭️  Đã có sẵn: ${skippedCount} products`);
        console.log(`❌ Lỗi: ${errorCount} products`);
        console.log('🎉 Migration hoàn tất!');

    } catch (error) {
        console.error('❌ Lỗi migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Chạy migration
migrateVariants()
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });

