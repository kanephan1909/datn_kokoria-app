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
    const { categoryId, name, price, imageUrl, description, stock, isActive, variants } = req.body;

    try {
        // Log để debug
        logger.info(`Creating product: ${name}, variants: ${JSON.stringify(variants)}`);

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

        // Chuẩn bị data, đảm bảo variants được xử lý đúng
        const productData = {
            categoryId,
            name,
            price,
            imageUrl: imageUrl || null,
            description: description || null,
            stock: stock !== undefined ? stock : 0,
            isActive: isActive !== undefined ? isActive : true,
        };

        // Chỉ thêm variants nếu có và là array/object hợp lệ
        if (variants && Array.isArray(variants) && variants.length > 0) {
            productData.variants = variants;
        } else if (variants && typeof variants === 'object' && Object.keys(variants).length > 0) {
            productData.variants = variants;
        } else {
            productData.variants = null;
        }

        logger.info(`Product data to save: ${JSON.stringify(productData)}`);

        const product = await prisma.product.create({
            data: productData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        logger.info(`Product created successfully: ${product.id}, variants saved: ${product.variants ? 'Yes' : 'No'}`);

        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully',
        });
    } catch (error) {
        logger.error(`Error creating product: ${error.message}`);
        logger.error(`Error stack: ${error.stack}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
}

// PUT /products/:id - Cập nhật product
async function updateProduct(req, res) {
    const { id } = req.params;
    const { categoryId, name, price, imageUrl, description, stock, isActive, variants } = req.body;

    try {
        // Debug: Log toàn bộ request body
        logger.info(`Updating product: ${id}`);
        logger.info(`Full request body: ${JSON.stringify(req.body, null, 2)}`);
        logger.info(`Variants from body: ${JSON.stringify(variants)}`);
        logger.info(`Variants type: ${typeof variants}, isArray: ${Array.isArray(variants)}`);

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

        // Chuẩn bị data để update
        const updateData = {};
        if (categoryId) updateData.categoryId = categoryId;
        if (name) updateData.name = name;
        if (price !== undefined) updateData.price = price;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (description !== undefined) updateData.description = description;
        if (stock !== undefined) updateData.stock = stock;
        if (isActive !== undefined) updateData.isActive = isActive;
        
        // Xử lý variants - Luôn cập nhật variants nếu có trong request
        if (variants !== undefined) {
            if (variants === null || variants === 'null' || variants === '') {
                // Nếu gửi null hoặc empty string, set null
                updateData.variants = null;
            } else if (Array.isArray(variants) && variants.length > 0) {
                // Nếu là array hợp lệ, lưu
                updateData.variants = variants;
            } else if (typeof variants === 'object' && variants !== null && Object.keys(variants).length > 0) {
                // Nếu là object hợp lệ, lưu
                updateData.variants = variants;
            } else if (Array.isArray(variants) && variants.length === 0) {
                // Nếu là empty array, set null
                updateData.variants = null;
            } else {
                // Trường hợp khác, set null
                updateData.variants = null;
            }
        } else {
            // Nếu không có variants trong request, không update field này (giữ nguyên giá trị cũ)
            // Không thêm vào updateData
        }

        logger.info(`Update data: ${JSON.stringify(updateData)}`);

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        logger.info(`Product updated successfully: ${product.id}, variants saved: ${product.variants ? 'Yes' : 'No'}`);

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
        logger.error(`Error updating product: ${error.message}`);
        logger.error(`Error stack: ${error.stack}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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
