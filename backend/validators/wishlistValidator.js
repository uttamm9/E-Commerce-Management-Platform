const { body, param } = require('express-validator');

const addToWishlistValidator = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
];

const moveToCartValidator = [
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

const wishlistProductIdParamValidator = [
  param('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID parameter is required')
    .isMongoId()
    .withMessage('Invalid product ID format in route parameter'),
];

module.exports = {
  addToWishlistValidator,
  moveToCartValidator,
  wishlistProductIdParamValidator,
};
