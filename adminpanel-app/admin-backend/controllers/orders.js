const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');
const socketService = require('../services/socketService');
const { normalizePhone, normalizePhoneOrFallback } = require('../utils/phoneUtils');

const prisma = new PrismaClient();

/**
 * Helper: Tạo hoặc cập nhật Payment record
 */
async function createOrUpdatePayment(orderId, paymentData) {
    // Tìm payment hiện tại của order
    const existingPayment = await prisma.payment.findFirst({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
    });

    if (existingPayment) {
        // Cập nhật payment hiện tại
        return await prisma.payment.update({
            where: { id: existingPayment.id },
            data: paymentData,
        });
    } else {
        // Tạo payment mới
        return await prisma.payment.create({
            data: {
                orderId,
                ...paymentData,
            },
        });
    }
}

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
                // Lấy thông tin đầy đủ của user từ database (vì req.user chỉ có id, email, role)
                const fullUser = await prisma.user.findUnique({
                    where: { id: req.user.id },
                    select: { id: true, phone: true, name: true, email: true, avatarUrl: true },
                });
                
                if (!fullUser) {
                    logger.error(`[getOrders] User not found: ${req.user.id}`);
                    return res.json({
                        success: true,
                        data: [],
                        pagination: {
                            page: +page,
                            limit: +limit,
                            total: 0,
                            totalPages: 0,
                        },
                        message: 'Orders fetched successfully',
                    });
                }
                
                let driver = null;
                
                // BƯỚC 1: Tìm driver bằng phone (ưu tiên nhất vì phone là unique)
                if (fullUser.phone) {
                    const normalizedPhone = normalizePhone(fullUser.phone);
                    if (normalizedPhone) {
                        driver = await prisma.driver.findUnique({
                            where: { phone: normalizedPhone },
                            select: { id: true, phone: true, name: true },
                        });
                        
                        // Nếu không tìm thấy, thử tìm bằng phone gốc (tương thích với records cũ)
                        if (!driver && fullUser.phone !== normalizedPhone) {
                            driver = await prisma.driver.findUnique({
                                where: { phone: fullUser.phone },
                                select: { id: true, phone: true, name: true },
                            });
                        }
                    }
                }
                
                // BƯỚC 2: Nếu không tìm thấy bằng phone, thử tìm bằng name (chính xác)
                if (!driver && fullUser.name) {
                    driver = await prisma.driver.findFirst({
                        where: { name: fullUser.name },
                        select: { id: true, phone: true, name: true },
                    });
                }
                
                // BƯỚC 3: Nếu vẫn không tìm thấy, tạo driver mới từ user info
                if (!driver) {
                    const driverName = fullUser.name || 'Driver';
                    
                    // Normalize phone trước khi tìm/tạo
                    const driverPhone = normalizePhoneOrFallback(fullUser.phone, fullUser.id);
                    
                    // Thử tìm lại bằng phone được normalize
                    driver = await prisma.driver.findUnique({
                        where: { phone: driverPhone },
                        select: { id: true, phone: true, name: true },
                    });
                    
                    // Nếu vẫn không tìm thấy, tạo mới
                    if (!driver) {
                        try {
                            driver = await prisma.driver.create({
                                data: {
                                    name: driverName,
                                    phone: driverPhone,
                                    avatar: fullUser.avatarUrl,
                                    isOnline: false,
                                },
                                select: { id: true, phone: true, name: true },
                            });
                        } catch (createError) {
                            // Nếu lỗi do duplicate phone, thử tìm lại
                            if (createError.code === 'P2002') {
                                driver = await prisma.driver.findUnique({
                                    where: { phone: driverPhone },
                                    select: { id: true, phone: true, name: true },
                                });
                            } else {
                                logger.error(`[getOrders] Error creating driver: ${createError.message}`);
                            }
                        }
                    }
                }
                
                if (driver) {
                    where.driverId = driver.id;
                } else {
                    // Nếu không tìm được driver, trả về mảng rỗng
                    logger.warn(`[getOrders] Could not find or create driver for user ${fullUser.id}, returning empty orders list`);
                    where.driverId = 'nonexistent'; // Sẽ được xử lý ở dưới để trả về mảng rỗng
                }
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

        // Nếu driverId là 'nonexistent', trả về mảng rỗng ngay
        if (where.driverId === 'nonexistent') {
            logger.info(`[getOrders] Driver not found, returning empty orders list`);
            return res.json({
                success: true,
                data: [],
                pagination: {
                    page: +page,
                    limit: +limit,
                    total: 0,
                    totalPages: 0,
                },
                message: 'Orders fetched successfully',
            });
        }

        // Query orders với where clause đã được set
        logger.info(`[getOrders] Querying orders with where: ${JSON.stringify(where)}`);
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
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 5, // Lấy 5 payment gần nhất
                },
                logs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.order.count({ where });
        logger.info(`[getOrders] Found ${orders.length} orders (total: ${total}) for user ${req.user?.id}`);

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
                payments: {
                    orderBy: { createdAt: 'desc' },
                },
                logs: {
                    orderBy: { createdAt: 'desc' },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
                rating: true, // Include rating để hiển thị đánh giá đã gửi
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
            
            // DRIVER có thể xem:
            // 1. Đơn hàng chưa có driver (để nhận đơn) - order.driverId == null
            // 2. Đơn hàng đã được gán cho họ - order.driverId === driver.id
            if (req.user.role === 'DRIVER') {
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
                
                if (!hasNoDriver && !isAssignedToMe) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden. You can only view available orders or orders assigned to you.',
                    });
                }
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

        // Map paymentMethod từ string sang enum
        const mappedPaymentMethod = paymentMethod === 'COD' ? 'COD' : 'ONLINE';

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
                paymentMethod: mappedPaymentMethod,
                status: 'PENDING',
                paymentStatus: 'PAYMENT_PENDING',
            },
        });

        // Tạo Payment record mặc định nếu cần
        if (mappedPaymentMethod === 'COD') {
            await prisma.payment.create({
                data: {
                    orderId: order.id,
                    provider: 'CASH',
                    method: 'COD',
                    status: 'PAYMENT_PENDING',
                    amount: totalAmount,
                    currency: 'VND',
                },
            });
        }

        // Tạo log đầu tiên
        await prisma.orderLog.create({
            data: {
                orderId: order.id,
                newStatus: 'PENDING',
                message: 'Order created',
            },
        });

        // Nếu là COD, tự động xác nhận thanh toán và chuyển sang CONFIRMED
        if (mappedPaymentMethod === 'COD') {
            const socketService = require('../services/socketService');
            
            const confirmedOrder = await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'PAYMENT_SUCCESS',
                    confirmedAt: new Date(),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            // Cập nhật payment record
            if (mappedPaymentMethod === 'COD') {
                await prisma.payment.updateMany({
                    where: { orderId: order.id },
                    data: {
                        status: 'PAYMENT_SUCCESS',
                    },
                });
            }

            // Tạo log
            await prisma.orderLog.create({
                data: {
                    orderId: order.id,
                    oldStatus: 'PENDING',
                    newStatus: 'CONFIRMED',
                    message: 'COD order - Payment confirmed automatically',
                },
            });

            // Emit socket event để thông báo cho shipper về đơn hàng mới
            logger.info(`Emitting order:new event for order ${order.id} (COD - CONFIRMED)`);
            socketService.emitToAll('order:new', {
                order: confirmedOrder,
                message: 'Có đơn hàng mới cần giao',
            });
            logger.info(`✅ Order:new event emitted for order ${order.id}`);

            // Emit cho customer để cập nhật trạng thái
            socketService.emitOrderStatusUpdate(
                confirmedOrder.userId,
                order.id,
                'CONFIRMED',
                'Đơn hàng COD đã được xác nhận! Đang chờ shipper nhận',
                confirmedOrder // Gửi kèm order data
            );

            res.status(201).json({
                success: true,
                data: confirmedOrder,
                message: 'Order created successfully (COD - Auto confirmed)',
            });
        } else {
            res.status(201).json({
                success: true,
                data: order,
                message: 'Order created successfully',
            });
        }
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
        if (req.user && req.user.role === 'DRIVER') {
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
            
            // Kiểm tra xem order có được gán cho driver này không
            const isAssignedToMe = driver && currentOrder.driverId === driver.id;
            
            if (!isAssignedToMe) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden. You can only update orders assigned to you.',
                });
            }
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

        // Tạo log
        await prisma.orderLog.create({
            data: {
                orderId: id,
                oldStatus: currentOrder.status,
                newStatus: status,
                message: message || `Order status changed to ${status}`,
            },
        });

        // Emit socket event để thông báo cho customer
        if (order.userId) {
            let statusMessage = message;
            if (!statusMessage) {
                switch (status) {
                    case 'PICKED_UP':
                        statusMessage = `Shipper ${order.driver?.name || 'tài xế'} đã nhận hàng và đang đến giao cho bạn`;
                        break;
                    case 'DELIVERING':
                        statusMessage = 'Shipper đang trên đường giao hàng đến bạn';
                        break;
                    case 'COMPLETED':
                        statusMessage = 'Đơn hàng đã được giao thành công! Vui lòng đánh giá tài xế';
                        break;
                    default:
                        statusMessage = `Trạng thái đơn hàng đã được cập nhật: ${status}`;
                }
            }
            // Gửi kèm order data để frontend có thể sử dụng
            socketService.emitOrderStatusUpdate(order.userId, id, status, statusMessage, order);
        }

        // Nếu order chuyển sang READY_FOR_PICKUP, emit cho tất cả drivers
        if (status === 'READY_FOR_PICKUP' && !order.driverId) {
            socketService.emitToAll('order:new', { order });
        }

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
        // Lấy order hiện tại để lấy totalAmount
        const currentOrder = await prisma.order.findUnique({
            where: { id },
        });

        if (!currentOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Cập nhật order
        const order = await prisma.order.update({
            where: { id },
            data: {
                ...(driverId && { driverId }),
                ...(note !== undefined && { note }),
                ...(paymentStatus && { paymentStatus }),
            },
        });

        // Nếu cập nhật paymentStatus, cập nhật Payment record tương ứng
        if (paymentStatus) {
            await createOrUpdatePayment(id, {
                status: paymentStatus,
                amount: currentOrder.totalAmount,
            });
        }

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
        // Query tất cả đơn hàng ở trạng thái phù hợp, sau đó filter trong code
        // Vì MongoDB có thể xử lý null khác nhau
        const allOrders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'],
                },
            },
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

        logger.info(`getAvailableOrders: Found ${allOrders.length} orders with status PENDING/CONFIRMED/PREPARING/READY_FOR_PICKUP`);

        // Filter trong code để lấy đơn hàng chưa có driver
        // Chỉ lấy đơn hàng đã thanh toán thành công (COD hoặc ONLINE đã thanh toán)
        const filteredOrders = allOrders.map((order) => {
            const reasons = [];
            
            // Phải chưa có driver
            if (order.driverId != null) {
                reasons.push(`has driver (${order.driverId})`);
            }
            
            // Nếu là COD, đã được xác nhận (status không phải PENDING)
            if (order.paymentMethod === 'COD') {
                if (order.status === 'PENDING') {
                    reasons.push(`COD still PENDING`);
                }
            }
            
            // Nếu là ONLINE, phải đã thanh toán thành công
            if (order.paymentMethod === 'ONLINE') {
                if (order.paymentStatus !== 'PAYMENT_SUCCESS') {
                    reasons.push(`ONLINE payment status: ${order.paymentStatus}`);
                }
            }
            
            // Mặc định: chỉ lấy đơn hàng đã thanh toán thành công
            if (!order.paymentMethod) {
                if (order.paymentStatus !== 'PAYMENT_SUCCESS') {
                    reasons.push(`no payment method, status: ${order.paymentStatus}`);
                }
            }
            
            return {
                order,
                isAvailable: reasons.length === 0,
                reasons,
            };
        });
        
        // Log chi tiết từng đơn hàng
        filteredOrders.forEach(({ order, isAvailable, reasons }) => {
            if (!isAvailable) {
                logger.info(`Order ${order.id} (${order.paymentMethod || 'N/A'}, ${order.status}, ${order.paymentStatus}) - NOT available: ${reasons.join(', ')}`);
            } else {
                logger.info(`Order ${order.id} (${order.paymentMethod || 'N/A'}, ${order.status}, ${order.paymentStatus}) - AVAILABLE`);
            }
        });
        
        const orders = filteredOrders
            .filter(({ isAvailable }) => isAvailable)
            .map(({ order }) => order)
            .slice(skip, skip + limit);

        // Đếm tổng số đơn hàng chưa có driver và đã thanh toán
        const total = filteredOrders.filter(({ isAvailable }) => isAvailable).length;

        logger.info(`Available orders query: Found ${allOrders.length} total orders, ${total} available orders (no driver + paid)`);

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
        // driverId có thể là:
        // 1. driver.id (nếu gửi trực tiếp driver ID)
        // 2. user.id (nếu gửi từ shipper app - user có role DRIVER)
        
        let driver = null;
        
        // Thử tìm trực tiếp trong bảng Driver trước
        driver = await prisma.driver.findUnique({
            where: { id: driverId },
        });
        
        // Nếu không tìm thấy, có thể driverId là userId (từ shipper app)
        if (!driver) {
            const user = await prisma.user.findUnique({
                where: { id: driverId },
            });
            
            if (user && user.role === 'DRIVER') {
                // Tìm driver bằng phone number từ user (ưu tiên)
                if (user.phone) {
                    const normalizedPhone = normalizePhone(user.phone);
                    if (normalizedPhone) {
                        driver = await prisma.driver.findUnique({
                            where: { phone: normalizedPhone },
                        });
                        // Nếu không tìm thấy, thử tìm bằng phone gốc (tương thích với records cũ)
                        if (!driver && user.phone !== normalizedPhone) {
                            driver = await prisma.driver.findUnique({
                                where: { phone: user.phone },
                            });
                        }
                    }
                }
                
                // Nếu không tìm thấy bằng phone, thử tìm bằng name
                if (!driver && user.name) {
                    driver = await prisma.driver.findFirst({
                        where: { name: user.name },
                    });
                }
                
                // Nếu vẫn không tìm thấy, tạo driver mới từ user info
                if (!driver) {
                    const driverPhone = normalizePhoneOrFallback(user.phone, user.id);
                    const driverName = user.name || 'Driver';
                    
                    try {
                        driver = await prisma.driver.create({
                            data: {
                                name: driverName,
                                phone: driverPhone,
                                avatar: user.avatarUrl,
                                isOnline: false,
                            },
                        });
                        logger.info(`[acceptOrder] Created driver record for user ${driverId}: driver.id=${driver.id}, driver.name="${driver.name}", driver.phone="${driver.phone}", user.name="${user.name}", user.email="${user.email}"`);
                    } catch (createError) {
                        // Nếu lỗi do duplicate phone, thử tìm lại
                        if (createError.code === 'P2002') {
                            driver = await prisma.driver.findUnique({
                                where: { phone: driverPhone },
                            });
                            if (driver) {
                                logger.info(`[acceptOrder] Found existing driver after duplicate error: ${driver.id}`);
                            }
                        } else {
                            logger.error(`[acceptOrder] Error creating driver: ${createError.message}`);
                        }
                    }
                } else {
                    logger.info(`[acceptOrder] Found existing driver for user ${driverId}: driver.id=${driver.id}, driver.name="${driver.name}", driver.phone="${driver.phone}"`);
                }
            }
        }

        if (!driver) {
            logger.error(`Driver not found for driverId: ${driverId}`);
            return res.status(404).json({
                success: false,
                message: 'Driver not found. Please ensure you have a driver account.',
            });
        }
        
        logger.info(`Driver found: ${driver.id} (name: ${driver.name}, phone: ${driver.phone})`);
        logger.info(`[acceptOrder] Will save driverId: ${driver.id} to order ${id}`);

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

        // Cho phép accept order ở trạng thái PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP
        if (!['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(currentOrder.status)) {
            logger.error(`Cannot accept order ${id}: Invalid status ${currentOrder.status}`);
            return res.status(400).json({
                success: false,
                message: `Cannot accept order with status: ${currentOrder.status}`,
            });
        }

        // Kiểm tra đơn hàng có địa chỉ hợp lệ không (tùy chọn - chỉ cảnh báo)
        if (!currentOrder.address || (typeof currentOrder.address === 'object' && !currentOrder.address.street && !currentOrder.address.locality)) {
            logger.warn(`Order ${id} has incomplete address: ${JSON.stringify(currentOrder.address)}`);
            // Không chặn, chỉ cảnh báo vì có thể vẫn giao được
        }

        // Sử dụng driver.id thay vì driverId từ request
        const actualDriverId = driver.id;
        
        logger.info(`Accepting order ${id} with driver ${actualDriverId} (request driverId: ${driverId})`);
        
        // Kiểm tra lại order trước khi update (có thể đã bị thay đổi)
        const orderBeforeUpdate = await prisma.order.findUnique({
            where: { id },
        });
        
        if (!orderBeforeUpdate) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        
        if (orderBeforeUpdate.driverId) {
            return res.status(400).json({
                success: false,
                message: 'Order already has a driver',
            });
        }
        
        let order;
        try {
            order = await prisma.order.update({
                where: { id },
                data: {
                    driverId: actualDriverId,
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
            logger.info(`✅ Successfully assigned driver ${actualDriverId} to order ${id}`);
            logger.info(`[acceptOrder] Order ${id} now has driverId: ${order.driverId}`);
        } catch (updateError) {
            logger.error(`❌ Error updating order ${id}: ${updateError.message}`);
            logger.error(`Update error details: ${JSON.stringify(updateError)}`);
            throw updateError;
        }

        // Tạo log
        await prisma.orderLog.create({
            data: {
                orderId: id,
                oldStatus: currentOrder.status,
                newStatus: currentOrder.status,
                message: `Order accepted by driver: ${driver.name}`,
            },
        });

        // Emit socket event để thông báo cho customer
        if (order.userId) {
            socketService.emitOrderStatusUpdate(
                order.userId,
                id,
                currentOrder.status,
                `Đơn hàng đã được shipper ${driver.name} nhận`,
                order // Gửi kèm order data
            );
        }

        // Emit cho tất cả drivers để remove order khỏi danh sách available
        socketService.emitToAll('order:accepted', { orderId: id, driverId });

        res.json({
            success: true,
            data: order,
            message: 'Order accepted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            logger.error(`Order ${id} not found in database`);
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        logger.error(`❌ Error accepting order ${id}: ${error.message}`);
        logger.error(`Error stack: ${error.stack}`);
        logger.error(`Error details: ${JSON.stringify(error)}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
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

