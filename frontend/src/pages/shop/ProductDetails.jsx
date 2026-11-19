import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProductDetails, clearCurrentProduct } from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../redux/slices/wishlistSlice';
import { formatPrice } from '../../utils/formatPrice';
import { AVAILABILITY_COLORS, AVAILABILITY_LABELS } from '../../utils/constants';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { currentProduct: product, loading, error } = useSelector(
    (state) => state.products
  );
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.wishlist);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    dispatch(fetchProductDetails(id));
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, id]);

  if (loading) {
    return <Loader fullScreen text="Loading product details..." />;
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-800">
          {error ? 'Unable to Load Product' : 'Product Not Found'}
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          {error || 'The product you are looking for might have been retired or is currently unavailable.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          {error && (
            <button
              type="button"
              onClick={() => dispatch(fetchProductDetails(id))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Retry
            </button>
          )}
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Store Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isInWishlist = (wishlist?.products || []).some(
    (item) => (item._id || item) === product._id
  );

  const isOutOfStock = product.stock <= 0 || product.availability === 'out_of_stock';
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const currentPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', key: 'default' }];

  const activeImage = images[selectedImageIndex] || images[0];

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart');
      return;
    }
    if (isOutOfStock) {
      toast.error('Product is out of stock');
      return;
    }

    try {
      setAddingToCart(true);
      await dispatch(addToCart({ productId: product._id, quantity })).unwrap();
      toast.success(`${quantity} unit(s) of ${product.name} added to cart!`);
    } catch (err) {
      toast.error(err || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage your wishlist');
      return;
    }

    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(product._id)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
        toast.success('Saved to wishlist');
      }
    } catch (err) {
      toast.error(err || 'Failed to update wishlist');
    }
  };

  return (
    <div className="space-y-12 py-4">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-indigo-600 transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-3xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm relative">
            <img
              src={activeImage.url}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                SAVE {discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.key || idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-indigo-600 shadow-md scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} thumb ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Meta & Purchase */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {product.category?.name || 'General'}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  AVAILABILITY_COLORS[product.availability] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {AVAILABILITY_LABELS[product.availability] || 'Available'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {product.name}
            </h1>

            {product.brand && (
              <p className="text-sm text-gray-500 mt-1">Brand: <span className="font-semibold text-gray-700">{product.brand}</span></p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>
          </div>

          {/* Price Block */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-baseline gap-3">
            <span className="text-3xl font-black text-gray-900">
              {formatPrice(currentPrice)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-base text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs font-bold text-rose-600">
                  You save {formatPrice(product.price - product.discountPrice)} ({discountPercent}%)
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900">Overview</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Quantity & Cart Actions */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-gray-400">
                  ({product.stock} units in stock)
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:flex-1 py-3.5"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                loading={addingToCart}
                icon={ShoppingBag}
              >
                {isOutOfStock ? 'Sold Out' : 'Add to Shopping Cart'}
              </Button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`w-full sm:w-auto p-3.5 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                  isInWishlist
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
                title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                <span className="sm:hidden text-sm font-medium">
                  {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </span>
              </button>
            </div>
          </div>

          {/* Quality Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 text-xs text-gray-600">
              <Truck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Fast Track Delivery</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 text-xs text-gray-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>100% Verified Quality</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 text-xs text-gray-600">
              <RotateCcw className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>7-Day Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
