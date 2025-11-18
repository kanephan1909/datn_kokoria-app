const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /drivers - Lấy danh sách drivers
async function getDrivers(req, res) {
    const { page = 1, limit = 10, isOnline } = req.query;
    const skip = (page - 1) * limit;

    try {
        const where = {};
        
        // Note: DRIVER có thể login bằng User account với role DRIVER
        // Để map driver với user, cần thêm userId vào Driver model hoặc dùng phone/email để match
        // Tạm thời: ADMIN xem tất cả, DRIVER có thể được filter sau nếu cần
        
        if (isOnline !== undefined) {
            where.isOnline = isOnline === 'true';
        }

        const drivers = await prisma.driver.findMany({
            where,
            skip: +skip,
            take: +limit,
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                locations: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.driver.count({ where });

        res.json({
            success: true,
            data: drivers,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            message: 'Drivers fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting drivers: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /drivers/:id - Lấy thông tin chi tiết driver
async function getDriver(req, res) {
    const { id } = req.params;

    try {
        const driver = await prisma.driver.findUnique({
            where: { id },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                },
                locations: {
                    orderBy: { timestamp: 'desc' },
                    take: 50,
                },
            },
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        res.json({
            success: true,
            data: driver,
            message: 'Driver fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting driver: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /drivers - Tạo driver mới
async function createDriver(req, res) {
    const { name, phone, avatar, isOnline, deviceToken } = req.body;

    try {
        // Kiểm tra phone đã tồn tại chưa
        const existingDriver = await prisma.driver.findUnique({
            where: { phone },
        });

        if (existingDriver) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already exists',
            });
        }

        const driver = await prisma.driver.create({
            data: {
                name,
                phone,
                avatar,
                isOnline: isOnline !== undefined ? isOnline : false,
                deviceToken,
            },
        });

        res.status(201).json({
            success: true,
            data: driver,
            message: 'Driver created successfully',
        });
    } catch (error) {
        logger.error(`Error creating driver: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /drivers/:id - Cập nhật driver
async function updateDriver(req, res) {
    const { id } = req.params;
    const { name, phone, avatar, isOnline, deviceToken, currentLat, currentLng } = req.body;

    try {
        // Kiểm tra driver có tồn tại không
        const currentDriver = await prisma.driver.findUnique({
            where: { id },
        });

        if (!currentDriver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        // DRIVER chỉ cập nhật được thông tin của mình
        // Note: Cần map driver với user để kiểm tra quyền
        // Tạm thời: ADMIN có thể cập nhật bất kỳ driver nào

        const driver = await prisma.driver.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(avatar !== undefined && { avatar }),
                ...(isOnline !== undefined && { isOnline }),
                ...(deviceToken !== undefined && { deviceToken }),
                ...(currentLat !== undefined && { currentLat }),
                ...(currentLng !== undefined && { currentLng }),
            },
        });

        res.json({
            success: true,
            data: driver,
            message: 'Driver updated successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }
        logger.error(`Error updating driver: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// DELETE /drivers/:id - Xóa driver
async function deleteDriver(req, res) {
    const { id } = req.params;

    try {
        // Xóa locations trước
        await prisma.driverLocation.deleteMany({ where: { driverId: id } });
        
        // Xóa driver
        await prisma.driver.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Driver deleted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }
        logger.error(`Error deleting driver: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /drivers/:id/location - Cập nhật vị trí driver
async function updateDriverLocation(req, res) {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    try {
        // Kiểm tra driver có tồn tại không
        const driver = await prisma.driver.findUnique({
            where: { id },
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        // DRIVER chỉ cập nhật được vị trí của mình
        // Note: Cần map driver với user để kiểm tra quyền

        // Cập nhật vị trí hiện tại trong bảng Driver
        await prisma.driver.update({
            where: { id },
            data: {
                currentLat: latitude,
                currentLng: longitude,
            },
        });

        // Lưu vào lịch sử vị trí
        await prisma.driverLocation.create({
            data: {
                driverId: id,
                latitude,
                longitude,
            },
        });

        res.json({
            success: true,
            message: 'Driver location updated successfully',
        });
    } catch (error) {
        logger.error(`Error updating driver location: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    getDrivers,
    getDriver,
    createDriver,
    updateDriver,
    deleteDriver,
    updateDriverLocation,
};

