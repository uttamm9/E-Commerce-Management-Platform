import React, { useEffect, useState } from 'react';
import {
  FileText,
  FileDown,
  TrendingUp,
  Package,
  ShoppingCart,
  Filter,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dashboardService from '../../services/dashboardService';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { formatPrice } from '../../utils/formatPrice';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/orders/OrderStatus';
import { AVAILABILITY_COLORS, AVAILABILITY_LABELS } from '../../utils/constants';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'orders', 'inventory'
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 1. Sales Report State
  const [salesFilters, setSalesFilters] = useState({
    period: 'daily',
    startDate: '',
    endDate: '',
  });
  const [salesReport, setSalesReport] = useState(null);

  // 2. Orders Report State
  const [orderFilters, setOrderFilters] = useState({
    startDate: '',
    endDate: '',
    orderStatus: '',
    paymentStatus: '',
    page: 1,
    limit: 10,
  });
  const [orderReport, setOrderReport] = useState(null);

  // 3. Inventory Report State
  const [inventoryFilters, setInventoryFilters] = useState({
    status: 'all',
    page: 1,
    limit: 10,
  });
  const [inventoryReport, setInventoryReport] = useState(null);

  // Trigger data fetching based on active tab
  useEffect(() => {
    if (activeTab === 'sales') {
      fetchSalesReport();
    } else if (activeTab === 'orders') {
      fetchOrdersReport();
    } else if (activeTab === 'inventory') {
      fetchInventoryReport();
    }
  }, [activeTab, salesFilters, orderFilters, inventoryFilters]);

  // Fetch Sales Report
  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const params = {
        period: salesFilters.period,
        startDate: salesFilters.startDate || undefined,
        endDate: salesFilters.endDate || undefined,
      };
      const res = await dashboardService.getSalesReport(params);
      setSalesReport(res.data);
    } catch (err) {
      toast.error('Failed to generate sales report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Orders Report
  const fetchOrdersReport = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: orderFilters.startDate || undefined,
        endDate: orderFilters.endDate || undefined,
        orderStatus: orderFilters.orderStatus || undefined,
        paymentStatus: orderFilters.paymentStatus || undefined,
        page: orderFilters.page,
        limit: orderFilters.limit,
      };
      const res = await dashboardService.getOrderReport(params);
      setOrderReport(res.data);
    } catch (err) {
      toast.error('Failed to generate order report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Inventory Report
  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const params = {
        status: inventoryFilters.status !== 'all' ? inventoryFilters.status : undefined,
        page: inventoryFilters.page,
        limit: inventoryFilters.limit,
      };
      const res = await dashboardService.getInventoryReport(params);
      setInventoryReport(res.data);
    } catch (err) {
      toast.error('Failed to generate inventory report');
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger browser CSV file download from Blob
  const downloadBlob = (blobData, defaultFilename) => {
    const url = window.URL.createObjectURL(new Blob([blobData]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  // Export Sales CSV
  const handleExportSalesCSV = async () => {
    try {
      setExporting(true);
      const params = {
        period: salesFilters.period,
        startDate: salesFilters.startDate || undefined,
        endDate: salesFilters.endDate || undefined,
      };
      const blob = await dashboardService.exportSalesReportCSV(params);
      downloadBlob(blob, `sales-report-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Sales report exported to CSV');
    } catch (err) {
      toast.error('Failed to export sales report');
    } finally {
      setExporting(false);
    }
  };

  // Export Orders CSV
  const handleExportOrdersCSV = async () => {
    try {
      setExporting(true);
      const params = {
        startDate: orderFilters.startDate || undefined,
        endDate: orderFilters.endDate || undefined,
        orderStatus: orderFilters.orderStatus || undefined,
        paymentStatus: orderFilters.paymentStatus || undefined,
      };
      const blob = await dashboardService.exportOrderReportCSV(params);
      downloadBlob(blob, `orders-report-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Orders report exported to CSV');
    } catch (err) {
      toast.error('Failed to export order report');
    } finally {
      setExporting(false);
    }
  };

  // Export Inventory CSV
  const handleExportInventoryCSV = async () => {
    try {
      setExporting(true);
      const params = {
        status: inventoryFilters.status !== 'all' ? inventoryFilters.status : undefined,
      };
      const blob = await dashboardService.exportInventoryReportCSV(params);
      downloadBlob(blob, `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Inventory report exported to CSV');
    } catch (err) {
      toast.error('Failed to export inventory report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Business Reports & Data Export
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Generate audit-ready analytical reports and export raw datasets in RFC 4180 CSV format.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
            activeTab === 'sales'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales Performance Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
            activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Order Audit Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
            activeTab === 'inventory'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventory & Stock Report</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. SALES REPORT TAB */}
      {/* ======================================================== */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={salesFilters.period}
                onChange={(e) =>
                  setSalesFilters((prev) => ({ ...prev, period: e.target.value }))
                }
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
              >
                <option value="daily">Daily Breakdown</option>
                <option value="weekly">Weekly Breakdown</option>
                <option value="monthly">Monthly Breakdown</option>
                <option value="yearly">Yearly Breakdown</option>
              </select>

              <input
                type="date"
                value={salesFilters.startDate}
                onChange={(e) =>
                  setSalesFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                title="Start Date"
              />

              <input
                type="date"
                value={salesFilters.endDate}
                onChange={(e) =>
                  setSalesFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                title="End Date"
              />

              {(salesFilters.startDate || salesFilters.endDate) && (
                <button
                  type="button"
                  onClick={() =>
                    setSalesFilters((prev) => ({
                      ...prev,
                      startDate: '',
                      endDate: '',
                    }))
                  }
                  className="p-1.5 text-gray-500 hover:text-indigo-600"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSalesCSV}
              loading={exporting}
              icon={FileDown}
            >
              Export CSV File
            </Button>
          </div>

          {/* Metrics Ribbon */}
          {salesReport && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-3xl bg-white border border-gray-100 shadow-xs text-xs">
              <div>
                <p className="text-gray-400">Total Net Revenue</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {formatPrice(salesReport.summary?.totalRevenue || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Paid Orders</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {salesReport.summary?.totalPaidOrders || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Items Sold</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {salesReport.summary?.totalItemsSold || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Average Order Value</p>
                <p className="text-xl font-bold text-indigo-600 mt-1">
                  {formatPrice(salesReport.summary?.averageOrderValue || 0)}
                </p>
              </div>
            </div>
          )}

          {/* Records Table */}
          {loading ? (
            <Loader text="Generating sales report..." />
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date / Period</th>
                    <th className="py-3 px-4">Orders</th>
                    <th className="py-3 px-4">Items Sold</th>
                    <th className="py-3 px-4 text-right">Revenue (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salesReport?.records?.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-400">
                        No sales data found for the selected time range.
                      </td>
                    </tr>
                  ) : (
                    salesReport?.records?.map((rec, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {rec.date}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{rec.orders}</td>
                        <td className="py-3 px-4 text-gray-600">{rec.itemsSold}</td>
                        <td className="py-3 px-4 font-bold text-gray-900 text-right">
                          {formatPrice(rec.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ORDERS REPORT TAB */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={orderFilters.orderStatus}
                onChange={(e) =>
                  setOrderFilters((prev) => ({
                    ...prev,
                    orderStatus: e.target.value,
                    page: 1,
                  }))
                }
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
              >
                <option value="">All Fulfillment</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={orderFilters.paymentStatus}
                onChange={(e) =>
                  setOrderFilters((prev) => ({
                    ...prev,
                    paymentStatus: e.target.value,
                    page: 1,
                  }))
                }
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
              >
                <option value="">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <input
                type="date"
                value={orderFilters.startDate}
                onChange={(e) =>
                  setOrderFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    page: 1,
                  }))
                }
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                title="Start Date"
              />

              <input
                type="date"
                value={orderFilters.endDate}
                onChange={(e) =>
                  setOrderFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                    page: 1,
                  }))
                }
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                title="End Date"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportOrdersCSV}
              loading={exporting}
              icon={FileDown}
            >
              Export CSV File
            </Button>
          </div>

          {/* Metrics */}
          {orderReport && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-3xl bg-white border border-gray-100 shadow-xs text-xs">
              <div>
                <p className="text-gray-400">Total Filtered Orders</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {orderReport.summary?.totalOrders || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Order Volume</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {formatPrice(orderReport.summary?.totalAmount || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Paid Revenue Captured</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {formatPrice(orderReport.summary?.paidRevenue || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Paid Orders Count</p>
                <p className="text-xl font-bold text-indigo-600 mt-1">
                  {orderReport.summary?.paidOrdersCount || 0}
                </p>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <Loader text="Generating order audit report..." />
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderReport?.orders?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-400">
                        No orders match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    orderReport?.orders?.map((ord) => (
                      <tr key={ord._id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {ord.user?.name || ord.shippingAddress?.fullName || 'Customer'}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {formatPrice(ord.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <PaymentStatusBadge status={ord.paymentStatus} />
                        </td>
                        <td className="py-3 px-4">
                          <OrderStatusBadge status={ord.orderStatus} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {orderReport?.pagination && (
                <Pagination
                  currentPage={orderReport.pagination.currentPage}
                  totalPages={orderReport.pagination.totalPages}
                  totalRecords={orderReport.pagination.totalRecords}
                  limit={orderReport.pagination.limit}
                  onPageChange={(page) =>
                    setOrderFilters((prev) => ({ ...prev, page }))
                  }
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. INVENTORY REPORT TAB */}
      {/* ======================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={inventoryFilters.status}
                onChange={(e) =>
                  setInventoryFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                    page: 1,
                  }))
                }
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
              >
                <option value="all">All Inventory Levels</option>
                <option value="in_stock">In Stock (&gt; Threshold)</option>
                <option value="low_stock">Low Stock (≤ Threshold)</option>
                <option value="out_of_stock">Out of Stock (0 units)</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportInventoryCSV}
              loading={exporting}
              icon={FileDown}
            >
              Export CSV File
            </Button>
          </div>

          {/* Metrics */}
          {inventoryReport && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-3xl bg-white border border-gray-100 shadow-xs text-xs">
              <div>
                <p className="text-gray-400">Total Catalog Products</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {inventoryReport.summary?.totalProducts || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Healthy Stock</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {inventoryReport.summary?.inStockCount || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Low Stock Alert (&le;5)</p>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {inventoryReport.summary?.lowStockCount || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Out of Stock (0)</p>
                <p className="text-xl font-bold text-rose-600 mt-1">
                  {inventoryReport.summary?.outOfStockCount || 0}
                </p>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <Loader text="Compiling inventory levels..." />
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Threshold</th>
                    <th className="py-3 px-4">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventoryReport?.products?.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-400">
                        No products match this stock criterion.
                      </td>
                    </tr>
                  ) : (
                    inventoryReport?.products?.map((prod) => (
                      <tr key={prod._id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {prod.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {prod.sku}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {prod.category?.name || '-'}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {formatPrice(prod.discountPrice || prod.price)}
                        </td>
                        <td className="py-3 px-4 font-black">
                          {prod.stock}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {prod.lowStockThreshold}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              AVAILABILITY_COLORS[prod.availability] || 'bg-gray-100'
                            }`}
                          >
                            {AVAILABILITY_LABELS[prod.availability] || prod.availability}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {inventoryReport?.pagination && (
                <Pagination
                  currentPage={inventoryReport.pagination.currentPage}
                  totalPages={inventoryReport.pagination.totalPages}
                  totalRecords={inventoryReport.pagination.totalRecords}
                  limit={inventoryReport.pagination.limit}
                  onPageChange={(page) =>
                    setInventoryFilters((prev) => ({ ...prev, page }))
                  }
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
