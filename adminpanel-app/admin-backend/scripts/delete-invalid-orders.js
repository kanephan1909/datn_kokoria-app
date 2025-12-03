require('dotenv').config();

/**
 * Script để xóa tất cả Order, chỉ giữ lại 2 đơn hàng mới nhất
 * 
 * Cách chạy: node scripts/delete-invalid-orders.js
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

async function deleteInvalidOrders() {
    const uri = process.env.DATABASE_URL;
    
    if (!uri) {
        console.error('❌ DATABASE_URL không được tìm thấy trong .env');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        console.log('🔄 Bắt đầu xóa đơn hàng, chỉ giữ lại 2 đơn hàng mới nhất...');
        await client.connect();
        
        const db = client.db();
        const ordersCollection = db.collection('Order');
        const paymentsCollection = db.collection('Payment');
        const orderLogsCollection = db.collection('OrderLog');
        const messagesCollection = db.collection('Message');

        // Lấy tất cả Order, sắp xếp theo createdAt (mới nhất trước)
        const allOrders = await ordersCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        console.log(`📊 Tìm thấy tổng cộng ${allOrders.length} đơn hàng`);

        if (allOrders.length <= 2) {
            console.log('✅ Chỉ có 2 đơn hàng hoặc ít hơn, không cần xóa.');
            return;
        }

        // Giữ lại 2 đơn hàng mới nhất
        const ordersToKeep = allOrders.slice(0, 2);
        const ordersToDelete = allOrders.slice(2);

        console.log(`\n📌 Sẽ giữ lại 2 đơn hàng mới nhất:`);
        ordersToKeep.forEach((order, index) => {
            console.log(`   ${index + 1}. Order ID: ${order._id} - Created: ${order.createdAt}`);
        });

        console.log(`\n⚠️  CẢNH BÁO: Script này sẽ xóa:`);
        console.log(`   - ${ordersToDelete.length} Order`);
        console.log(`   - Tất cả Payment liên quan`);
        console.log(`   - Tất cả OrderLog liên quan`);
        console.log(`   - Tất cả Message liên quan`);
        console.log('\n🔄 Bắt đầu xóa...\n');

        let deletedCount = 0;
        const orderIds = ordersToDelete.map(order => order._id);

        // Xóa các bản ghi liên quan
        for (const orderId of orderIds) {
            // Xóa Payment records
            const paymentResult = await paymentsCollection.deleteMany({
                orderId: orderId
            });
            console.log(`   - Đã xóa ${paymentResult.deletedCount} Payment cho order ${orderId}`);

            // Xóa OrderLog records
            const logResult = await orderLogsCollection.deleteMany({
                orderId: orderId
            });
            console.log(`   - Đã xóa ${logResult.deletedCount} OrderLog cho order ${orderId}`);

            // Xóa Message records
            const messageResult = await messagesCollection.deleteMany({
                orderId: orderId
            });
            console.log(`   - Đã xóa ${messageResult.deletedCount} Message cho order ${orderId}`);

            // Xóa Order
            const orderResult = await ordersCollection.deleteOne({
                _id: orderId
            });
            
            if (orderResult.deletedCount > 0) {
                deletedCount++;
                console.log(`✅ Đã xóa order ${orderId}`);
            }
        }

        console.log(`\n✨ Hoàn tất! Đã xóa ${deletedCount} đơn hàng và tất cả dữ liệu liên quan.`);

    } catch (error) {
        console.error('❌ Lỗi khi xóa:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

// Chạy script
deleteInvalidOrders();

