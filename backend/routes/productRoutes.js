const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const {
  createProductValidator,
  updateProductValidator,
} = require('../validators/productValidator');
const validate = require('../middleware/validateMiddleware');
const { uploadProductImages } = require('../middleware/uploadMiddleware');
const protect = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/roleMiddleware');

// Public routes (with optionalAuth so admins can inspect inactive items)
router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProductById);

// Admin-only management routes
router.post(
  '/',
  protect,
  isAdmin,
  uploadProductImages,
  createProductValidator,
  validate,
  createProduct
);

router.put(
  '/:id',
  protect,
  isAdmin,
  uploadProductImages,
  updateProductValidator,
  validate,
  updateProduct
);

router.delete('/:id', protect, isAdmin, deleteProduct);

module.exports = router;
