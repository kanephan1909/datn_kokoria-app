const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// GET /users - Lấy danh sách users với pagination
async function getUsers(req, res) {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    try {
        const where = {};
        
        // USER chỉ xem được thông tin của mình
        if (req.user && req.user.role === 'USER') {
            where.id = req.user.id;
        }
        
        if (role) {
            where.role = role;
        }
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const users = await prisma.user.findMany({
            where,
            skip: +skip,
            take: +limit,
            include: {
                orders: true,
                addresses: true,
                carts: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Loại bỏ password khỏi response
        const usersWithoutPassword = users.map(({ password, ...user }) => user);

        const total = await prisma.user.count({ where });

        res.json({
            success: true,
            data: usersWithoutPassword,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            message: 'Users fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting users: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /users/:id - Lấy thông tin chi tiết user
async function getUser(req, res) {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                addresses: true,
                carts: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Kiểm tra quyền: USER chỉ xem được thông tin của mình
        if (req.user && req.user.role === 'USER' && user.id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only view your own information.',
            });
        }

        // Loại bỏ password khỏi response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: userWithoutPassword,
            message: 'User fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting user: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /users - Tạo user mới
async function createUser(req, res) {
    const { name, email, password, phone, role } = req.body;

    try {
        // Kiểm tra email đã tồn tại chưa
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists',
            });
        }

        // Hash password nếu có
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: role || 'USER',
            },
        });

        // Loại bỏ password khỏi response
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            success: true,
            data: userWithoutPassword,
            message: 'User created successfully',
        });
    } catch (error) {
        logger.error(`Error creating user: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /users/:id - Cập nhật user
async function updateUser(req, res) {
    const { id } = req.params;
    const { name, email, phone, role, deviceToken, password } = req.body;

    try {
        // Kiểm tra quyền: USER chỉ cập nhật được thông tin của mình
        if (req.user && req.user.role === 'USER' && id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only update your own information.',
            });
        }

        // USER không được thay đổi role
        const updateData = {
            ...(name && { name }),
            ...(email && { email }),
            ...(phone && { phone }),
            ...(deviceToken !== undefined && { deviceToken }),
        };

        // Chỉ ADMIN mới được thay đổi role
        if (req.user && req.user.role === 'ADMIN' && role) {
            updateData.role = role;
        }

        // Hash password nếu có
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        // Loại bỏ password khỏi response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: userWithoutPassword,
            message: 'User updated successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        logger.error(`Error updating user: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// DELETE /users/:id - Xóa user
async function deleteUser(req, res) {
    const { id } = req.params;

    try {
        // Xóa các bản ghi liên quan trước
        await prisma.address.deleteMany({ where: { userId: id } });
        await prisma.cart.deleteMany({ where: { userId: id } });
        // Note: Orders có thể giữ lại để lưu lịch sử, hoặc xóa tùy business logic

        await prisma.user.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        logger.error(`Error deleting user: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
};

