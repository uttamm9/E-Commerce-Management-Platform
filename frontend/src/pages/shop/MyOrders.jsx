import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Package, Truck, FileDown, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMyOrders } from '../../redux/slices/orderSlice';
import orderService from '../../services/orderService';
import OrderTable from '../../components/orders/OrderTable';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/orders/OrderStatus';
import { formatPrice } from '../../utils/formatPrice';

const MyOrders = () => {
  const dispatch = useDispatch();
  const { myOrders, pagination, loading } = useSelector((state) => state.orders);

  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchMyOrders({ page, limit: 10 }));
  }, [dispatch, page]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleTrackOrder = async (order) => {
    try {
      setTrackingLoading(true);
      setTrackingModalOpen(true);
      const res = await orderService.getOrderTracking(order._id);
      setTrackingData(res.data);
    } catch (err) {
      toast.error('Could not fetch tracking data');
      setTrackingModalOpen(false);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleDownloadInvoice = async (order) => {
    try {
      const res = await orderService.getInvoice(order._id);
      if (res.data?.invoiceUrl) {
        window.open(res.data.invoiceUrl, '_blank');
      } else {
        toast.error('Invoice is still generating, please retry shortly');
      }
    } catch (err) {
      toast.error('Failed to retrieve tax invoice');
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          My Order History
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Track shipments, review past orders, and download verified tax invoices.
        </p>
      </div>

      {loading && myOrders.length === 0 ? (
        <Loader fullScreen text="Loading your orders..." />
      ) : (
        <>
          <OrderTable
            orders={myOrders}
            isAdmin={false}
            onViewDetails={handleViewDetails}
            onTrackOrder={handleTrackOrder}
            onDownloadInvoice={handleDownloadInvoice}
          />

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            limit={pagination.limit}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.orderNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 text-xs">
              <div>
                <p className="text-gray-400">Order Placed</p>
                <p className="font-semibold text-gray-900">
                  {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Payment Status</p>
                <PaymentStatusBadge status={selectedOrder.paymentStatus} />
              </div>
              <div>
                <p className="text-gray-400">Fulfillment Status</p>
                <OrderStatusBadge status={selectedOrder.orderStatus} />
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Order Items ({selectedOrder.items?.length})
              </h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl p-3">
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item._id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-gray-400">
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="p-4 rounded-xl bg-gray-50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-semibold">{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping Fee:</span>
                <span className="font-semibold">
                  {selectedOrder.shippingFee === 0 ? 'FREE' : formatPrice(selectedOrder.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taxes (GST):</span>
                <span className="font-semibold">{formatPrice(selectedOrder.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 text-gray-900">
                <span>Total Amount:</span>
                <span className="text-indigo-600">{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Shipping Info */}
            {selectedOrder.shippingAddress && (
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-900 text-sm">Delivery Address</p>
                <p className="font-medium text-gray-800">
                  {selectedOrder.shippingAddress.fullName} ({selectedOrder.shippingAddress.phone})
                </p>
                <p>{selectedOrder.shippingAddress.addressLine1}</p>
                <p>
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} -{' '}
                  {selectedOrder.shippingAddress.postalCode}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Tracking Modal */}
      {trackingModalOpen && (
        <Modal
          isOpen={trackingModalOpen}
          onClose={() => setTrackingModalOpen(false)}
          title="Shipment Delivery Tracking"
          maxWidth="max-w-md"
        >
          {trackingLoading ? (
            <Loader text="Fetching shipment progress..." />
          ) : !trackingData ? (
            <p className="text-sm text-gray-500">No tracking details available.</p>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-700 font-medium">Carrier</p>
                  <p className="font-bold text-indigo-950 text-sm">
                    {trackingData.courierName || 'Standard Express'}
                  </p>
                </div>
                {trackingData.trackingNumber && (
                  <div className="text-right">
                    <p className="text-xs text-indigo-700 font-medium">Waybill #</p>
                    <p className="font-mono text-xs font-bold text-indigo-950">
                      {trackingData.trackingNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Milestone Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Tracking Milestones
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
                  {trackingData.history && trackingData.history.length > 0 ? (
                    trackingData.history.map((hist, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                        <div className="text-xs">
                          <span className="font-bold text-gray-900 capitalize">
                            {hist.status}
                          </span>
                          {hist.note && (
                            <p className="text-gray-500 mt-0.5">{hist.note}</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(hist.updatedAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                      <p className="text-xs text-gray-600">
                        Current Status: <span className="font-bold capitalize">{trackingData.currentStatus}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default MyOrders;
