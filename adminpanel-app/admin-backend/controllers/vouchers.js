const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /vouchers - Lấy danh sách vouchers
async function getVouchers(req, res) {
    const { page = 1, limit = 10, expired } = req.query;
    const skip = (page - 1) * limit;

    try {
        const where = {};
        
        if (expired === 'true') {
            where.expiry = { lt: new Date() };
        } else if (expired === 'false') {
            where.expiry = { gte: new Date() };
        }

        const vouchers = await prisma.voucher.findMany({
            where,
            skip: +skip,
            take: +limit,
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.voucher.count({ where });

        res.json({
            success: true,
            data: vouchers,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            message: 'Vouchers fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting vouchers: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /vouchers/:id - Lấy thông tin chi tiết voucher
async function getVoucher(req, res) {
    const { id } = req.params;

    try {
        const voucher = await prisma.voucher.findUnique({
            where: { id },
        });

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found',
            });
        }

        res.json({
            success: true,
            data: voucher,
            message: 'Voucher fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting voucher: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /vouchers/code/:code - Lấy voucher theo code
async function getVoucherByCode(req, res) {
    const { code } = req.params;

    try {
        const voucher = await prisma.voucher.findUnique({
            where: { code },
        });

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found',
            });
        }

        res.json({
            success: true,
            data: voucher,
            message: 'Voucher fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting voucher by code: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /vouchers - Tạo voucher mới
async function createVoucher(req, res) {
    const { code, discount, minOrder, maxDeduct, expiry } = req.body;

    try {
        // Kiểm tra code đã tồn tại chưa
        const existingVoucher = await prisma.voucher.findUnique({
            where: { code },
        });

        if (existingVoucher) {
            return res.status(400).json({
                success: false,
                message: 'Voucher code already exists',
            });
        }

        const voucher = await prisma.voucher.create({
            data: {
                code,
                discount,
                minOrder,
                maxDeduct,
                expiry: new Date(expiry),
            },
        });

        res.status(201).json({
            success: true,
            data: voucher,
            message: 'Voucher created successfully',
        });
    } catch (error) {
        logger.error(`Error creating voucher: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /vouchers/:id - Cập nhật voucher
async function updateVoucher(req, res) {
    const { id } = req.params;
    const { code, discount, minOrder, maxDeduct, expiry } = req.body;

    try {
        // Nếu cập nhật code, kiểm tra code mới có trùng không
        if (code) {
            const existingVoucher = await prisma.voucher.findUnique({
                where: { code },
            });

            if (existingVoucher && existingVoucher.id !== id) {
                return res.status(400).json({
                    success: false,
                    message: 'Voucher code already exists',
                });
            }
        }

        const voucher = await prisma.voucher.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(discount !== undefined && { discount }),
                ...(minOrder !== undefined && { minOrder }),
                ...(maxDeduct !== undefined && { maxDeduct }),
                ...(expiry && { expiry: new Date(expiry) }),
            },
        });

        res.json({
            success: true,
            data: voucher,
            message: 'Voucher updated successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found',
            });
        }
        logger.error(`Error updating voucher: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// DELETE /vouchers/:id - Xóa voucher
async function deleteVoucher(req, res) {
    const { id } = req.params;

    try {
        await prisma.voucher.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Voucher deleted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found',
            });
        }
        logger.error(`Error deleting voucher: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    getVouchers,
    getVoucher,
    getVoucherByCode,
    createVoucher,
    updateVoucher,
    deleteVoucher,
};

