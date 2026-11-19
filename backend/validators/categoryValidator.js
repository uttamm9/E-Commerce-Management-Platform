const { body } = require('express-validator');

const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2 })
    .withMessage('Category name must be at least 2 characters long'),

  body('description')
    .optional()
    .trim(),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

const updateCategoryValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ min: 2 })
    .withMessage('Category name must be at least 2 characters long'),

  body('description')
    .optional()
    .trim(),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

module.exports = {
  createCategoryValidator,
  updateCategoryValidator,
};
