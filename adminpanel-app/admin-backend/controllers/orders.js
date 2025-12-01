const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /orders - Lấy danh sách orders
async function getOrders(req, res) {
    const { page = 1, limit = 10, status, paymentStatus, userId, driverId } = req.query;
    const skip = (page - 1) * limit;

    try {
        const where = {};
        
        // Kiểm tra quyền
        if (req.user) {
            if (req.user.role === 'USER') {
                // USER chỉ xem được orders của mình
                where.userId = req.user.id;
            } else if (req.user.role === 'DRIVER') {
                // DRIVER chỉ xem được orders được gán cho mình
                where.driverId = req.user.id;
            }
            // ADMIN xem tất cả (không filter)
        }
        
        if (status) {
            // Convert status to uppercase to match enum
            const statusUpper = status.toUpperCase();
            // Map common status values to enum values
            const statusMap = {
                'PENDING': 'PENDING',
                'CONFIRMED': 'CONFIRMED',
                'PREPARING': 'PREPARING',
                'READY': 'READY_FOR_PICKUP',
                'READY_FOR_PICKUP': 'READY_FOR_PICKUP',
                'PICKED_UP': 'PICKED_UP',
                'DELIVERING': 'DELIVERING',
                'COMPLETED': 'COMPLETED',
                'CANCELED': 'CANCELED',
                'CANCELLED': 'CANCELED',
            };
            
            const mappedStatus = statusMap[statusUpper];
            if (mappedStatus) {
                where.status = mappedStatus;
            } else {
                // If status doesn't match, try using it as-is (might be valid enum value)
                where.status = statusUpper;
            }
        }
        
        if (paymentStatus) {
            // Convert paymentStatus to uppercase to match enum
            const paymentStatusUpper = paymentStatus.toUpperCase();
            // Map common payment status values to enum values
            const paymentStatusMap = {
                'PAYMENT_PENDING': 'PAYMENT_PENDING',
                'PENDING': 'PAYMENT_PENDING',
                'PAYMENT_SUCCESS': 'PAYMENT_SUCCESS',
                'SUCCESS': 'PAYMENT_SUCCESS',
                'PAYMENT_FAILED': 'PAYMENT_FAILED',
                'FAILED': 'PAYMENT_FAILED',
                'PAYMENT_REFUNDED': 'PAYMENT_REFUNDED',
                'REFUNDED': 'PAYMENT_REFUNDED',
            };
            
            const mappedPaymentStatus = paymentStatusMap[paymentStatusUpper];
            if (mappedPaymentStatus) {
                where.paymentStatus = mappedPaymentStatus;
            } else {
                // If paymentStatus doesn't match, try using it as-is
                where.paymentStatus = paymentStatusUpper;
            }
        }
        
        // ADMIN có thể filter theo userId hoặc driverId
        if (req.user && req.user.role === 'ADMIN') {
            if (userId) {
                where.userId = userId;
            }
            
            if (driverId) {
                where.driverId = driverId;
            }
        }

        const orders = await prisma.order.findMany({
            where,
            skip: +skip,
            take: +limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                logs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.order.count({ where });

        // Populate product data cho items trong tất cả orders
        if (orders.length > 0) {
            // Lấy tất cả productIds từ tất cả orders
            const allProductIds = [];
            orders.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (item.productId && !allProductIds.includes(item.productId)) {
                            allProductIds.push(item.productId);
                        }
                    });
                }
            });

            if (allProductIds.length > 0) {
                // Fetch tất cả products một lần
                const products = await prisma.product.findMany({
                    where: {
                        id: { in: allProductIds }
                    },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        imageUrl: true,
                        description: true,
                    }
                });

                // Tạo map để lookup nhanh
                const productMap = {};
                products.forEach(product => {
                    productMap[product.id] = product;
                });

                // Map lại items với product data cho từng order
                orders.forEach(order => {
                    if (order.items && Array.isArray(order.items)) {
                        order.items = order.items.map(item => ({
                            ...item,
                            product: productMap[item.productId] || null,
                        }));
                    }
                });
            }
        }

        res.json({
            success: true,
            data: orders,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            message: 'Orders fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting orders: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /orders/:id - Lấy thông tin chi tiết order
async function getOrder(req, res) {
    const { id } = req.params;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: true,
                driver: true,
                logs: {
                    orderBy: { createdAt: 'desc' },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Kiểm tra quyền
        if (req.user) {
            if (req.user.role === 'USER' && order.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only view your own orders.',
                });
            }
            
            if (req.user.role === 'DRIVER' && order.driverId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only view orders assigned to you.',
                });
            }
        }

        // Populate product data cho items
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            const productIds = order.items
                .map(item => item.productId)
                .filter(id => id); // Lọc bỏ undefined/null

            if (productIds.length > 0) {
                const products = await prisma.product.findMany({
                    where: {
                        id: { in: productIds }
                    },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        imageUrl: true,
                        description: true,
                    }
                });

                // Tạo map để lookup nhanh
                const productMap = {};
                products.forEach(product => {
                    productMap[product.id] = product;
                });

                // Map lại items với product data
                order.items = order.items.map(item => ({
                    ...item,
                    product: productMap[item.productId] || null,
                }));
            }
        }

        res.json({
            success: true,
            data: order,
            message: 'Order fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting order: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /orders - Tạo order mới
async function createOrder(req, res) {
    const {
        userId,
        items,
        totalAmount,
        note,
        address,
        shippingDistance,
        shippingFee,
        restaurantLat,
        restaurantLng,
        paymentMethod,
    } = req.body;

    try {
        // USER chỉ tạo order cho chính mình
        const targetUserId = req.user && req.user.role === 'USER' ? req.user.id : userId;

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const order = await prisma.order.create({
            data: {
                userId: targetUserId,
                items,
                totalAmount,
                note,
                address,
                shippingDistance,
                shippingFee,
                restaurantLat,
                restaurantLng,
                paymentMethod: paymentMethod || 'ONLINE',
                status: 'PENDING',
                paymentStatus: 'PAYMENT_PENDING',
            },
        });

        // Tạo log đầu tiên
        await prisma.orderLog.create({
            data: {
                orderId: order.id,
                newStatus: 'PENDING',
                message: 'Order created',
            },
        });

        res.status(201).json({
            success: true,
            data: order,
            message: 'Order created successfully',
        });
    } catch (error) {
        logger.error(`Error creating order: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /orders/:id/status - Cập nhật trạng thái order
async function updateOrderStatus(req, res) {
    const { id } = req.params;
    const { status, message } = req.body;

    try {
        // Lấy order hiện tại để lấy oldStatus
        const currentOrder = await prisma.order.findUnique({
            where: { id },
        });

        if (!currentOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Kiểm tra quyền: DRIVER chỉ cập nhật được orders được gán cho mình
        if (req.user && req.user.role === 'DRIVER' && currentOrder.driverId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only update orders assigned to you.',
            });
        }

        // Cập nhật trạng thái và timestamp tương ứng
        const updateData = { status };
        const now = new Date();

        switch (status) {
            case 'CONFIRMED':
                updateData.confirmedAt = now;
                break;
            case 'PREPARING':
                updateData.preparedAt = now;
                break;
            case 'READY_FOR_PICKUP':
                updateData.readyAt = now;
                break;
            case 'PICKED_UP':
                updateData.pickedUpAt = now;
                break;
            case 'DELIVERING':
                updateData.deliveringAt = now;
                break;
            case 'COMPLETED':
                updateData.deliveredAt = now;
                break;
            case 'CANCELED':
                updateData.canceledAt = now;
                break;
        }

        const order = await prisma.order.update({
            where: { id },
            data: updateData,
        });

        // Tạo log
        await prisma.orderLog.create({
            data: {
                orderId: id,
                oldStatus: currentOrder.status,
                newStatus: status,
                message: message || `Order status changed to ${status}`,
            },
        });

        res.json({
            success: true,
            data: order,
            message: 'Order status updated successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        logger.error(`Error updating order status: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /orders/:id - Cập nhật order (general)
async function updateOrder(req, res) {
    const { id } = req.params;
    const { driverId, note, paymentStatus } = req.body;

    try {
        const order = await prisma.order.update({
            where: { id },
            data: {
                ...(driverId && { driverId }),
                ...(note !== undefined && { note }),
                ...(paymentStatus && { paymentStatus }),
            },
        });

        res.json({
            success: true,
            data: order,
            message: 'Order updated successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        logger.error(`Error updating order: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /orders/:id/confirm - Branch/Admin xác nhận order
async function confirmOrder(req, res) {
    const { id } = req.params;
    const { message } = req.body;

    try {
        const currentOrder = await prisma.order.findUnique({
            where: { id },
        });

        if (!currentOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (currentOrder.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Cannot confirm order with status: ${currentOrder.status}`,
            });
        }

        const order = await prisma.order.update({
            where: { id },
            data: {
                status: 'CONFIRMED',
                confirmedAt: new Date(),
            },
        });

        // Tạo log
        await prisma.orderLog.create({
            data: {
                orderId: id,
                oldStatus: 'PENDING',
                newStatus: 'CONFIRMED',
                message: message || 'Order confirmed by branch',
            },
        });

        res.json({
            success: true,
            data: order,
            message: 'Order confirmed successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        logger.error(`Error confirming order: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /orders/available - Lấy danh sách orders chưa có driver (cho Driver)
async function getAvailableOrders(req, res) {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'],
                },
                driverId: null, // Chưa có driver
            },
            skip: +skip,
            take: +limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' }, // Order cũ nhất trước
        });

        const total = await prisma.order.count({
            where: {
                status: {
                    in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'],
                },
                driverId: null,
            },
        });

        res.json({
            success: true,
            data: orders,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            message: 'Available orders fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting available orders: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /orders/:id/accept - Driver nhận order
async function acceptOrder(req, res) {
    const { id } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
        return res.status(400).json({
            success: false,
            message: 'Driver ID is required',
        });
    }

    try {
        // Kiểm tra driver có tồn tại không
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        // Kiểm tra order có tồn tại và có thể nhận không
        const currentOrder = await prisma.order.findUnique({
            where: { id },
        });

        if (!currentOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (currentOrder.driverId) {
            return res.status(400).json({
                success: false,
                message: 'Order already has a driver',
            });
        }

        if (!['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(currentOrder.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot accept order with status: ${currentOrder.status}`,
            });
        }

        const order = await prisma.order.update({
            where: { id },
            data: {
                driverId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
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
        });

        // Tạo log
        await prisma.orderLog.create({
            data: {
                orderId: id,
                oldStatus: currentOrder.status,
                newStatus: currentOrder.status,
                message: `Order accepted by driver: ${driver.name}`,
            },
        });

        res.json({
            success: true,
            data: order,
            message: 'Order accepted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        logger.error(`Error accepting order: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// DELETE /orders/:id - Xóa order
async function deleteOrder(req, res) {
    const { id } = req.params;

    try {
        // Xóa logs và messages trước
        await prisma.orderLog.deleteMany({ where: { orderId: id } });
        await prisma.message.deleteMany({ where: { orderId: id } });
        
        await prisma.order.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Order deleted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        logger.error(`Error deleting order: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    getOrders,
    getOrder,
    createOrder,
    confirmOrder,
    updateOrderStatus,
    updateOrder,
    getAvailableOrders,
    acceptOrder,
    deleteOrder,
};

