const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /carts - Lấy danh sách carts
async function getCarts(req, res) {
    const { page = 1, limit = 10, userId } = req.query;
    const skip = (page - 1) * limit;

    try {
        const where = {};
        
        // USER chỉ xem được carts của mình
        if (req.user && req.user.role === 'USER') {
            where.userId = req.user.id;
        } else if (userId) {
            // ADMIN có thể filter theo userId
            where.userId = userId;
        }

        const carts = await prisma.cart.findMany({
            where,
            skip: +skip,
            take: +limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { id: 'desc' },
        });

        const total = await prisma.cart.count({ where });

        res.json({
            success: true,
            data: carts,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            message: 'Carts fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting carts: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /carts/:id - Lấy thông tin chi tiết cart
async function getCart(req, res) {
    const { id } = req.params;

    try {
        const cart = await prisma.cart.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }

        res.json({
            success: true,
            data: cart,
            message: 'Cart fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting cart: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /carts/user/:userId - Lấy cart của user
async function getUserCart(req, res) {
    const { userId } = req.params;

    try {
        // Kiểm tra quyền: USER chỉ xem được cart của mình
        const targetUserId = req.user && req.user.role === 'USER' ? req.user.id : userId;

        const cart = await prisma.cart.findFirst({
            where: { userId: targetUserId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!cart) {
            // Tạo cart mới nếu chưa có
            const newCart = await prisma.cart.create({
                data: {
                    userId: targetUserId,
                    items: [],
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            return res.json({
                success: true,
                data: newCart,
                message: 'Cart created and fetched successfully',
            });
        }

        res.json({
            success: true,
            data: cart,
            message: 'Cart fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting user cart: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /carts - Tạo cart mới
async function createCart(req, res) {
    const { userId, items } = req.body;

    try {
        // USER chỉ tạo cart cho chính mình
        const targetUserId = req.user && req.user.role === 'USER' ? req.user.id : userId;

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        // Kiểm tra user đã có cart chưa
        const existingCart = await prisma.cart.findFirst({
            where: { userId: targetUserId },
        });

        if (existingCart) {
            return res.status(400).json({
                success: false,
                message: 'User already has a cart',
            });
        }

        const cart = await prisma.cart.create({
            data: {
                userId: targetUserId,
                items: items || [],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: cart,
            message: 'Cart created successfully',
        });
    } catch (error) {
        logger.error(`Error creating cart: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /carts/:id - Cập nhật cart
async function updateCart(req, res) {
    const { id } = req.params;
    const { items } = req.body;

    try {
        // Kiểm tra cart có tồn tại và quyền
        const currentCart = await prisma.cart.findUnique({
            where: { id },
        });

        if (!currentCart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }

        // USER chỉ cập nhật được cart của mình
        if (req.user && req.user.role === 'USER' && currentCart.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only update your own cart.',
            });
        }

        const cart = await prisma.cart.update({
            where: { id },
            data: {
                items: items || [],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: cart,
            message: 'Cart updated successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }
        logger.error(`Error updating cart: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// DELETE /carts/:id - Xóa cart
async function deleteCart(req, res) {
    const { id } = req.params;

    try {
        // Kiểm tra cart có tồn tại và quyền
        const cart = await prisma.cart.findUnique({
            where: { id },
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }

        // USER chỉ xóa được cart của mình
        if (req.user && req.user.role === 'USER' && cart.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only delete your own cart.',
            });
        }

        await prisma.cart.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Cart deleted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }
        logger.error(`Error deleting cart: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    getCarts,
    getCart,
    getUserCart,
    createCart,
    updateCart,
    deleteCart,
};

