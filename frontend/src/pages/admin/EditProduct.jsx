import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCategories } from '../../redux/slices/productSlice';
import productService from '../../services/productService';
import ProductForm from '../../components/products/ProductForm';
import Loader from '../../components/common/Loader';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { categories } = useSelector((state) => state.products);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories({}));

    const loadProduct = async () => {
      try {
        setLoading(true);
        const res = await productService.getProductById(id);
        setProduct(res.data?.product);
      } catch (err) {
        toast.error('Failed to load product details');
        navigate('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, dispatch, navigate]);

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      await productService.updateProduct(id, formData);
      toast.success('Product updated successfully!');
      navigate('/admin/products');
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Failed to update product'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExistingImage = async (key) => {
    if (!window.confirm('Are you sure you want to delete this image from AWS S3?'))
      return;
    try {
      const res = await productService.deleteProductImage(id, key);
      setProduct(res.data?.product);
      toast.success('Image removed from S3');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete image');
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading product details..." />;
  }

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
            Edit Product
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Update product details or add/remove AWS S3 media.
          </p>
        </div>
      </div>

      <ProductForm
        initialValues={product}
        onSubmit={handleSubmit}
        loading={submitting}
        isEdit={true}
        categories={categories}
        onCancel={() => navigate('/admin/products')}
        onDeleteExistingImage={handleDeleteExistingImage}
      />
    </div>
  );
};

export default EditProduct;
