const logger = require('../utils/logger');
const { PrismaClient, Prisma } = require('@prisma/client');

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

        // Parse variants từ JSON cho mỗi product
        const transformedProducts = products.map(product => {
            let variants = [];
            if (product.variants) {
                if (Array.isArray(product.variants)) {
                    variants = product.variants;
                } else if (typeof product.variants === 'string') {
                    try {
                        variants = JSON.parse(product.variants);
                        if (!Array.isArray(variants)) {
                            variants = [];
                        }
                    } catch (e) {
                        logger.error(`Error parsing variants JSON for product ${product.id}: ${e.message}`);
                        variants = [];
                    }
                } else if (typeof product.variants === 'object') {
                    variants = [product.variants];
                }
            }
            return {
                ...product,
                variants,
            };
        });

        res.json({
            success: true,
            data: transformedProducts,
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

        // Parse variants từ JSON
        let variants = [];
        if (product.variants) {
            if (Array.isArray(product.variants)) {
                variants = product.variants;
            } else if (typeof product.variants === 'string') {
                try {
                    variants = JSON.parse(product.variants);
                    if (!Array.isArray(variants)) {
                        variants = [];
                    }
                } catch (e) {
                    logger.error(`Error parsing variants JSON for product ${id}: ${e.message}`);
                    variants = [];
                }
            } else if (typeof product.variants === 'object') {
                variants = [product.variants];
            }
        }

        const transformedProduct = {
            ...product,
            variants,
        };

        res.json({
            success: true,
            data: transformedProduct,
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

        // Xử lý variants - lưu vào JSON field
        let variantsToSave = null;
        if (variants !== undefined) {
            if (Array.isArray(variants)) {
                if (variants.length > 0) {
                    // Có variants - lưu vào database
                    variantsToSave = variants;
                } else {
                    // Empty array - set null
                    variantsToSave = null;
                }
            } else if (variants === null || variants === '') {
                variantsToSave = null;
            } else {
                variantsToSave = variants;
            }
        }

        // Chuẩn bị data
        const productData = {
            categoryId,
            name,
            price,
            imageUrl: imageUrl || null,
            description: description || null,
            stock: stock !== undefined ? stock : 0,
            isActive: isActive !== undefined ? isActive : true,
            variants: variantsToSave,
        };

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

        // Parse variants từ JSON để trả về
        let parsedVariants = [];
        if (product.variants) {
            if (Array.isArray(product.variants)) {
                parsedVariants = product.variants;
            } else if (typeof product.variants === 'string') {
                try {
                    parsedVariants = JSON.parse(product.variants);
                    if (!Array.isArray(parsedVariants)) {
                        parsedVariants = [];
                    }
                } catch (e) {
                    logger.error(`Error parsing variants JSON: ${e.message}`);
                    parsedVariants = [];
                }
            } else if (typeof product.variants === 'object') {
                parsedVariants = [product.variants];
            }
        }

        const transformedProduct = {
            ...product,
            variants: parsedVariants,
        };

        res.status(201).json({
            success: true,
            data: transformedProduct,
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
        
        // Xử lý variants - lưu vào JSON field
        // QUAN TRỌNG: Luôn xử lý variants nếu có trong request (kể cả empty array)
        if (variants !== undefined) {
            if (Array.isArray(variants)) {
                if (variants.length > 0) {
                    // Có variants - lưu vào database dưới dạng JSON
                    // Với MongoDB, Prisma sẽ tự động convert array thành JSON
                    updateData.variants = variants;
                } else {
                    // Empty array - set null để xóa variants
                    updateData.variants = null;
                }
            } else if (variants === null || variants === '') {
                updateData.variants = null;
            } else {
                // Không phải array, null, hoặc empty string - lưu nguyên
                updateData.variants = variants;
            }
        }

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

        // Parse variants từ JSON để trả về
        let parsedVariants = [];
        if (product.variants) {
            if (Array.isArray(product.variants)) {
                parsedVariants = product.variants;
            } else if (typeof product.variants === 'string') {
                try {
                    parsedVariants = JSON.parse(product.variants);
                    if (!Array.isArray(parsedVariants)) {
                        parsedVariants = [];
                    }
                } catch (e) {
                    logger.error(`Error parsing variants JSON: ${e.message}`);
                    parsedVariants = [];
                }
            } else if (typeof product.variants === 'object') {
                parsedVariants = [product.variants];
            }
        }

        const transformedProduct = {
            ...product,
            variants: parsedVariants,
        };

        res.json({
            success: true,
            data: transformedProduct,
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
