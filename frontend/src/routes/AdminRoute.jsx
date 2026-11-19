import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../components/common/Loader';

const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Only block with loader if initial auth check is ongoing and user/role is not yet confirmed
  if (loading && (!isAuthenticated || !user)) {
    return <Loader fullScreen text="Verifying administrative privileges..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    // Customers are forbidden from admin routes, redirect to customer home
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
