import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchWishlist,
  removeFromWishlist,
  moveWishlistItemToCart,
} from '../../redux/slices/wishlistSlice';
import { fetchCart } from '../../redux/slices/cartSlice';
import { formatPrice } from '../../utils/formatPrice';
import { AVAILABILITY_COLORS, AVAILABILITY_LABELS } from '../../utils/constants';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { wishlist, loading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const products = wishlist?.products || [];

  const handleRemove = async (productId) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      toast.success('Product removed from wishlist');
    } catch (err) {
      toast.error(err || 'Failed to remove from wishlist');
    }
  };

  const handleMoveToCart = async (productId) => {
    try {
      await dispatch(moveWishlistItemToCart({ productId, quantity: 1 })).unwrap();
      dispatch(fetchCart());
      toast.success('Moved product to shopping cart!');
    } catch (err) {
      toast.error(err || 'Failed to move product to cart');
    }
  };

  if (loading && products.length === 0) {
    return <Loader fullScreen text="Loading your wishlist..." />;
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Your Wishlist is Empty
        </h2>
        <p className="text-sm text-gray-500">
          Save items you're interested in while browsing so you can easily find them later.
        </p>
        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md transition-colors"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Title */}
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          My Saved Wishlist
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {products.length} {products.length === 1 ? 'item' : 'items'} saved for later
        </p>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const isOutOfStock =
            product.stock <= 0 || product.availability === 'out_of_stock';
          const hasDiscount =
            product.discountPrice > 0 && product.discountPrice < product.price;
          const currentPrice = hasDiscount ? product.discountPrice : product.price;
          const image =
            product.images && product.images.length > 0
              ? product.images[0].url
              : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80';

          return (
            <div
              key={product._id}
              className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                  <Link to={`/products/${product.slug || product._id}`}>
                    <img
                      src={image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(product._id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-rose-600 hover:bg-white shadow-md transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        AVAILABILITY_COLORS[product.availability] ||
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {AVAILABILITY_LABELS[product.availability] || 'Available'}
                    </span>
                    {product.brand && (
                      <span className="text-[11px] text-gray-400">
                        {product.brand}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/products/${product.slug || product._id}`}
                    className="block text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>

                  <div className="flex items-baseline gap-2 pt-1">
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
              </div>

              {/* Action */}
              <div className="p-4 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full py-2.5"
                  disabled={isOutOfStock}
                  onClick={() => handleMoveToCart(product._id)}
                  icon={ShoppingBag}
                >
                  {isOutOfStock ? 'Currently Out of Stock' : 'Move to Cart'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
