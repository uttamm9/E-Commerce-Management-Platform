import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  RotateCcw,
  ShoppingCart,
  Eye,
  FileDown,
  Edit,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAllOrders, updateOrderStatus } from '../../redux/slices/orderSlice';
import orderService from '../../services/orderService';
import OrderTable from '../../components/orders/OrderTable';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { allOrders, pagination, loading } = useSelector((state) => state.orders);

  const [filters, setFilters] = useState({
    search: '',
    orderStatus: '',
    paymentStatus: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  // Quick Status Update Modal
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('confirmed');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const params = { ...filters };
    Object.keys(params).forEach((k) => {
      if (params[k] === '') delete params[k];
    });
    dispatch(fetchAllOrders(params));
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleReset = () => {
    setFilters({
      search: '',
      orderStatus: '',
      paymentStatus: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    });
  };

  const handleOpenStatusModal = (order) => {
    setStatusModalOrder(order);
    setNewStatus(order.orderStatus || 'confirmed');
    setCourierName(order.courierName || '');
    setTrackingNumber(order.trackingNumber || '');
    setStatusNote('');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!statusModalOrder) return;

    try {
      setUpdating(true);
      await dispatch(
        updateOrderStatus({
          id: statusModalOrder._id,
          statusData: {
            orderStatus: newStatus,
            courierName: courierName.trim() || undefined,
            trackingNumber: trackingNumber.trim() || undefined,
            note: statusNote.trim() || undefined,
          },
        })
      ).unwrap();

      toast.success(`Order #${statusModalOrder.orderNumber} status updated to ${newStatus}`);
      setStatusModalOrder(null);
    } catch (err) {
      toast.error(err || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async (order) => {
    try {
      const res = await orderService.getInvoice(order._id);
      if (res.data?.invoiceUrl) {
        window.open(res.data.invoiceUrl, '_blank');
      } else {
        toast.error('Invoice still generating, please retry in a moment');
      }
    } catch (err) {
      toast.error('Failed to retrieve tax invoice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Admin Order Management
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Review customer purchases, update delivery tracking milestones, and inspect invoices.
        </p>
      </div>

      {/* Filter Ribbon */}
      <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Order Number */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search order # (e.g. ORD-...)"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Order Status */}
        <select
          name="orderStatus"
          value={filters.orderStatus}
          onChange={handleFilterChange}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Fulfillment Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="on_hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Payment Status */}
        <select
          name="paymentStatus"
          value={filters.paymentStatus}
          onChange={handleFilterChange}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        {/* Start Date */}
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none"
          title="Filter from Date"
        />

        {/* End Date */}
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none"
          title="Filter to Date"
        />

        <button
          type="button"
          onClick={handleReset}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Reset filters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Orders Table */}
      {loading && allOrders.length === 0 ? (
        <Loader fullScreen text="Loading system orders..." />
      ) : (
        <>
          <OrderTable
            orders={allOrders}
            isAdmin={true}
            onViewDetails={(order) => navigate(`/admin/orders/${order._id}`)}
            onDownloadInvoice={handleDownloadInvoice}
          />

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            limit={pagination.limit}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}

      {/* Quick Status Modal */}
      {statusModalOrder && (
        <Modal
          isOpen={!!statusModalOrder}
          onClose={() => setStatusModalOrder(null)}
          title={`Update Status: #${statusModalOrder.orderNumber}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Order Fulfillment Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
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
              label="Courier Name (Optional)"
              name="courierName"
              placeholder="e.g. BlueDart, Delhivery, FedEx"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
            />

            <Input
              label="Tracking Number / AWB (Optional)"
              name="trackingNumber"
              placeholder="e.g. BLUEDART-12345678"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Milestone Note (Optional)
              </label>
              <textarea
                rows="2"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Dispatched from warehouse..."
                className="w-full p-2.5 text-xs rounded-lg border border-gray-300"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStatusModalOrder(null)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={updating}>
                Save Updates
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
