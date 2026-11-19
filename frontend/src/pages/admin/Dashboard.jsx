import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Eye,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import Loader from '../../components/common/Loader';
import { formatPrice } from '../../utils/formatPrice';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/orders/OrderStatus';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [statsRes, salesRes, prodRes, catRes] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getSalesAnalytics({ period }),
          dashboardService.getTopProducts({ limit: 5 }),
          dashboardService.getTopCategories({ limit: 5 }),
        ]);

        setStats(statsRes.data);
        setSalesData(salesRes.data);
        setTopProducts(prodRes.data?.products || []);
        setTopCategories(catRes.data?.categories || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [period]);

  if (loading && !stats) {
    return (
      <div className="min-h-[420px] rounded-3xl border border-gray-100 bg-white shadow-xs flex items-center justify-center">
        <Loader size="lg" text="Compiling admin sales analytics..." />
      </div>
    );
  }

  const customers = stats?.customers || {};
  const products = stats?.products || {};
  const orders = stats?.orders || {};
  const revenue = stats?.revenue || {};
  const recentOrders = stats?.recentOrders || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Dashboard & Sales Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time business performance, inventory health, and revenue analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/reports"
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Detailed Reports & CSV
          </Link>
          <Link
            to="/admin/products/add"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Total Paid Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">
            {formatPrice(revenue.total || 0)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
            <span>Today: {formatPrice(revenue.today || 0)}</span>
            <span>This Month: {formatPrice(revenue.thisMonth || 0)}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">
            {orders.total || 0}
          </p>
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
            <span>Paid: {orders.byPaymentStatus?.paid || 0}</span>
            <span>Pending: {orders.byPaymentStatus?.pending || 0}</span>
          </div>
        </div>

        {/* Active Products */}
        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Catalog Products</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">
            {products.total || 0}
          </p>
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
            <span className="text-emerald-600 font-medium">In Stock: {products.inStock || 0}</span>
            <span className="text-rose-600 font-medium">Out: {products.outOfStock || 0}</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Total Customers</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">
            {customers.total || 0}
          </p>
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
            <span>Active: {customers.active || 0}</span>
            <span>New (30d): {customers.newLast30Days || 0}</span>
          </div>
        </div>
      </div>

      {/* Sales Analytics Chart/Table Section */}
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Sales Trends & Volume</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Group by:</span>
            <div className="inline-flex rounded-xl bg-gray-100 p-1 text-xs">
              {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                    period === p
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Metric Ribbon */}
        {salesData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50 text-xs">
            <div>
              <p className="text-gray-400">Total Revenue</p>
              <p className="text-base font-bold text-gray-900">
                {formatPrice(salesData.totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Total Paid Orders</p>
              <p className="text-base font-bold text-gray-900">
                {salesData.totalOrders}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Items Sold</p>
              <p className="text-base font-bold text-gray-900">
                {salesData.totalItemsSold}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Avg. Order Value (AOV)</p>
              <p className="text-base font-bold text-indigo-600">
                {formatPrice(salesData.averageOrderValue)}
              </p>
            </div>
          </div>
        )}

        {/* Breakdown Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Date / Period</th>
                <th className="py-2.5 px-3">Paid Orders</th>
                <th className="py-2.5 px-3">Items Sold</th>
                <th className="py-2.5 px-3 text-right">Revenue (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salesData?.sales?.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-gray-400">
                    No sales recorded for this period.
                  </td>
                </tr>
              ) : (
                salesData?.sales?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-semibold text-gray-800">
                      {item.date}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{item.orders}</td>
                    <td className="py-2.5 px-3 text-gray-600">{item.itemsSold}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900 text-right">
                      {formatPrice(item.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products & Top Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            Top-Selling Products
          </h3>
          <div className="divide-y divide-gray-100">
            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No sales data yet.</p>
            ) : (
              topProducts.map((p) => (
                <div
                  key={p.productId || p._id}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="pr-4">
                    <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                    <p className="text-gray-400 mt-0.5">
                      SKU: {p.sku} • Stock: {p.currentStock ?? '-'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-indigo-600">
                      {formatPrice(p.revenue)}
                    </p>
                    <p className="text-gray-400">{p.quantitySold} units sold</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            Best-Selling Categories
          </h3>
          <div className="divide-y divide-gray-100">
            {topCategories.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No category sales data yet.</p>
            ) : (
              topCategories.map((c) => (
                <div
                  key={c.categoryId || c._id}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-gray-400">{c.ordersCount} distinct orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">
                      {formatPrice(c.revenue)}
                    </p>
                    <p className="text-gray-400">{c.quantitySold} items</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900">Recent Customer Orders</h3>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Order Number</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Fulfillment</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-gray-400">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-semibold text-gray-900">
                      {ord.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">
                      {ord.user?.name || 'Customer'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">
                      {formatPrice(ord.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3">
                      <PaymentStatusBadge status={ord.paymentStatus} />
                    </td>
                    <td className="py-2.5 px-3">
                      <OrderStatusBadge status={ord.orderStatus} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/admin/orders/${ord._id}`}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
