const { body } = require('express-validator');

const createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2 })
    .withMessage('Product name must be at least 2 characters long'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required'),

  body('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number greater than 0'),

  body('discountPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a non-negative number')
    .custom((value, { req }) => {
      if (value !== undefined && value !== null && value !== '') {
        const discount = parseFloat(value);
        const price = parseFloat(req.body.price);
        if (!isNaN(discount) && !isNaN(price) && discount > price) {
          throw new Error('Discount price cannot exceed regular price');
        }
      }
      return true;
    }),

  body('sku')
    .trim()
    .notEmpty()
    .withMessage('Product SKU is required'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Product category is required')
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ID'),

  body('stock')
    .notEmpty()
    .withMessage('Product stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('lowStockThreshold')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer'),

  body('brand')
    .optional()
    .trim(),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

const updateProductValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ min: 2 })
    .withMessage('Product name must be at least 2 characters long'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product description cannot be empty'),

  body('price')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number greater than 0'),

  body('discountPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a non-negative number')
    .custom((value, { req }) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        req.body.price !== undefined
      ) {
        const discount = parseFloat(value);
        const price = parseFloat(req.body.price);
        if (!isNaN(discount) && !isNaN(price) && discount > price) {
          throw new Error('Discount price cannot exceed regular price');
        }
      }
      return true;
    }),

  body('sku')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product SKU cannot be empty'),

  body('category')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ID'),

  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('lowStockThreshold')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer'),

  body('brand')
    .optional()
    .trim(),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

module.exports = {
  createProductValidator,
  updateProductValidator,
};
