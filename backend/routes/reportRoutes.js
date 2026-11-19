const express = require('express');
const router = express.Router();

const {
  getSalesReport,
  exportSalesReportCSV,
  getOrderReport,
  exportOrderReportCSV,
  getInventoryReport,
  exportInventoryReportCSV,
} = require('../controllers/reportController');
const {
  salesAnalyticsValidator,
  inventoryReportValidator,
  orderReportValidator,
} = require('../validators/reportValidator');
const validate = require('../middleware/validateMiddleware');
const protect = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/roleMiddleware');

// All report endpoints are restricted to authenticated Admins
router.use(protect, isAdmin);

// Sales reports and CSV export
router.get('/sales/export', salesAnalyticsValidator, validate, exportSalesReportCSV);
router.get('/sales', salesAnalyticsValidator, validate, getSalesReport);

// Order reports and CSV export
router.get('/orders/export', orderReportValidator, validate, exportOrderReportCSV);
router.get('/orders', orderReportValidator, validate, getOrderReport);

// Inventory reports and CSV export
router.get('/inventory/export', inventoryReportValidator, validate, exportInventoryReportCSV);
router.get('/inventory', inventoryReportValidator, validate, getInventoryReport);

module.exports = router;
