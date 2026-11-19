import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../components/common/Loader';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Only block with loader if initial auth check is ongoing and user is not yet confirmed
  if (loading && !isAuthenticated) {
    return <Loader fullScreen text="Checking credentials..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
