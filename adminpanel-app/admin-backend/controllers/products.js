const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /products - Lấy danh sách products
async function getProducts(req, res) {
    const { categoryId, page = 1, limit = 10, isActive } = req.query;
    const skip = (page - 1) * limit;
    
    try {
        const where = {};
        
        if (categoryId) {
            where.categoryId = categoryId;
        }
        
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const products = await prisma.product.findMany({
            where,
            skip: +skip,
            take: +limit,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.product.count({ where });

        res.json({
            success: true,
            data: products,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            message: 'Products fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting products: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /products/:id - Lấy thông tin chi tiết product
async function getProduct(req, res) {
    const { id } = req.params;

    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
            },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        res.json({
            success: true,
            data: product,
            message: 'Product fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting product: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /products - Tạo product mới
async function createProduct(req, res) {
    const { categoryId, name, price, imageUrl, description, stock, isActive } = req.body;

    try {
        // Kiểm tra category có tồn tại không
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        const product = await prisma.product.create({
            data: {
                categoryId,
                name,
                price,
                imageUrl,
                description,
                stock: stock !== undefined ? stock : 0,
                isActive: isActive !== undefined ? isActive : true,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully',
        });
    } catch (error) {
        logger.error(`Error creating product: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// PUT /products/:id - Cập nhật product
async function updateProduct(req, res) {
    const { id } = req.params;
    const { categoryId, name, price, imageUrl, description, stock, isActive } = req.body;

    try {
        // Nếu có categoryId, kiểm tra category có tồn tại không
        if (categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found',
                });
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(categoryId && { categoryId }),
                ...(name && { name }),
                ...(price !== undefined && { price }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(description !== undefined && { description }),
                ...(stock !== undefined && { stock }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: product,
            message: 'Product updated successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }
        logger.error(`Error updating product: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// DELETE /products/:id - Xóa product
async function deleteProduct(req, res) {
    const { id } = req.params;

    try {
        await prisma.product.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }
        logger.error(`Error deleting product: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
};
