import React, { useEffect, useState } from 'react';
import {
  Search,
  RotateCcw,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dashboardService from '../../services/dashboardService';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loader from '../../components/common/Loader';
import { formatPrice } from '../../utils/formatPrice';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    page: 1,
    limit: 10,
  });

  // Customer Detail View Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status Change Dialog
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchCustomersList = async () => {
    try {
      setLoading(true);
      const params = {
        search: filters.search || undefined,
        isActive: filters.isActive !== '' ? filters.isActive : undefined,
        page: filters.page,
        limit: filters.limit,
      };
      const res = await dashboardService.getCustomers(params);
      setCustomers(res.data?.customers || []);
      setPagination(res.data?.pagination || pagination);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersList();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleReset = () => {
    setFilters({ search: '', isActive: '', page: 1, limit: 10 });
  };

  const handleViewCustomer = async (cust) => {
    try {
      setSelectedCustomerId(cust._id);
      setDetailLoading(true);
      const res = await dashboardService.getCustomerById(cust._id);
      setCustomerDetail(res.data);
    } catch (err) {
      toast.error('Failed to load customer profile details');
      setSelectedCustomerId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    try {
      setStatusUpdating(true);
      const newActive = !statusTarget.isActive;
      await dashboardService.updateCustomerStatus(statusTarget._id, newActive);
      toast.success(
        `Customer account ${newActive ? 'activated' : 'deactivated'} successfully`
      );
      setStatusTarget(null);
      fetchCustomersList();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to update customer account status'
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Customer Management
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Review customer accounts, analyze spend records, and manage access authorization.
        </p>
      </div>

      {/* Filter Ribbon */}
      <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search customers by name, email, phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <select
          name="isActive"
          value={filters.isActive}
          onChange={handleFilterChange}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Account Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Deactivated Only</option>
        </select>

        <button
          type="button"
          onClick={handleReset}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Reset filters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Customers Table */}
      {loading && customers.length === 0 ? (
        <Loader fullScreen text="Loading registered customers..." />
      ) : customers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 space-y-3">
          <Users className="w-10 h-10 text-gray-400 mx-auto" />
          <p className="text-sm font-semibold text-gray-700">No customers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900">{cust.name}</p>
                      <p className="text-[11px] text-gray-400">{cust.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {cust.phone || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {cust.createdAt
                        ? new Date(cust.createdAt).toLocaleDateString('en-IN')
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {cust.metrics?.totalOrders || 0}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {formatPrice(cust.metrics?.totalSpent || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          cust.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {cust.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewCustomer(cust)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Customer Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusTarget(cust)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            cust.isActive
                              ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={
                            cust.isActive
                              ? 'Deactivate Account'
                              : 'Activate Account'
                          }
                        >
                          {cust.isActive ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            limit={pagination.limit}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </div>
      )}

      {/* Customer Profile Details Modal */}
      {selectedCustomerId && (
        <Modal
          isOpen={!!selectedCustomerId}
          onClose={() => {
            setSelectedCustomerId(null);
            setCustomerDetail(null);
          }}
          title="Customer Profile & Order History"
          maxWidth="max-w-2xl"
        >
          {detailLoading || !customerDetail ? (
            <Loader text="Loading customer details..." />
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-gray-900">
                    {customerDetail.customer?.name}
                  </h4>
                  <p className="text-xs text-gray-500">{customerDetail.customer?.email}</p>
                  <p className="text-xs text-gray-500">{customerDetail.customer?.phone}</p>
                </div>
                <div className="text-right text-xs">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      customerDetail.customer?.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {customerDetail.customer?.isActive ? 'Active' : 'Deactivated'}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Joined: {new Date(customerDetail.customer?.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center text-xs">
                <div>
                  <p className="text-gray-500">Total Orders</p>
                  <p className="text-base font-bold text-indigo-950">
                    {customerDetail.customer?.stats?.totalOrders || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Paid Orders</p>
                  <p className="text-base font-bold text-indigo-950">
                    {customerDetail.customer?.stats?.paidOrders || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Lifetime Paid Spend</p>
                  <p className="text-base font-bold text-emerald-600">
                    {formatPrice(customerDetail.customer?.stats?.totalSpent || 0)}
                  </p>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Recent Customer Orders</span>
                </h4>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {customerDetail.recentOrders?.length === 0 ? (
                    <p className="py-4 text-center text-xs text-gray-400">
                      No order history for this customer.
                    </p>
                  ) : (
                    customerDetail.recentOrders?.map((ord) => (
                      <div
                        key={ord._id}
                        className="p-3 flex items-center justify-between text-xs hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{ord.orderNumber}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatPrice(ord.totalAmount)}
                          </p>
                          <span className="text-[10px] uppercase font-semibold text-indigo-600">
                            {ord.orderStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Account Status Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleToggleStatus}
        title={
          statusTarget?.isActive
            ? 'Deactivate Customer Account'
            : 'Reactivate Customer Account'
        }
        message={`Are you sure you want to ${
          statusTarget?.isActive ? 'deactivate' : 'reactivate'
        } ${statusTarget?.name}'s customer account?`}
        confirmText={statusTarget?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={statusTarget?.isActive ? 'danger' : 'success'}
        loading={statusUpdating}
      />
    </div>
  );
};

export default Customers;
