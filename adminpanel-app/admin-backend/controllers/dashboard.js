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

module.exports = {
    getDashboardStats,
};

