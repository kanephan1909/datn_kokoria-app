require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log('🔍 Đang kiểm tra database...\n');

    // Đếm tổng số đơn hàng
    const totalOrders = await prisma.order.count();
    console.log(`📦 Tổng số đơn hàng: ${totalOrders}\n`);

    if (totalOrders === 0) {
      console.log('❌ Không có đơn hàng nào trong database!');
      return;
    }

    // Đếm đơn hàng theo trạng thái
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    console.log('📊 Đơn hàng theo trạng thái:');
    statusCounts.forEach((item) => {
      console.log(`   ${item.status}: ${item._count.status} đơn`);
    });
    console.log('');

    // Đếm đơn hàng có driver và chưa có driver
    // MongoDB có thể không có field driverId hoặc là null
    // Thử query tất cả đơn hàng và filter trong code
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        driverId: true,
      },
    });

    const ordersWithDriver = allOrders.filter((order) => order.driverId != null).length;
    const ordersWithoutDriver = allOrders.filter((order) => order.driverId == null).length;

    console.log('👤 Đơn hàng theo driver:');
    console.log(`   Có driver: ${ordersWithDriver} đơn`);
    console.log(`   Chưa có driver: ${ordersWithoutDriver} đơn\n`);

    // Đơn hàng shipper có thể thấy (PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP và chưa có driver)
    // Query tất cả đơn hàng ở trạng thái phù hợp rồi filter trong code
    const allAvailableStatusOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'],
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter trong code để lấy đơn hàng chưa có driver
    const availableOrders = allAvailableStatusOrders.filter((order) => order.driverId == null).slice(0, 10);

    console.log(`🚚 Đơn hàng shipper có thể thấy: ${availableOrders.length} đơn (từ ${allAvailableStatusOrders.length} đơn ở trạng thái phù hợp)\n`);

    if (availableOrders.length > 0) {
      console.log('📋 Chi tiết các đơn hàng:');
      availableOrders.forEach((order, index) => {
        console.log(`\n   ${index + 1}. Đơn #${order.id.slice(-8)}`);
        console.log(`      Trạng thái: ${order.status}`);
        console.log(`      Khách hàng: ${order.user?.name || 'N/A'}`);
        console.log(`      Tổng tiền: ${order.totalAmount.toLocaleString('vi-VN')} VND`);
        console.log(`      Ngày tạo: ${order.createdAt.toLocaleString('vi-VN')}`);
      });
    } else {
      console.log('⚠️  Không có đơn hàng nào shipper có thể thấy!');
      console.log('   Lý do có thể:');
      console.log('   - Tất cả đơn hàng đã được gán driver');
      console.log('   - Đơn hàng ở trạng thái khác (PICKED_UP, DELIVERING, COMPLETED, CANCELED)');
    }

    // Hiển thị 5 đơn hàng gần nhất
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        driver: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('\n\n📅 5 đơn hàng gần nhất:');
    recentOrders.forEach((order, index) => {
      console.log(`\n   ${index + 1}. Đơn #${order.id.slice(-8)}`);
      console.log(`      Trạng thái: ${order.status}`);
      console.log(`      Khách hàng: ${order.user?.name || 'N/A'}`);
      console.log(`      Driver: ${order.driver?.name || 'Chưa có'}`);
      console.log(`      Tổng tiền: ${order.totalAmount.toLocaleString('vi-VN')} VND`);
      console.log(`      Ngày tạo: ${order.createdAt.toLocaleString('vi-VN')}`);
    });
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
