const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Ví dụ URL gọi API:
// http://localhost:3000/api/v1/categories?page=2&limit=20
// req.query -> { page: '2', limit: '20' }

async function getCategories(req, res) {
    // Lấy page và limit từ query params (mặc định: page=1, limit=10)
    const { page = 1, limit = 10 } = req.query;

    // Tính số bản ghi cần bỏ qua để phân trang
    const skip = (page - 1) * limit;

    try {
        // Lấy danh sách category, kèm products liên quan
        const categories = await prisma?.category.findMany({
            include: { products: true }, // Load quan hệ category → products
            skip: +skip, // convert từ string sang number
            take: +limit,
        });

        res.json({
            success: true,
            data: categories,
            message: 'Categories fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting categories: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

async function getCategory(req, res) {
    const { id } = req.params;

    try {
        const category = await prisma.category.findUnique({
            where: { id },
            include: { products: true },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            data: category,
            message: 'Category fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting category: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

async function getProductsByCategory(req, res) {
    const { id } = req.params; // Lấy id category từ URL
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    try {
        // Lấy danh sách sản phẩm theo categoryId
        const products = await prisma.product.findMany({
            where: { categoryId: id },
            skip: +skip,
            take: +limit,
        });

        res.json({
            success: true,
            data: products,
            message: 'Products fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting products by category: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

async function createCategory(req, res) {
    const { name, imageUrl, isActive } = req.body;

    try {
        // Tạo category mới
        const category = await prisma.category.create({
            data: { 
                name, 
                imageUrl,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        res.json({
            success: true,
            data: category,
            message: 'Category created successfully',
        });
    } catch (error) {
        logger.error(`Error creating category: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

async function updateCategory(req, res) {
    const { id } = req.params; // ID category cần update
    const { name, imageUrl, isActive } = req.body;

    try {
        // Cập nhật category theo id
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (isActive !== undefined) updateData.isActive = isActive;

        const category = await prisma.category.update({
            where: { id },
            data: updateData,
        });

        res.json({
            success: true,
            data: category,
            message: 'Category updated successfully',
        });
    } catch (error) {
        logger.error(`Error updating category: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

async function deleteCategory(req, res) {
    const { id } = req.params;

    try {
        // Xóa toàn bộ sản phẩm thuộc category này trước
        await prisma.product.deleteMany({
            where: { categoryId: id },
        });

        // Sau đó xóa category
        await prisma.category.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        logger.error(`Error deleting category: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// Export các controller để sử dụng trong router
module.exports = {
    getCategories,
    getCategory,
    getProductsByCategory,
    createCategory,
    updateCategory,
    deleteCategory,
};