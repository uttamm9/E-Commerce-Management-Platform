const { body, param } = require('express-validator');

const addToCartValidator = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),

  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer (at least 1)'),
];

const updateCartValidator = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer (at least 1)'),
];

const cartProductIdParamValidator = [
  param('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID parameter is required')
    .isMongoId()
    .withMessage('Invalid product ID format in route parameter'),
];

module.exports = {
  addToCartValidator,
  updateCartValidator,
  cartProductIdParamValidator,
};
