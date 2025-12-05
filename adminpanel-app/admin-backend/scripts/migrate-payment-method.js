require('dotenv').config();

/**
 * Migration script để fix dữ liệu paymentMethod cũ
 * Chuyển MOMO, VNPAY từ paymentMethod sang paymentProvider
 * 
 * Cách chạy: node scripts/migrate-payment-method.js
 * 
 * Yêu cầu: npm install mongodb (nếu chưa có)
 */

let MongoClient;
try {
    MongoClient = require('mongodb').MongoClient;
} catch (error) {
    console.error('❌ Package mongodb chưa được cài đặt.');
    console.error('💡 Vui lòng chạy: npm install mongodb');
    console.error('   Sau đó chạy lại script này.');
    process.exit(1);
}

async function migratePaymentMethod() {
    const uri = process.env.DATABASE_URL;
    
    if (!uri) {
        console.error('❌ DATABASE_URL không được tìm thấy trong .env');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        console.log('🔄 Bắt đầu migration paymentMethod...');
        await client.connect();
        
        const db = client.db();
        const ordersCollection = db.collection('Order');
        const paymentsCollection = db.collection('Payment');

        // Tìm tất cả Order có paymentMethod = 'MOMO' hoặc 'VNPAY'
        const ordersToFix = await ordersCollection.find({
            paymentMethod: { $in: ['MOMO', 'VNPAY'] }
        }).toArray();

        console.log(`📊 Tìm thấy ${ordersToFix.length} đơn hàng cần migration`);

        if (ordersToFix.length === 0) {
            console.log('✅ Không có dữ liệu cần migration.');
            return;
        }

        let migratedCount = 0;

        for (const order of ordersToFix) {
            const oldPaymentMethod = order.paymentMethod; // 'MOMO' hoặc 'VNPAY'
            
            // 1. Đổi paymentMethod thành 'ONLINE'
            await ordersCollection.updateOne(
                { _id: order._id },
                { $set: { paymentMethod: 'ONLINE' } }
            );

            // 2. Tìm hoặc tạo Payment record và update provider
            const existingPayment = await paymentsCollection.findOne({
                orderId: order._id
            });

            if (existingPayment) {
                // Update provider nếu đã có Payment record
                await paymentsCollection.updateOne(
                    { _id: existingPayment._id },
                    { 
                        $set: { 
                            provider: oldPaymentMethod, // 'MOMO' hoặc 'VNPAY'
                            method: 'ONLINE'
                        } 
                    }
                );
            } else {
                // Tạo Payment record mới nếu chưa có
                await paymentsCollection.insertOne({
                    orderId: order._id,
                    provider: oldPaymentMethod, // 'MOMO' hoặc 'VNPAY'
                    method: 'ONLINE',
                    status: order.paymentStatus || 'PAYMENT_PENDING',
                    amount: order.totalAmount || 0,
                    currency: 'VND',
                    createdAt: order.createdAt || new Date()
                });
            }

            migratedCount++;
            console.log(`✅ Đã migrate đơn hàng ${order._id}: ${oldPaymentMethod} -> ONLINE (provider: ${oldPaymentMethod})`);
        }

        console.log(`\n✨ Migration hoàn tất! Đã migrate ${migratedCount} đơn hàng.`);
        console.log('💡 Bây giờ bạn có thể chạy: npx prisma generate');

    } catch (error) {
        console.error('❌ Lỗi khi migration:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

// Chạy migration
migratePaymentMethod();





