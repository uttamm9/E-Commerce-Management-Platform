import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Package,
  Heart,
  CheckCircle,
} from 'lucide-react';
import { fetchCurrentUser } from '../../redux/slices/authSlice';
import { fetchMyOrders } from '../../redux/slices/orderSlice';
import Loader from '../../components/common/Loader';

const MyProfile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const { pagination } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchCurrentUser());
    dispatch(fetchMyOrders({ page: 1, limit: 1 }));
  }, [dispatch]);

  if (loading && !user) {
    return <Loader fullScreen text="Loading user profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-indigo-100">
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-black text-gray-900">{user?.name}</h1>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {user?.role}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">{user?.email}</p>
          <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] text-emerald-600 font-medium pt-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Account Active & Verified</span>
          </div>
        </div>

        {user?.role === 'admin' && (
          <Link
            to="/admin/dashboard"
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            Access Admin Console
          </Link>
        )}
      </div>

      {/* Account Details & Order Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            Personal & Account Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5" />
                <span>Full Name</span>
              </p>
              <p className="font-semibold text-gray-800">{user?.name || '-'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address</span>
              </p>
              <p className="font-semibold text-gray-800">{user?.email || '-'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Contact Phone</span>
              </p>
              <p className="font-semibold text-gray-800">
                {user?.phone || 'Not provided'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Assigned Role</span>
              </p>
              <p className="font-semibold text-gray-800 capitalize">
                {user?.role || 'Customer'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Nav Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            Quick Actions
          </h3>

          <div className="space-y-3">
            <Link
              to="/my-orders"
              className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-xs font-semibold text-gray-700"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-indigo-500" />
                <span>My Orders</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-gray-800 text-[11px] font-bold shadow-2xs">
                {pagination.totalRecords || 0}
              </span>
            </Link>

            <Link
              to="/wishlist"
              className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-rose-50 hover:text-rose-600 transition-colors text-xs font-semibold text-gray-700"
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>My Wishlist</span>
              </div>
            </Link>

            <Link
              to="/cart"
              className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-xs font-semibold text-gray-700"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-indigo-500" />
                <span>Shopping Cart</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
