const { PrismaClient } = require('@prisma/client');
const { success } = require('zod');

const prisma = new PrismaClient();

async function getProducts(req, res) {
    const {categoryId, page=1, limit=10} = req.query;
    const skip = (page - 1) * limit;
    const where = categoryId ? { categoryId } : {};
    const products = await prisma.product.findMany({
        where,
        skip: +skip,
        take: +limit,
    });
    res.json({
        success: true,
        data: products,
    }); 
}

async function getProduct(req, res) {
    const {id} = req.params;
    const product = await prisma.product.findUnique({ where:{id}});
    if(!product) {
        return res.status(404).json({
            success: false,
            message: 'Product is not found',
        });
    }
    res.json({
        success: true,
        data: product,
    });
}

async function createProduct(req, res) {
    const {id} = req.params;
    const {name ,price, imageUrl, description} = req.body;

    const product = await prisma.product.create({
        where: {id},
        data: {name, price, imageUrl, description}
    });
    res.json({
        success: true,
        data: product,
    });
}

async function updateProduct(req, res) {
    const {id} = req.params;
    const {name, price, imageUrl, description} = req.body;
    const product = await prisma.product.update({
        where: {id},
        data: {name, price, imageUrl, description}
    });
    res.json({
        success: true,
        data: product,
    });
}

async function createProduct(req, res) {
    const {categoryId, name, price, imageUrl, description} = req.body;
    const product = await prisma.product.create({
        data: {categoryId, name, price, imageUrl, description}
    });
}

async function deleteProduct(req, res) {
    const {id} = req.params;
    const product = await prisma.product.delete({
        where: {id}
    }); 
    res.json({
        message: 'Product deleted successfully',
    });
}

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    createProduct,
    deleteProduct,
};
