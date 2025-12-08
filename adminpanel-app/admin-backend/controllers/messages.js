const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');
const socketService = require('../services/socketService');
const { normalizePhone } = require('../utils/phoneUtils');

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
        // DRIVER có thể xem messages của orders được gán cho mình hoặc orders chưa có driver (để nhận đơn)
        if (req.user) {
            if (req.user.role === 'USER' && order.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only view messages of your own orders.',
                });
            }

            if (req.user.role === 'DRIVER') {
                // DRIVER có thể xem messages nếu:
                // 1. Order đã được gán cho họ (order.driverId === driver.id)
                // 2. Order chưa có driver (order.driverId == null) - để xem trước khi nhận đơn
                const hasNoDriver = order.driverId == null;
                
                // Tìm driver từ user để so sánh với order.driverId
                let driver = null;
                const fullUser = await prisma.user.findUnique({
                    where: { id: req.user.id },
                    select: { id: true, phone: true, name: true },
                });
                
                if (fullUser) {
                    // Tìm driver bằng phone
                    if (fullUser.phone) {
                        const normalizedPhone = normalizePhone(fullUser.phone);
                        if (normalizedPhone) {
                            driver = await prisma.driver.findUnique({
                                where: { phone: normalizedPhone },
                                select: { id: true },
                            });
                            
                            if (!driver && fullUser.phone !== normalizedPhone) {
                                driver = await prisma.driver.findUnique({
                                    where: { phone: fullUser.phone },
                                    select: { id: true },
                                });
                            }
                        }
                    }
                    
                    // Nếu không tìm thấy bằng phone, thử tìm bằng name
                    if (!driver && fullUser.name) {
                        driver = await prisma.driver.findFirst({
                            where: { name: fullUser.name },
                            select: { id: true },
                        });
                    }
                }
                
                const isAssignedToMe = driver && order.driverId === driver.id;
                
                if (!isAssignedToMe && !hasNoDriver) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden. You can only view messages of orders assigned to you or available orders.',
                    });
                }
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

            if (req.user.role === 'DRIVER') {
                // Tìm driver từ user để so sánh với order.driverId
                let driver = null;
                const fullUser = await prisma.user.findUnique({
                    where: { id: req.user.id },
                    select: { id: true, phone: true, name: true },
                });
                
                if (fullUser) {
                    // Tìm driver bằng phone
                    if (fullUser.phone) {
                        const normalizedPhone = normalizePhone(fullUser.phone);
                        if (normalizedPhone) {
                            driver = await prisma.driver.findUnique({
                                where: { phone: normalizedPhone },
                                select: { id: true },
                            });
                            
                            if (!driver && fullUser.phone !== normalizedPhone) {
                                driver = await prisma.driver.findUnique({
                                    where: { phone: fullUser.phone },
                                    select: { id: true },
                                });
                            }
                        }
                    }
                    
                    // Nếu không tìm thấy bằng phone, thử tìm bằng name
                    if (!driver && fullUser.name) {
                        driver = await prisma.driver.findFirst({
                            where: { name: fullUser.name },
                            select: { id: true },
                        });
                    }
                }
                
                const isAssignedToMe = driver && message.order.driverId === driver.id;
                
                if (!isAssignedToMe) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden. You can only view messages of orders assigned to you.',
                    });
                }
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
            const isAdmin = req.user.role === 'ADMIN';
            
            let isDriver = false;
            if (req.user.role === 'DRIVER') {
                // Tìm driver từ user để so sánh với order.driverId
                const fullUser = await prisma.user.findUnique({
                    where: { id: req.user.id },
                    select: { id: true, phone: true, name: true },
                });
                
                if (fullUser) {
                    let driver = null;
                    
                    // Tìm driver bằng phone
                    if (fullUser.phone) {
                        const normalizedPhone = normalizePhone(fullUser.phone);
                        if (normalizedPhone) {
                            driver = await prisma.driver.findUnique({
                                where: { phone: normalizedPhone },
                                select: { id: true },
                            });
                            
                            if (!driver && fullUser.phone !== normalizedPhone) {
                                driver = await prisma.driver.findUnique({
                                    where: { phone: fullUser.phone },
                                    select: { id: true },
                                });
                            }
                        }
                    }
                    
                    // Nếu không tìm thấy bằng phone, thử tìm bằng name
                    if (!driver && fullUser.name) {
                        driver = await prisma.driver.findFirst({
                            where: { name: fullUser.name },
                            select: { id: true },
                        });
                    }
                    
                    isDriver = driver && order.driverId === driver.id;
                }
            }

            if (!isOwner && !isDriver && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only send messages to your own orders or orders assigned to you.',
                });
            }
        }

        // Kiểm tra order phải có driver trước khi cho phép chat
        // (USER chỉ chat được khi đã có driver nhận đơn)
        if (req.user && req.user.role === 'USER' && !order.driverId) {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng chưa có tài xế nhận. Vui lòng chờ tài xế nhận đơn hàng.',
            });
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

        // Emit socket event để notify recipient
        const recipientId = req.user.id === order.userId ? order.driverId : order.userId;
        if (recipientId) {
            socketService.emitNewMessage(orderId, message, recipientId);
        }

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

