import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  FileDown,
  ShoppingBag,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../../services/orderService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { formatPrice } from '../../utils/formatPrice';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/orders/OrderStatus';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchConfirmedOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await orderService.getOrderById(orderId);
        setOrder(response.data?.order);
      } catch (err) {
        console.error('Failed to load order:', err);
        toast.error('Could not load order confirmation details');
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmedOrder();
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    if (!order?._id) return;
    try {
      setDownloading(true);
      const res = await orderService.getInvoice(order._id);
      if (res.data?.invoiceUrl) {
        window.open(res.data.invoiceUrl, '_blank');
      } else {
        toast.error('Invoice is still generating, please retry in a moment');
      }
    } catch (err) {
      toast.error('Could not retrieve invoice document');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Verifying confirmed transaction..." />;
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-sm text-gray-500">
          We could not locate this order session. Check your order history for confirmed orders.
        </p>
        <Link
          to="/my-orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700"
        >
          View My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Header Confirmation Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-100 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Payment Successfully Confirmed!
        </h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Thank you for your purchase. We have received your payment via Razorpay and your order is currently being processed.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs">
            <span className="text-gray-400">Order Number: </span>
            <span className="font-bold text-gray-900">{order.orderNumber}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs flex items-center gap-2">
            <span className="text-gray-400">Payment: </span>
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs flex items-center gap-2">
            <span className="text-gray-400">Order Status: </span>
            <OrderStatusBadge status={order.orderStatus} />
          </div>
        </div>
      </div>

      {/* Order Summary & Delivery Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-indigo-600" />
          <span>Items Ordered ({order.items?.length})</span>
        </h3>

        <div className="divide-y divide-gray-100">
          {order.items?.map((item) => (
            <div
              key={item._id}
              className="py-3 flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400">
                  Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <span className="font-bold text-gray-900">
                {formatPrice(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-semibold">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping Fee</span>
            <span className="font-semibold">
              {order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (GST)</span>
            <span className="font-semibold">{formatPrice(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
            <span>Total Amount Paid</span>
            <span className="text-lg text-indigo-600">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="border-t border-gray-100 pt-4 text-xs text-gray-600 space-y-1">
            <p className="font-bold text-gray-900 text-sm">Shipping Destination</p>
            <p className="font-medium text-gray-800">
              {order.shippingAddress.fullName} ({order.shippingAddress.phone})
            </p>
            <p>
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2
                ? `, ${order.shippingAddress.addressLine2}`
                : ''}
            </p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
              {order.shippingAddress.postalCode}, {order.shippingAddress.country}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleDownloadInvoice}
          loading={downloading}
          icon={FileDown}
        >
          Download Tax Invoice (PDF)
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/my-orders"
            className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Order History
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Continue Shopping</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
