const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /messages/order/:orderId - Lấy danh sách messages của một order
async function getOrderMessages(req, res) {
    const { orderId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    try {
        // Kiểm tra order có tồn tại không
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                driverId: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Kiểm tra quyền: USER chỉ xem messages của orders của mình
        // DRIVER chỉ xem messages của orders được gán cho mình
        if (req.user) {
            if (req.user.role === 'USER' && order.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only view messages of your own orders.',
                });
            }

            if (req.user.role === 'DRIVER' && order.driverId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only view messages of orders assigned to you.',
                });
            }
        }

        const messages = await prisma.message.findMany({
            where: { orderId },
            skip: +skip,
            take: +limit,
            orderBy: { createdAt: 'asc' },
        });

        const total = await prisma.message.count({ where: { orderId } });

        res.json({
            success: true,
            data: messages,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            message: 'Messages fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting order messages: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /messages/:id - Lấy thông tin chi tiết message
async function getMessage(req, res) {
    const { id } = req.params;

    try {
        const message = await prisma.message.findUnique({
            where: { id },
            include: {
                order: {
                    select: {
                        id: true,
                        userId: true,
                        driverId: true,
                    },
                },
            },
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }

        // Kiểm tra quyền
        if (req.user) {
            if (req.user.role === 'USER' && message.order.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only view messages of your own orders.',
                });
            }

            if (req.user.role === 'DRIVER' && message.order.driverId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only view messages of orders assigned to you.',
                });
            }
        }

        res.json({
            success: true,
            data: message,
            message: 'Message fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting message: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /messages - Tạo message mới
async function createMessage(req, res) {
    const { orderId, text } = req.body;

    try {
        // Kiểm tra order có tồn tại không
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                driverId: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Kiểm tra quyền: Chỉ USER (owner) hoặc DRIVER (assigned) mới gửi được message
        if (req.user) {
            const isOwner = req.user.role === 'USER' && order.userId === req.user.id;
            const isDriver = req.user.role === 'DRIVER' && order.driverId === req.user.id;
            const isAdmin = req.user.role === 'ADMIN';

            if (!isOwner && !isDriver && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only send messages to your own orders or orders assigned to you.',
                });
            }
        }

        const message = await prisma.message.create({
            data: {
                orderId,
                senderId: req.user.id,
                text,
            },
            include: {
                order: {
                    select: {
                        id: true,
                        userId: true,
                        driverId: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: message,
            message: 'Message sent successfully',
        });
    } catch (error) {
        logger.error(`Error creating message: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// DELETE /messages/:id - Xóa message
async function deleteMessage(req, res) {
    const { id } = req.params;

    try {
        const message = await prisma.message.findUnique({
            where: { id },
            include: {
                order: {
                    select: {
                        id: true,
                        userId: true,
                        driverId: true,
                    },
                },
            },
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }

        // Kiểm tra quyền: Chỉ người gửi hoặc ADMIN mới xóa được
        if (req.user) {
            const isSender = message.senderId === req.user.id;
            const isAdmin = req.user.role === 'ADMIN';

            if (!isSender && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only delete your own messages.',
                });
            }
        }

        await prisma.message.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Message deleted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }
        logger.error(`Error deleting message: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    getOrderMessages,
    getMessage,
    createMessage,
    deleteMessage,
};

