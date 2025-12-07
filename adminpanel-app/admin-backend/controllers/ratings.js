const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST /ratings - Tạo rating cho tài xế
async function createRating(req, res) {
    const { orderId, rating, comment } = req.body;
    const userId = req.user?.id;

    try {
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        if (!orderId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Order ID và rating là bắt buộc',
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating phải từ 1 đến 5 sao',
            });
        }

        // Kiểm tra order có tồn tại không
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                driver: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Kiểm tra order có phải của user này không
        if (order.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể đánh giá đơn hàng của chính mình',
            });
        }

        // Kiểm tra order đã hoàn thành chưa
        if (order.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể đánh giá đơn hàng đã hoàn thành',
            });
        }

        // Kiểm tra order có driver không
        if (!order.driverId) {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này chưa có tài xế giao hàng',
            });
        }

        // Kiểm tra đã đánh giá chưa
        const existingRating = await prisma.rating.findUnique({
            where: { orderId },
        });

        if (existingRating) {
            // Cập nhật rating hiện có
            const updatedRating = await prisma.rating.update({
                where: { orderId },
                data: {
                    rating,
                    comment: comment || null,
                },
            });

            return res.json({
                success: true,
                data: updatedRating,
                message: 'Đánh giá đã được cập nhật',
            });
        }

        // Tạo rating mới
        const newRating = await prisma.rating.create({
            data: {
                orderId,
                userId,
                driverId: order.driverId,
                rating,
                comment: comment || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        logger.info(`Rating created for order ${orderId} by user ${userId}`);

        res.status(201).json({
            success: true,
            data: newRating,
            message: 'Đánh giá đã được ghi nhận',
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này đã được đánh giá',
            });
        }
        logger.error(`Error creating rating: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /ratings/order/:orderId - Lấy rating của một order
async function getRatingByOrder(req, res) {
    const { orderId } = req.params;
    const userId = req.user?.id;

    try {
        const rating = await prisma.rating.findUnique({
            where: { orderId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: 'Rating not found',
            });
        }

        // Kiểm tra quyền: chỉ user của order hoặc admin mới xem được
        if (userId && req.user?.role !== 'ADMIN') {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
            });
            if (order && order.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden',
                });
            }
        }

        res.json({
            success: true,
            data: rating,
        });
    } catch (error) {
        logger.error(`Error getting rating: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /ratings/driver/:driverId - Lấy tất cả ratings của một driver
async function getRatingsByDriver(req, res) {
    const { driverId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const [ratings, total] = await Promise.all([
            prisma.rating.findMany({
                where: { driverId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    order: {
                        select: {
                            id: true,
                            totalAmount: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: +skip,
                take: +limit,
            }),
            prisma.rating.count({
                where: { driverId },
            }),
        ]);

        // Tính điểm trung bình
        const avgRating = await prisma.rating.aggregate({
            where: { driverId },
            _avg: {
                rating: true,
            },
        });

        res.json({
            success: true,
            data: {
                ratings,
                pagination: {
                    page: +page,
                    limit: +limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
                averageRating: avgRating._avg.rating || 0,
            },
        });
    } catch (error) {
        logger.error(`Error getting driver ratings: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    createRating,
    getRatingByOrder,
    getRatingsByDriver,
};
