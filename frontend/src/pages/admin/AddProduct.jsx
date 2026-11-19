import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCategories } from '../../redux/slices/productSlice';
import productService from '../../services/productService';
import ProductForm from '../../components/products/ProductForm';

const AddProduct = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { categories } = useSelector((state) => state.products);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories({}));
  }, [dispatch]);

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      await productService.createProduct(formData);
      toast.success('Product created successfully and images uploaded to S3!');
      navigate('/admin/products');
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Failed to create product'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/products"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Add New Product
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Fill in product specifications, pricing, stock, and upload images to AWS S3.
          </p>
        </div>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        loading={submitting}
        categories={categories}
        onCancel={() => navigate('/admin/products')}
      />
    </div>
  );
};

export default AddProduct;
