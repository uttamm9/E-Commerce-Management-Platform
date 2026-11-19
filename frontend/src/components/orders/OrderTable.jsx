import React from 'react';
import { Eye, FileDown, Truck } from 'lucide-react';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatus';
import { formatPrice } from '../../utils/formatPrice';

const OrderTable = ({
  orders = [],
  isAdmin = false,
  onViewDetails,
  onDownloadInvoice,
  onTrackOrder,
}) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <p className="text-gray-500 text-sm">No orders found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Order #</th>
              <th className="py-3.5 px-4">Date</th>
              {isAdmin && <th className="py-3.5 px-4">Customer</th>}
              <th className="py-3.5 px-4">Items</th>
              <th className="py-3.5 px-4">Total</th>
              <th className="py-3.5 px-4">Payment</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {orders.map((order) => {
              const itemsCount = (order.items || []).reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              const orderDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '-';

              return (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">
                    {orderDate}
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-gray-900 text-xs">
                        {order.user?.name || order.shippingAddress?.fullName || 'Customer'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {order.user?.email || ''}
                      </p>
                    </td>
                  )}
                  <td className="py-3.5 px-4 text-gray-600 text-xs">
                    {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="py-3.5 px-4">
                    <OrderStatusBadge status={order.orderStatus} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onViewDetails && (
                        <button
                          type="button"
                          onClick={() => onViewDetails(order)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View order details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {onTrackOrder && (
                        <button
                          type="button"
                          onClick={() => onTrackOrder(order)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Track delivery status"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}

                      {onDownloadInvoice && order.paymentStatus === 'paid' && (
                        <button
                          type="button"
                          onClick={() => onDownloadInvoice(order)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Download Tax Invoice"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
