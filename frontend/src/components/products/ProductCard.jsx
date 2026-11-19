import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { addToCart } from '../../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../redux/slices/wishlistSlice';
import { formatPrice } from '../../utils/formatPrice';
import { AVAILABILITY_COLORS, AVAILABILITY_LABELS } from '../../utils/constants';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.wishlist);

  const isInWishlist = (wishlist?.products || []).some(
    (item) => (item._id || item) === product._id
  );

  const isOutOfStock = product.stock <= 0 || product.availability === 'out_of_stock';
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const currentPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0].url
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart');
      return;
    }
    if (isOutOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }

    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err || 'Failed to add item to cart');
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Link to={`/products/${product.slug || product._id}`}>
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
            {discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-md ${
            isInWishlist
              ? 'bg-rose-50 text-rose-600 scale-110'
              : 'bg-white/90 text-gray-400 hover:text-rose-500 hover:bg-white'
          }`}
          title={isInWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>

        {/* Stock Tag on Image if Out of Stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center">
            <span className="bg-rose-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Availability */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-indigo-600 uppercase tracking-wider text-[10px]">
              {product.category?.name || 'Store'}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                AVAILABILITY_COLORS[product.availability] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {AVAILABILITY_LABELS[product.availability] || 'Available'}
            </span>
          </div>

          {/* Product Name */}
          <Link
            to={`/products/${product.slug || product._id}`}
            className="block text-sm font-semibold text-gray-900 line-clamp-1 hover:text-indigo-600 transition-colors"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>
          )}
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-xs transition-colors"
            title={isOutOfStock ? 'Item is unavailable' : 'Add to cart'}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
