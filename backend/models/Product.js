const mongoose = require('mongoose');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    key: {
      type: String,
      required: [true, 'S3 object key is required'],
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0.01, 'Price must be greater than zero'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      required: [true, 'Product SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer value',
      },
    },
    lowStockThreshold: {
      type: Number,
      min: [0, 'Low stock threshold cannot be negative'],
      default: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Low stock threshold must be an integer value',
      },
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for computed availability state
productSchema.virtual('availability').get(function () {
  if (this.stock === 0) {
    return 'out of stock';
  }
  if (this.stock <= this.lowStockThreshold) {
    return 'low stock';
  }
  return 'in stock';
});

// Auto-generate URL-friendly slug and uppercase SKU before validation
productSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name);
  }

  if (this.sku) {
    this.sku = this.sku.toString().trim().toUpperCase();
  }

  // Validate discount price cannot exceed regular price
  if (
    this.discountPrice !== undefined &&
    this.discountPrice !== null &&
    this.discountPrice > 0 &&
    this.price !== undefined &&
    this.discountPrice > this.price
  ) {
    this.invalidate(
      'discountPrice',
      'Discount price cannot exceed the regular price'
    );
  }

  next();
});

// Indexes for search, filtering, and sorting
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  sku: 'text',
});
productSchema.index({ category: 1, status: 1, price: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
