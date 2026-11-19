const express = require('express');
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const {
  createCategoryValidator,
  updateCategoryValidator,
} = require('../validators/categoryValidator');
const validate = require('../middleware/validateMiddleware');
const protect = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/roleMiddleware');

// Public routes (with optionalAuth to allow admins to see inactive categories)
router.get('/', optionalAuth, getCategories);
router.get('/:id', optionalAuth, getCategoryById);

// Admin-only management routes
router.post('/', protect, isAdmin, createCategoryValidator, validate, createCategory);
router.put('/:id', protect, isAdmin, updateCategoryValidator, validate, updateCategory);
router.delete('/:id', protect, isAdmin, deleteCategory);

module.exports = router;
