const express = require('express');
const router = express.Router();

const {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  getCustomerOrders,
} = require('../controllers/customerController');
const {
  customerIdParamValidator,
  updateCustomerStatusValidator,
  getCustomersQueryValidator,
} = require('../validators/customerValidator');
const validate = require('../middleware/validateMiddleware');
const protect = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/roleMiddleware');

// All customer management endpoints require Admin authentication
router.use(protect, isAdmin);

// List all customers with search and filters
router.get('/', getCustomersQueryValidator, validate, getCustomers);

// Single customer details with order metrics
router.get('/:id', customerIdParamValidator, validate, getCustomerById);

// Update customer account status (activate/deactivate)
router.put('/:id/status', updateCustomerStatusValidator, validate, updateCustomerStatus);

// Get order history for a specific customer
router.get('/:id/orders', customerIdParamValidator, validate, getCustomerOrders);

module.exports = router;
