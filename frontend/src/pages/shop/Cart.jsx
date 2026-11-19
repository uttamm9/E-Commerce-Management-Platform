import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, ArrowRight, Trash2, ShieldCheck, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from '../../redux/slices/cartSlice';
import CartItem from '../../components/cart/CartItem';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { formatPrice } from '../../utils/formatPrice';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cart, loading } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const estimatedShipping = subtotal >= 1000 || subtotal === 0 ? 0 : 50;
  const estimatedTax = Number((subtotal * 0.05).toFixed(2));
  const estimatedTotal = Number((subtotal + estimatedShipping + estimatedTax).toFixed(2));

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      await dispatch(
        updateCartQuantity({ productId, quantity: newQuantity })
      ).unwrap();
    } catch (err) {
      toast.error(err || 'Failed to update item quantity');
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await dispatch(removeFromCart(productId)).unwrap();
      toast.success('Item removed from cart');
    } catch (err) {
      toast.error(err || 'Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      try {
        await dispatch(clearCart()).unwrap();
        toast.success('Cart cleared');
      } catch (err) {
        toast.error(err || 'Failed to clear cart');
      }
    }
  };

  if (loading && items.length === 0) {
    return <Loader fullScreen text="Fetching your shopping cart..." />;
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Your Shopping Cart is Empty
        </h2>
        <p className="text-sm text-gray-500">
          Looks like you haven't added anything to your cart yet. Explore our latest arrivals to get started.
        </p>
        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md transition-colors"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            You have {cart?.totalItems || items.length} {cart?.totalItems === 1 ? 'item' : 'items'} in your cart.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearCart}
          className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Item Listing */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <CartItem
                key={item._id || item.product?._id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                loading={loading}
              />
            ))}
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Checkout Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Order Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-gray-900">
                  {estimatedShipping === 0 ? (
                    <span className="text-emerald-600 uppercase text-xs font-bold">
                      FREE
                    </span>
                  ) : (
                    formatPrice(estimatedShipping)
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <span>Estimated Tax (5% GST)</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(estimatedTax)}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-baseline justify-between text-base">
                <span className="font-bold text-gray-900">Estimated Total</span>
                <span className="text-xl font-black text-indigo-600">
                  {formatPrice(estimatedTotal)}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-4 py-3.5"
              onClick={() => navigate('/checkout')}
              icon={ArrowRight}
            >
              Proceed to Checkout
            </Button>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Official Razorpay Standard Test Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
