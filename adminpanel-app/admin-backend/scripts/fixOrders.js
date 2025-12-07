require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script để kiểm tra và sửa các đơn hàng có vấn đề
 * - Đơn hàng COD ở trạng thái PENDING nhưng đã được tạo
 * - Đơn hàng ONLINE chưa thanh toán nhưng đang ở trạng thái CONFIRMED
 * - Đơn hàng thiếu payment status
 */
async function fixOrders() {
  try {
    console.log('🔍 Đang kiểm tra và sửa đơn hàng...\n');

    // 1. Tìm đơn hàng COD ở trạng thái PENDING (nên tự động chuyển sang CONFIRMED)
    const codPendingOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'COD',
        status: 'PENDING',
        paymentStatus: 'PAYMENT_PENDING',
      },
    });

    console.log(`📦 Tìm thấy ${codPendingOrders.length} đơn hàng COD ở trạng thái PENDING\n`);

    if (codPendingOrders.length > 0) {
      console.log('🔧 Đang sửa đơn hàng COD...');
      for (const order of codPendingOrders) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAYMENT_SUCCESS',
            confirmedAt: new Date(),
          },
        });
        console.log(`   ✅ Đã sửa đơn hàng ${order.id}: PENDING -> CONFIRMED`);
      }
      console.log('');
    }

    // 2. Tìm đơn hàng ONLINE ở trạng thái CONFIRMED nhưng chưa thanh toán
    const onlineUnpaidOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'ONLINE',
        status: {
          in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'],
        },
        paymentStatus: 'PAYMENT_PENDING',
      },
    });

    console.log(`📦 Tìm thấy ${onlineUnpaidOrders.length} đơn hàng ONLINE chưa thanh toán nhưng đã CONFIRMED\n`);

    if (onlineUnpaidOrders.length > 0) {
      console.log('⚠️  Các đơn hàng này cần được thanh toán trước khi shipper nhận:');
      for (const order of onlineUnpaidOrders) {
        console.log(`   - Order ${order.id}: ${order.status}, Payment: ${order.paymentStatus}`);
      }
      console.log('');
    }

    // 3. Kiểm tra đơn hàng có driver nhưng driver không tồn tại
    const allOrders = await prisma.order.findMany({
      where: {
        driverId: {
          not: null,
        },
      },
      select: {
        id: true,
        driverId: true,
      },
    });

    console.log(`👤 Đang kiểm tra ${allOrders.length} đơn hàng có driver...\n`);

    let invalidDriverCount = 0;
    for (const order of allOrders) {
      const driver = await prisma.driver.findUnique({
        where: { id: order.driverId },
      });

      if (!driver) {
        console.log(`   ⚠️  Order ${order.id} có driverId ${order.driverId} nhưng driver không tồn tại`);
        invalidDriverCount++;
        
        // Xóa driverId nếu driver không tồn tại
        await prisma.order.update({
          where: { id: order.id },
          data: {
            driverId: null,
          },
        });
        console.log(`   ✅ Đã xóa driverId khỏi order ${order.id}`);
      }
    }

    if (invalidDriverCount === 0) {
      console.log('   ✅ Tất cả driver đều hợp lệ\n');
    } else {
      console.log(`\n   ✅ Đã sửa ${invalidDriverCount} đơn hàng có driver không hợp lệ\n`);
    }

    // 4. Tổng kết
    const availableOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'],
        },
        driverId: null,
      },
    });

    const availableCount = availableOrders.filter((order) => {
      if (order.paymentMethod === 'COD') {
        return order.status !== 'PENDING';
      }
      if (order.paymentMethod === 'ONLINE') {
        return order.paymentStatus === 'PAYMENT_SUCCESS';
      }
      return order.paymentStatus === 'PAYMENT_SUCCESS';
    }).length;

    console.log('📊 Tổng kết:');
    console.log(`   - Đơn hàng có thể nhận: ${availableCount}`);
    console.log(`   - Đơn hàng COD đã sửa: ${codPendingOrders.length}`);
    console.log(`   - Đơn hàng có driver không hợp lệ: ${invalidDriverCount}\n`);

    console.log('✅ Hoàn thành!\n');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
fixOrders();
