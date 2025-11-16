const express = require('express');
const validate = require('../middlesware/validation');
const z = require('zod');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/products');

const router = express.Router();

const productSchema = z.object({
    categoryId: z.string(),
    name: z.string().min(1),
    price: z.number().positive(),
    imageUrl: z.string().optional(),
    description: z.string().optional
});

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    imageUrl: z.string().optional(),
    description: z.string().optional()
}); 

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', validate(productSchema), createProduct);
router.put('/:id', validate(updateProductSchema), updateProduct); 
router.delete('/:id', deleteProduct);

module.exports = router;
