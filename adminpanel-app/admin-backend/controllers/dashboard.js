const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /dashboard/stats - Lấy thống kê tổng quan cho admin
async function getDashboardStats(req, res) {
    try {
        // Lấy các thống kê song song để tối ưu performance
        const [
            totalUsers,
            totalOrders,
            totalProducts,
            totalDrivers,
            totalRevenue,
            ordersByStatus,
            recentOrders,
        ] = await Promise.all([
            // Tổng số users
            prisma.user.count(),
            
            // Tổng số orders
            prisma.order.count(),
            
            // Tổng số products
            prisma.product.count(),
            
            // Tổng số drivers
            prisma.driver.count(),
            
            // Tổng doanh thu (từ orders đã completed và payment success)
            prisma.order.aggregate({
                where: {
                    status: 'COMPLETED',
                    paymentStatus: 'PAYMENT_SUCCESS',
                },
                _sum: {
                    totalAmount: true,
                },
            }),
            
            // Số lượng orders theo từng status
            prisma.order.groupBy({
                by: ['status'],
                _count: {
                    id: true,
                },
            }),
            
            // 10 orders gần nhất
            prisma.order.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    driver: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                },
            }),
        ]);

        // Tính doanh thu theo tháng (30 ngày gần nhất)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const revenueLast30Days = await prisma.order.aggregate({
            where: {
                status: 'COMPLETED',
                paymentStatus: 'PAYMENT_SUCCESS',
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            _sum: {
                totalAmount: true,
            },
        });

        // Tính doanh thu hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const revenueToday = await prisma.order.aggregate({
            where: {
                status: 'COMPLETED',
                paymentStatus: 'PAYMENT_SUCCESS',
                createdAt: {
                    gte: today,
                },
            },
            _sum: {
                totalAmount: true,
            },
        });

        // Đếm orders hôm nay
        const ordersToday = await prisma.order.count({
            where: {
                createdAt: {
                    gte: today,
                },
            },
        });

        // Đếm orders pending
        const pendingOrders = await prisma.order.count({
            where: {
                status: 'PENDING',
            },
        });

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalOrders,
                    totalProducts,
                    totalDrivers,
                    pendingOrders,
                    ordersToday,
                },
                revenue: {
                    total: totalRevenue._sum.totalAmount || 0,
                    last30Days: revenueLast30Days._sum.totalAmount || 0,
                    today: revenueToday._sum.totalAmount || 0,
                },
                ordersByStatus: ordersByStatus.reduce((acc, item) => {
                    acc[item.status] = item._count.id;
                    return acc;
                }, {}),
                recentOrders,
            },
            message: 'Dashboard stats fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting dashboard stats: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /dashboard/debug/orders - Debug endpoint để kiểm tra đơn hàng
async function debugOrders(req, res) {
    try {
        // Đếm tổng số đơn hàng
        const totalOrders = await prisma.order.count();

        // Đếm đơn hàng theo trạng thái
        const statusCounts = await prisma.order.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
        });

        // Đếm đơn hàng có driver và chưa có driver
        // MongoDB có thể lưu null hoặc undefined, kiểm tra cả hai
        const ordersWithDriver = await prisma.order.count({
            where: {
                AND: [
                    { driverId: { not: null } },
                    { driverId: { not: undefined } },
                ],
            },
        });

        const ordersWithoutDriver = await prisma.order.count({
            where: {
                OR: [
                    { driverId: null },
                    { driverId: undefined },
                ],
            },
        });

        // Đơn hàng shipper có thể thấy
        // MongoDB có thể lưu null hoặc undefined, kiểm tra cả hai
        const availableOrders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'],
                },
                OR: [
                    { driverId: null },
                    { driverId: undefined },
                ],
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
            take: 10,
        });

        // 5 đơn hàng gần nhất
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

        res.json({
            success: true,
            data: {
                totalOrders,
                statusCounts: statusCounts.map((item) => ({
                    status: item.status,
                    count: item._count.status,
                })),
                ordersWithDriver,
                ordersWithoutDriver,
                availableOrdersCount: availableOrders.length,
                availableOrders: availableOrders.map((order) => ({
                    id: order.id,
                    status: order.status,
                    customerName: order.user?.name,
                    totalAmount: order.totalAmount,
                    createdAt: order.createdAt,
                })),
                recentOrders: recentOrders.map((order) => ({
                    id: order.id,
                    status: order.status,
                    customerName: order.user?.name,
                    driverName: order.driver?.name || 'Chưa có',
                    totalAmount: order.totalAmount,
                    createdAt: order.createdAt,
                })),
            },
        });
    } catch (error) {
        logger.error(`Error in debugOrders: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
}

module.exports = {
    getDashboardStats,
    debugOrders,
};

