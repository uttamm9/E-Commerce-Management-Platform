const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const {
  uploadToS3,
  deleteFromS3,
  deleteMultipleFromS3,
} = require('../config/s3');

/**
 * @desc    Create a new product with optional image uploads to S3
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res, next) => {
  const uploadedS3Images = [];

  try {
    const {
      name,
      description,
      price,
      discountPrice,
      sku,
      category,
      stock,
      lowStockThreshold,
      brand,
      status,
    } = req.body;

    // Check SKU uniqueness
    const normalizedSku = sku.toString().trim().toUpperCase();
    const existingSku = await Product.findOne({ sku: normalizedSku });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `A product with SKU '${normalizedSku}' already exists`,
      });
    }

    // Verify category exists and is active
    const targetCategory = await Category.findById(category);
    if (!targetCategory) {
      return res.status(400).json({
        success: false,
        message: 'The specified category does not exist',
      });
    }
    if (targetCategory.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign product to an inactive category',
      });
    }

    // Parse numeric fields
    const parsedPrice = parseFloat(price);
    const parsedDiscountPrice =
      discountPrice !== undefined && discountPrice !== ''
        ? parseFloat(discountPrice)
        : 0;
    const parsedStock = parseInt(stock, 10);
    const parsedThreshold =
      lowStockThreshold !== undefined && lowStockThreshold !== ''
        ? parseInt(lowStockThreshold, 10)
        : 5;

    // Upload images to S3 if provided
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const { url, key } = await uploadToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          'products'
        );
        uploadedS3Images.push({ url, key });
      }
    }

    // Create product in database
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      discountPrice: parsedDiscountPrice,
      sku: normalizedSku,
      category: targetCategory._id,
      images: uploadedS3Images,
      stock: parsedStock,
      lowStockThreshold: parsedThreshold,
      brand: brand ? brand.trim() : '',
      status: status || 'active',
    });

    const populatedProduct = await Product.findById(product._id).populate(
      'category',
      'name slug'
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product: populatedProduct,
      },
    });
  } catch (error) {
    // Clean up any uploaded S3 images if database insertion fails
    if (uploadedS3Images.length > 0) {
      const keys = uploadedS3Images.map((img) => img.key);
      await deleteMultipleFromS3(keys).catch((err) =>
        console.error('Failed to clean up S3 images after DB failure:', err.message)
      );
    }
    next(error);
  }
};

/**
 * @desc    Get all products with search, filter, sort, and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = {};

    // Public users see only active products belonging to active categories; Admins can see all or filter
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      filter.status = 'active';
      const activeCategories = await Category.find({ status: 'active' }).select('_id');
      const activeCategoryIds = activeCategories.map((c) => c._id);

      if (req.query.category) {
        const isRequestedActive = activeCategoryIds.some(
          (id) => id.toString() === req.query.category.toString()
        );
        if (!isRequestedActive) {
          return res.status(200).json({
            success: true,
            message: 'Products fetched successfully',
            data: {
              products: [],
              pagination: {
                totalRecords: 0,
                currentPage: page,
                totalPages: 0,
                limit,
              },
            },
          });
        }
        filter.category = req.query.category;
      } else {
        filter.category = { $in: activeCategoryIds };
      }
    } else {
      if (req.query.category) {
        filter.category = req.query.category;
      }
      if (req.query.status) {
        filter.status = req.query.status;
      }
    }

    // Search by name, description, brand, or SKU
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search.trim(), $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { sku: searchRegex },
      ];
    }

    // Filter by brand
    if (req.query.brand) {
      filter.brand = { $regex: req.query.brand.trim(), $options: 'i' };
    }

    // Filter by price range
    if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
      filter.price = {};
      if (req.query.minPrice !== undefined && req.query.minPrice !== '') {
        filter.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice !== undefined && req.query.maxPrice !== '') {
        filter.price.$lte = parseFloat(req.query.maxPrice);
      }
    }

    // Sorting
    const allowedSortFields = ['price', 'name', 'createdAt', 'stock', 'discountPrice'];
    const sortBy = allowedSortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [products, totalRecords] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: {
        products,
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
 * @desc    Get single product by ID or Slug
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    const isMongoId = mongoose.isValidObjectId(req.params.id);
    const query = isMongoId
      ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] }
      : { slug: req.params.id };

    const product = await Product.findOne(query).populate(
      'category',
      'name slug status'
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Public users cannot view inactive products or products with inactive categories
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      const isProductActive = product.status === 'active';
      const isCategoryActive =
        product.category && product.category.status === 'active';
      if (!isProductActive || !isCategoryActive) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res, next) => {
  const newlyUploadedS3Images = [];

  try {
    const isMongoId = mongoose.isValidObjectId(req.params.id);
    const query = isMongoId
      ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] }
      : { slug: req.params.id };

    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const {
      name,
      description,
      price,
      discountPrice,
      sku,
      category,
      stock,
      lowStockThreshold,
      brand,
      status,
      removedImageKeys,
    } = req.body;

    // Check SKU if modified
    if (sku) {
      const normalizedSku = sku.toString().trim().toUpperCase();
      if (normalizedSku !== product.sku) {
        const existingSku = await Product.findOne({
          sku: normalizedSku,
          _id: { $ne: product._id },
        });
        if (existingSku) {
          return res.status(400).json({
            success: false,
            message: `A product with SKU '${normalizedSku}' already exists`,
          });
        }
        product.sku = normalizedSku;
      }
    }

    // Check category if modified
    if (category && category.toString() !== product.category.toString()) {
      const targetCategory = await Category.findById(category);
      if (!targetCategory) {
        return res.status(400).json({
          success: false,
          message: 'The specified category does not exist',
        });
      }
      if (targetCategory.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign product to an inactive category',
        });
      }
      product.category = targetCategory._id;
    }

    // Update text and numeric fields
    if (name) product.name = name.trim();
    if (description) product.description = description.trim();
    if (brand !== undefined) product.brand = brand.trim();
    if (status !== undefined) product.status = status;

    if (price !== undefined && price !== '') {
      product.price = parseFloat(price);
    }
    if (discountPrice !== undefined && discountPrice !== '') {
      product.discountPrice = parseFloat(discountPrice);
    }
    if (stock !== undefined && stock !== '') {
      product.stock = parseInt(stock, 10);
    }
    if (lowStockThreshold !== undefined && lowStockThreshold !== '') {
      product.lowStockThreshold = parseInt(lowStockThreshold, 10);
    }

    // Validate discount price against regular price
    if (product.discountPrice > 0 && product.discountPrice > product.price) {
      return res.status(400).json({
        success: false,
        message: 'Discount price cannot exceed regular price',
      });
    }

    // Process image removal
    // Parse removedImageKeys if provided as JSON string or array
    let keysToRemove = [];
    if (removedImageKeys) {
      if (Array.isArray(removedImageKeys)) {
        keysToRemove = removedImageKeys;
      } else if (typeof removedImageKeys === 'string') {
        try {
          const parsed = JSON.parse(removedImageKeys);
          keysToRemove = Array.isArray(parsed) ? parsed : [removedImageKeys];
        } catch {
          keysToRemove = [removedImageKeys];
        }
      }
    }

    // Only allow removing keys that actually belong to this product
    const currentKeys = product.images.map((img) => img.key);
    const validKeysToDelete = keysToRemove.filter((k) => currentKeys.includes(k));

    let updatedImages = product.images.filter(
      (img) => !validKeysToDelete.includes(img.key)
    );

    // Process new image uploads
    if (req.files && req.files.length > 0) {
      if (updatedImages.length + req.files.length > 5) {
        return res.status(400).json({
          success: false,
          message: `Cannot upload images: Total images would exceed the maximum limit of 5 (currently keeping ${updatedImages.length})`,
        });
      }

      for (const file of req.files) {
        const { url, key } = await uploadToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          'products'
        );
        newlyUploadedS3Images.push({ url, key });
      }
      updatedImages = updatedImages.concat(newlyUploadedS3Images);
    }

    product.images = updatedImages;

    // Save product in database first
    await product.save();

    // After database update succeeds, delete the removed images from S3
    if (validKeysToDelete.length > 0) {
      await deleteMultipleFromS3(validKeysToDelete).catch((err) =>
        console.error('Failed to delete old S3 images:', err.message)
      );
    }

    const populatedProduct = await Product.findById(product._id).populate(
      'category',
      'name slug'
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product: populatedProduct,
      },
    });
  } catch (error) {
    // If DB save failed, clean up any newly uploaded images from S3
    if (newlyUploadedS3Images.length > 0) {
      const keys = newlyUploadedS3Images.map((img) => img.key);
      await deleteMultipleFromS3(keys).catch((err) =>
        console.error('Failed to clean up newly uploaded S3 images:', err.message)
      );
    }
    next(error);
  }
};

/**
 * @desc    Delete a product and its associated S3 images
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res, next) => {
  try {
    const isMongoId = mongoose.isValidObjectId(req.params.id);
    const query = isMongoId
      ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] }
      : { slug: req.params.id };

    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Retrieve S3 keys directly from the document to avoid deleting arbitrary files
    const s3Keys = product.images.map((img) => img.key).filter(Boolean);

    // Delete product document from MongoDB
    await product.deleteOne();

    // Safely delete associated images from S3
    if (s3Keys.length > 0) {
      await deleteMultipleFromS3(s3Keys).catch((err) =>
        console.error('Failed to delete S3 images during product deletion:', err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Product and associated images deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
