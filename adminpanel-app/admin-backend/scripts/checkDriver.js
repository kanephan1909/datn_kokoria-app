require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script để kiểm tra driver records
 * - Kiểm tra user có role DRIVER có driver record chưa
 * - Tạo driver record nếu thiếu
 */
async function checkDriver() {
  try {
    console.log('🔍 Đang kiểm tra driver records...\n');

    // Lấy tất cả user có role DRIVER
    const driverUsers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    console.log(`👤 Tìm thấy ${driverUsers.length} user có role DRIVER\n`);

    if (driverUsers.length === 0) {
      console.log('❌ Không có user nào có role DRIVER!');
      return;
    }

    let createdCount = 0;
    let existingCount = 0;
    let missingPhoneCount = 0;

    for (const user of driverUsers) {
      console.log(`\n📋 User: ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Phone: ${user.phone || 'Chưa có'}`);

      if (!user.phone) {
        console.log(`   ⚠️  User không có số điện thoại, không thể tạo driver record`);
        missingPhoneCount++;
        continue;
      }

      // Tìm driver record bằng phone
      let driver = await prisma.driver.findUnique({
        where: { phone: user.phone },
      });

      if (driver) {
        console.log(`   ✅ Đã có driver record: ${driver.id}`);
        existingCount++;
      } else {
        // Tạo driver record mới
        driver = await prisma.driver.create({
          data: {
            name: user.name,
            phone: user.phone,
            isOnline: false,
          },
        });
        console.log(`   ✅ Đã tạo driver record mới: ${driver.id}`);
        createdCount++;
      }
    }

    console.log('\n📊 Tổng kết:');
    console.log(`   - User có role DRIVER: ${driverUsers.length}`);
    console.log(`   - Driver record đã tồn tại: ${existingCount}`);
    console.log(`   - Driver record mới tạo: ${createdCount}`);
    console.log(`   - User thiếu số điện thoại: ${missingPhoneCount}\n`);

    console.log('✅ Hoàn thành!\n');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
checkDriver();
