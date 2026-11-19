const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all categories with pagination and search
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const query = {};

    // Public users see active categories; admins can view all or filter
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      query.status = 'active';
    } else if (req.query.status) {
      query.status = req.query.status;
    }

    // Search by category name
    if (req.query.search) {
      query.name = { $regex: req.query.search.trim(), $options: 'i' };
    }

    const [categories, totalRecords] = await Promise.all([
      Category.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Category.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: {
        categories,
        pagination: {
          totalRecords,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit) || 1,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Public users cannot view inactive categories
    const isAdmin = req.user && req.user.role === 'admin';
    if (category.status !== 'active' && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const { name, description, status } = req.body;

    if (name && name.trim() !== category.name) {
      const existingName = await Category.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: req.params.id },
      });

      if (existingName) {
        return res.status(400).json({
          success: false,
          message: 'Another category with this name already exists',
        });
      }

      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (status !== undefined) {
      category.status = status;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Prevent deletion if products are still associated with this category
    const associatedCount = await Product.countDocuments({
      category: req.params.id,
    });

    if (associatedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${associatedCount} product(s) are associated with it. Please reassign or delete the products first.`,
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
