import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import ProductImages from './ProductImages';
import CategorySelector from './CategorySelector';

const ProductForm = ({
  initialValues = {},
  onSubmit,
  loading = false,
  isEdit = false,
  categories = [],
  onCancel,
  onDeleteExistingImage,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    sku: '',
    category: '',
    brand: '',
    stock: '',
    lowStockThreshold: 5,
    status: 'active',
  });

  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        name: initialValues.name || '',
        description: initialValues.description || '',
        price: initialValues.price !== undefined ? initialValues.price : '',
        discountPrice:
          initialValues.discountPrice !== undefined ? initialValues.discountPrice : '',
        sku: initialValues.sku || '',
        category: initialValues.category?._id || initialValues.category || '',
        brand: initialValues.brand || '',
        stock: initialValues.stock !== undefined ? initialValues.stock : '',
        lowStockThreshold:
          initialValues.lowStockThreshold !== undefined
            ? initialValues.lowStockThreshold
            : 5,
        status: initialValues.status || 'active',
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim())
      newErrors.description = 'Product description is required';
    if (!formData.price || Number(formData.price) <= 0)
      newErrors.price = 'Valid price greater than 0 is required';
    if (
      formData.discountPrice &&
      Number(formData.discountPrice) >= Number(formData.price)
    ) {
      newErrors.discountPrice = 'Discount price must be less than regular price';
    }
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.stock === '' || Number(formData.stock) < 0)
      newErrors.stock = 'Stock must be 0 or greater';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Build FormData payload
    const submissionData = new FormData();
    submissionData.append('name', formData.name.trim());
    submissionData.append('description', formData.description.trim());
    submissionData.append('price', formData.price);
    if (formData.discountPrice !== '') {
      submissionData.append('discountPrice', formData.discountPrice);
    }
    submissionData.append('sku', formData.sku.trim().toUpperCase());
    submissionData.append('category', formData.category);
    submissionData.append('brand', formData.brand.trim());
    submissionData.append('stock', formData.stock);
    submissionData.append('lowStockThreshold', formData.lowStockThreshold);
    submissionData.append('status', formData.status);

    newFiles.forEach((file) => {
      submissionData.append('images', file);
    });

    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Basic Details
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Wireless Ergonomic Headphones"
            error={errors.name}
            required
          />

          <Input
            label="SKU (Stock Keeping Unit)"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="e.g. WH-100-BLK"
            error={errors.sku}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed features, specifications, and overview..."
            className={`block w-full rounded-lg border p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
              errors.description
                ? 'border-rose-300 focus:ring-rose-200'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-rose-600">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CategorySelector
            value={formData.category}
            onChange={(catId) => {
              setFormData((prev) => ({ ...prev, category: catId }));
              if (errors.category) {
                setErrors((prev) => ({ ...prev, category: '' }));
              }
            }}
            error={errors.category}
            initialCategoryObj={
              initialValues.category && typeof initialValues.category === 'object'
                ? initialValues.category
                : null
            }
            categories={categories}
          />

          <Input
            label="Brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="e.g. Sony, Nike"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catalog Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="active">Active (Visible in Store)</option>
              <option value="inactive">Inactive (Hidden from Store)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Pricing & Inventory
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="Regular Price (₹)"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            error={errors.price}
            required
          />

          <Input
            label="Discount Price (₹)"
            name="discountPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.discountPrice}
            onChange={handleChange}
            placeholder="Optional discount price"
            error={errors.discountPrice}
            helperText="Must be lower than regular price"
          />

          <Input
            label="Available Stock"
            name="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={handleChange}
            placeholder="Units in warehouse"
            error={errors.stock}
            required
          />

          <Input
            label="Low-Stock Alert Level"
            name="lowStockThreshold"
            type="number"
            min="0"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            placeholder="Default 5"
            helperText="Triggers low-stock warnings"
          />
        </div>
      </div>

      {/* Product Images */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <ProductImages
          existingImages={initialValues.images || []}
          newFiles={newFiles}
          onNewFilesChange={setNewFiles}
          onDeleteExisting={onDeleteExistingImage}
        />
      </div>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          {isEdit ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
