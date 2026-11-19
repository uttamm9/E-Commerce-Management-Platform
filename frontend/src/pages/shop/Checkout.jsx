import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  CreditCard,
  ShieldCheck,
  MapPin,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCart, resetCart } from '../../redux/slices/cartSlice';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { formatPrice } from '../../utils/formatPrice';

// Safe dynamic loader for Razorpay standard checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { cart, loading: cartLoading } = useSelector((state) => state.cart);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const estimatedShipping = subtotal >= 1000 || subtotal === 0 ? 0 : 50;
  const estimatedTax = Number((subtotal * 0.05).toFixed(2));
  const estimatedTotal = Number((subtotal + estimatedShipping + estimatedTax).toFixed(2));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!shippingAddress.fullName.trim())
      errors.fullName = 'Recipient name is required';
    if (!shippingAddress.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+\s()-]{7,20}$/.test(shippingAddress.phone.trim())) {
      errors.phone = 'Please provide a valid contact number';
    }
    if (!shippingAddress.addressLine1.trim())
      errors.addressLine1 = 'Street address is required';
    if (!shippingAddress.city.trim()) errors.city = 'City is required';
    if (!shippingAddress.state.trim()) errors.state = 'State is required';
    if (!shippingAddress.postalCode.trim())
      errors.postalCode = 'Postal code is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrderAndPay = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please complete all required shipping address fields');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Ensure Razorpay SDK is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Failed to load Razorpay payment gateway. Check network connection.');
        setSubmitting(false);
        return;
      }

      // 2. Create Pending Order on backend
      const checkoutRes = await orderService.checkout(shippingAddress);
      const createdOrder = checkoutRes.data?.order;
      if (!createdOrder) {
        throw new Error('Order creation failed');
      }

      // 3. Create Razorpay Payment Order on backend
      const paymentOrderRes = await paymentService.createPaymentOrder(createdOrder._id);
      const { razorpayOrderId, amount, currency, keyId } = paymentOrderRes.data;

      // 4. Configure Razorpay modal options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'EliteStore Platform',
        description: `Payment for Order #${createdOrder.orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: shippingAddress.fullName,
          email: user?.email || '',
          contact: shippingAddress.phone,
        },
        theme: {
          color: '#4f46e5', // Tailwind indigo-600
        },
        handler: async function (response) {
          try {
            // 5. Verify payment signature on backend
            const verifyPayload = {
              orderId: createdOrder._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await paymentService.verifyPayment(verifyPayload);
            if (verifyRes.success) {
              dispatch(resetCart());
              toast.success('Payment confirmed successfully!');
              navigate(`/payment-success?orderId=${createdOrder._id}`, {
                replace: true,
              });
            } else {
              toast.error(verifyRes.message || 'Payment verification failed');
            }
          } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            toast.error(
              verifyErr.response?.data?.message ||
                'Payment verification failed. Please contact customer support.'
            );
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            toast('Payment modal closed. Your order remains pending.', {
              icon: 'ℹ️',
            });
          },
        },
      };

      // 6. Open standard Razorpay Checkout
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        console.error('Payment failed response:', resp.error);
        toast.error(`Payment failed: ${resp.error.description || 'Transaction cancelled'}`);
        setSubmitting(false);
      });
      rzpInstance.open();
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Failed to initialize checkout'
      );
      setSubmitting(false);
    }
  };

  if (cartLoading && items.length === 0) {
    return <Loader fullScreen text="Preparing checkout session..." />;
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Your Cart is Empty</h2>
        <p className="text-sm text-gray-500">
          Cannot proceed to checkout without any items in your cart.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          <span>Return to Store</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Title */}
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Secure Order Checkout
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Provide your delivery details and proceed to secure Razorpay payment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Shipping Address Form */}
        <div className="lg:col-span-2 space-y-6">
          <form
            id="checkout-form"
            onSubmit={handlePlaceOrderAndPay}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6"
          >
            <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span>Shipping & Delivery Address</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Recipient Name"
                name="fullName"
                placeholder="e.g. Rahul Sharma"
                value={shippingAddress.fullName}
                onChange={handleChange}
                error={formErrors.fullName}
                required
              />

              <Input
                label="Contact Phone Number"
                name="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={shippingAddress.phone}
                onChange={handleChange}
                error={formErrors.phone}
                required
              />
            </div>

            <Input
              label="Street Address / House / Flat No."
              name="addressLine1"
              placeholder="e.g. 102, Green Park Apartments, MG Road"
              value={shippingAddress.addressLine1}
              onChange={handleChange}
              error={formErrors.addressLine1}
              required
            />

            <Input
              label="Apartment, Landmark, Suite (Optional)"
              name="addressLine2"
              placeholder="e.g. Near Metro Pillar 140"
              value={shippingAddress.addressLine2}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                placeholder="e.g. Bangalore"
                value={shippingAddress.city}
                onChange={handleChange}
                error={formErrors.city}
                required
              />

              <Input
                label="State"
                name="state"
                placeholder="e.g. Karnataka"
                value={shippingAddress.state}
                onChange={handleChange}
                error={formErrors.state}
                required
              />

              <Input
                label="PIN / Postal Code"
                name="postalCode"
                placeholder="e.g. 560001"
                value={shippingAddress.postalCode}
                onChange={handleChange}
                error={formErrors.postalCode}
                required
              />
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 leading-relaxed">
                <p className="font-bold">Instant Online Payment via Razorpay</p>
                <p className="text-indigo-700 mt-0.5">
                  Supports UPI, Credit/Debit Cards, Net Banking, and Wallets. Handled in official Test Mode.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Right Col: Order Items Review & Final Pay Button */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>Review Items ({items.length})</span>
            </h3>

            {/* Compact Item List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-50">
              {items.map((item) => (
                <div
                  key={item._id || item.product?._id}
                  className="flex items-center justify-between text-xs pt-2 first:pt-0"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-gray-800 line-clamp-1">
                      {item.name || item.product?.name}
                    </p>
                    <p className="text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Delivery Shipping Fee</span>
                <span className="font-semibold text-gray-900">
                  {estimatedShipping === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase">
                      FREE
                    </span>
                  ) : (
                    formatPrice(estimatedShipping)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Estimated Taxes (5% GST)</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(estimatedTax)}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex items-baseline justify-between text-sm">
                <span className="font-extrabold text-gray-900">
                  Payable Amount
                </span>
                <span className="text-xl font-black text-indigo-600">
                  {formatPrice(estimatedTotal)}
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              type="submit"
              form="checkout-form"
              variant="primary"
              size="lg"
              className="w-full py-3.5 mt-2"
              loading={submitting}
              icon={CreditCard}
            >
              {submitting ? 'Connecting Razorpay...' : `Pay Now ${formatPrice(estimatedTotal)}`}
            </Button>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>256-Bit SSL Secured Transaction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
