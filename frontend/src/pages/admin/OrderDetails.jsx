import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  FileDown,
  Truck,
  User,
  CreditCard,
  MapPin,
  Clock,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../../services/orderService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/orders/OrderStatus';
import { formatPrice } from '../../utils/formatPrice';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Status Form state
  const [orderStatus, setOrderStatus] = useState('confirmed');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrderById(id);
      const ord = res.data?.order;
      setOrder(ord);
      if (ord) {
        setOrderStatus(ord.orderStatus || 'confirmed');
        setCourierName(ord.courierName || '');
        setTrackingNumber(ord.trackingNumber || '');
      }
    } catch (err) {
      toast.error('Failed to load order details');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await orderService.updateOrderStatus(id, {
        orderStatus,
        courierName: courierName.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        note: note.trim() || undefined,
      });
      setOrder(res.data?.order);
      setNote('');
      toast.success('Order status and shipping tracking updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloading(true);
      const res = await orderService.getInvoice(id);
      if (res.data?.invoiceUrl) {
        window.open(res.data.invoiceUrl, '_blank');
      } else {
        toast.error('Invoice still generating, please retry shortly');
      }
    } catch (err) {
      toast.error('Failed to retrieve tax invoice');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading order audit records..." />;
  }

  if (!order) {
    return <p className="text-center py-20 text-gray-500">Order not found.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.orderStatus} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {order.paymentStatus === 'paid' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadInvoice}
            loading={downloading}
            icon={FileDown}
          >
            Download Tax Invoice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Order Items & Payment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Purchased Line Items ({order.items?.length})</span>
            </h3>

            <div className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <div
                  key={item._id}
                  className="py-3 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      SKU: {item.sku} • Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
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
                <span>Taxes (GST)</span>
                <span className="font-semibold">{formatPrice(order.taxAmount)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-black text-gray-900">
                <span>Total Amount</span>
                <span className="text-xl text-indigo-600">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Gateway Information */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Payment Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400">Payment Gateway</p>
                <p className="font-bold text-gray-800 capitalize mt-0.5">
                  {order.paymentMethod || 'Razorpay Standard'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Gateway Order ID</p>
                <p className="font-mono text-gray-800 mt-0.5">
                  {order.razorpayOrderId || '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Gateway Payment ID</p>
                <p className="font-mono text-gray-800 mt-0.5">
                  {order.razorpayPaymentId || '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Payment Timestamp</p>
                <p className="font-medium text-gray-800 mt-0.5">
                  {order.paidAt ? new Date(order.paidAt).toLocaleString('en-IN') : 'Unpaid'}
                </p>
              </div>
            </div>
          </div>

          {/* Status History Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Milestone Status Log</span>
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
              {order.statusHistory?.map((hist, idx) => (
                <div key={idx} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                  <p className="font-bold text-gray-900 capitalize">
                    {hist.status}
                  </p>
                  {hist.note && <p className="text-gray-500 mt-0.5">{hist.note}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(hist.updatedAt).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Customer & Status Management Form */}
        <div className="space-y-6">
          {/* Customer & Shipping Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4 text-xs">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Customer & Destination</span>
            </h3>

            <div>
              <p className="text-gray-400">Account Owner</p>
              <p className="font-semibold text-gray-900 text-sm mt-0.5">
                {order.user?.name || 'Customer'}
              </p>
              <p className="text-gray-500">{order.user?.email}</p>
              <p className="text-gray-500">{order.user?.phone}</p>
            </div>

            {order.shippingAddress && (
              <div className="border-t border-gray-100 pt-3 space-y-1">
                <p className="text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Delivery Address</span>
                </p>
                <p className="font-semibold text-gray-800">
                  {order.shippingAddress.fullName} ({order.shippingAddress.phone})
                </p>
                <p className="text-gray-600">{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p className="text-gray-600">{order.shippingAddress.addressLine2}</p>
                )}
                <p className="text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                  {order.shippingAddress.postalCode}
                </p>
              </div>
            )}
          </div>

          {/* Update Order Status Form */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Update Shipping & Fulfillment</span>
            </h3>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Fulfillment Status
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-gray-300 bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <Input
                label="Courier / Logistics Partner"
                name="courierName"
                placeholder="e.g. BlueDart Express"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
              />

              <Input
                label="Tracking / Waybill AWB"
                name="trackingNumber"
                placeholder="e.g. BLUEDART-98765432"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status Transition Note
                </label>
                <textarea
                  rows="2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Package dispatched from distribution hub..."
                  className="w-full p-2.5 text-xs rounded-lg border border-gray-300"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                loading={updating}
              >
                Apply Order Update
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
