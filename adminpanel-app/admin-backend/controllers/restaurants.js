const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /restaurants - Lấy danh sách restaurants
async function getRestaurants(req, res) {
    const { page = 1, limit = 10, isOpen } = req.query;
    const skip = (page - 1) * limit;

    try {
        const where = {};
        
        if (isOpen !== undefined) {
            where.isOpen = isOpen === 'true';
        }

        const restaurants = await prisma.restaurant.findMany({
            where,
            skip: +skip,
            take: +limit,
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.restaurant.count({ where });

        res.json({
            success: true,
            data: restaurants,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            message: 'Restaurants fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting restaurants: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /restaurants/:id - Lấy thông tin chi tiết restaurant
async function getRestaurant(req, res) {
    const { id } = req.params;

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id },
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found',
            });
        }

        res.json({
            success: true,
            data: restaurant,
            message: 'Restaurant fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting restaurant: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /restaurants - Tạo restaurant mới
async function createRestaurant(req, res) {
    const { name, address, latitude, longitude, openTime, closeTime, isOpen } = req.body;

    try {
        const restaurant = await prisma.restaurant.create({
            data: {
                name,
                address,
                latitude,
                longitude,
                openTime,
                closeTime,
                isOpen: isOpen !== undefined ? isOpen : true,
            },
        });

        res.status(201).json({
            success: true,
            data: restaurant,
            message: 'Restaurant created successfully',
        });
    } catch (error) {
        logger.error(`Error creating restaurant: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /restaurants/:id - Cập nhật restaurant
async function updateRestaurant(req, res) {
    const { id } = req.params;
    const { name, address, latitude, longitude, openTime, closeTime, isOpen } = req.body;

    try {
        const restaurant = await prisma.restaurant.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(address && { address }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                ...(openTime !== undefined && { openTime }),
                ...(closeTime !== undefined && { closeTime }),
                ...(isOpen !== undefined && { isOpen }),
            },
        });

        res.json({
            success: true,
            data: restaurant,
            message: 'Restaurant updated successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found',
            });
        }
        logger.error(`Error updating restaurant: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// DELETE /restaurants/:id - Xóa restaurant
async function deleteRestaurant(req, res) {
    const { id } = req.params;

    try {
        await prisma.restaurant.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Restaurant deleted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found',
            });
        }
        logger.error(`Error deleting restaurant: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    getRestaurants,
    getRestaurant,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
};

