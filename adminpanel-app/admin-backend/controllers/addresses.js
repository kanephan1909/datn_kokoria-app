const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /addresses - Lấy danh sách addresses (có thể filter theo userId)
async function getAddresses(req, res) {
    const { page = 1, limit = 10, userId } = req.query;
    const skip = (page - 1) * limit;

    try {
        const where = {};
        
        // Nếu có userId trong query, filter theo userId
        // Nếu không có và user đã đăng nhập, chỉ lấy addresses của user đó
        if (userId) {
            where.userId = userId;
        } else if (req.user && req.user.role === 'USER') {
            // User chỉ xem được addresses của mình
            where.userId = req.user.id;
        }

        const addresses = await prisma.address.findMany({
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

        const total = await prisma.address.count({ where });

        res.json({
            success: true,
            data: addresses,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            message: 'Addresses fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting addresses: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /addresses/:id - Lấy thông tin chi tiết address
async function getAddress(req, res) {
    const { id } = req.params;

    try {
        const address = await prisma.address.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // Kiểm tra quyền: User chỉ xem được address của mình (trừ ADMIN)
        if (req.user && req.user.role === 'USER' && address.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only view your own addresses.',
            });
        }

        res.json({
            success: true,
            data: address,
            message: 'Address fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting address: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /addresses/user/:userId - Lấy danh sách addresses của user
async function getUserAddresses(req, res) {
    const { userId } = req.params;

    try {
        // Kiểm tra quyền: User chỉ xem được addresses của mình
        if (req.user && req.user.role === 'USER' && userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only view your own addresses.',
            });
        }

        const addresses = await prisma.address.findMany({
            where: { userId },
            orderBy: { id: 'desc' },
        });

        res.json({
            success: true,
            data: addresses,
            message: 'User addresses fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting user addresses: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /addresses - Tạo address mới
async function createAddress(req, res) {
    const {
        userId,
        // Format mới từ frontend (Việt Nam)
        name,
        phone,
        address: addressLine,
        ward,
        district,
        city,
        isDefault,
        // Format cũ (quốc tế)
        type,
        mobile,
        flatNo,
        street,
        landmark,
        buildingName,
        pincode,
        locality,
        latitude,
        longitude,
    } = req.body;

    try {
        // Nếu user đã đăng nhập và là USER, chỉ cho phép tạo address cho chính mình
        const targetUserId = req.user && req.user.role === 'USER' ? req.user.id : userId;

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        // Kiểm tra user có tồn tại không
        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Map từ format frontend sang format database
        // Frontend gửi "phone", database lưu "mobile" (do schema database dùng "mobile")
        const finalMobile = phone || mobile;
        const finalType = type || 'HOME'; // Mặc định là HOME nếu không có
        const finalStreet = street || addressLine || '';
        const finalLocality = locality || [ward, district, city].filter(Boolean).join(', ') || '';

        const address = await prisma.address.create({
            data: {
                userId: targetUserId,
                type: finalType,
                name,
                mobile: finalMobile,
                flatNo,
                street: finalStreet,
                landmark,
                buildingName,
                pincode,
                locality: finalLocality,
                latitude,
                longitude,
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
            data: address,
            message: 'Address created successfully',
        });
    } catch (error) {
        logger.error(`Error creating address: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /addresses/:id - Cập nhật address
async function updateAddress(req, res) {
    const { id } = req.params;
    const {
        type,
        name,
        mobile,
        flatNo,
        street,
        landmark,
        buildingName,
        pincode,
        locality,
        latitude,
        longitude,
    } = req.body;

    try {
        // Kiểm tra address có tồn tại không
        const currentAddress = await prisma.address.findUnique({
            where: { id },
        });

        if (!currentAddress) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // Kiểm tra quyền: User chỉ sửa được address của mình
        if (req.user && req.user.role === 'USER' && currentAddress.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only update your own addresses.',
            });
        }

        const address = await prisma.address.update({
            where: { id },
            data: {
                ...(type && { type }),
                ...(name && { name }),
                ...(mobile && { mobile }),
                ...(flatNo !== undefined && { flatNo }),
                ...(street !== undefined && { street }),
                ...(landmark !== undefined && { landmark }),
                ...(buildingName !== undefined && { buildingName }),
                ...(pincode !== undefined && { pincode }),
                ...(locality !== undefined && { locality }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
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
            data: address,
            message: 'Address updated successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }
        logger.error(`Error updating address: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// DELETE /addresses/:id - Xóa address
async function deleteAddress(req, res) {
    const { id } = req.params;

    try {
        // Kiểm tra address có tồn tại không
        const address = await prisma.address.findUnique({
            where: { id },
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // Kiểm tra quyền: User chỉ xóa được address của mình
        if (req.user && req.user.role === 'USER' && address.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only delete your own addresses.',
            });
        }

        await prisma.address.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Address deleted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }
        logger.error(`Error deleting address: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    getAddresses,
    getAddress,
    getUserAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
};

