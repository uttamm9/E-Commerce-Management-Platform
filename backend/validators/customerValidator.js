const { param, body, query } = require('express-validator');

const customerIdParamValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Customer ID is required')
    .isMongoId()
    .withMessage('Invalid customer ID format'),
];

const updateCustomerStatusValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Customer ID is required')
    .isMongoId()
    .withMessage('Invalid customer ID format'),

  body('isActive')
    .notEmpty()
    .withMessage('isActive status is required')
    .isBoolean()
    .withMessage('isActive must be a boolean value (true or false)'),
];

const getCustomersQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  query('search')
    .optional()
    .trim(),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive filter must be boolean'),

  query('sortBy')
    .optional()
    .trim(),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
];

module.exports = {
  customerIdParamValidator,
  updateCustomerStatusValidator,
  getCustomersQueryValidator,
};
