const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getSalesAnalytics,
  getTopProducts,
  getTopCategories,
} = require('../controllers/dashboardController');
const {
  salesAnalyticsValidator,
  topEntitiesValidator,
} = require('../validators/reportValidator');
const validate = require('../middleware/validateMiddleware');
const protect = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/roleMiddleware');

// All dashboard routes are restricted to authenticated Admins
router.use(protect, isAdmin);

// High-level dashboard statistics
router.get('/stats', getDashboardStats);

// Sales analytics grouped by daily, weekly, monthly, yearly
router.get('/sales', salesAnalyticsValidator, validate, getSalesAnalytics);

// Top-selling products
router.get('/top-products', topEntitiesValidator, validate, getTopProducts);

// Best-selling categories
router.get('/top-categories', topEntitiesValidator, validate, getTopCategories);

module.exports = router;
