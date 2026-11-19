import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

// Public & Customer Pages
import Home from '../pages/shop/Home';
import ProductList from '../pages/shop/ProductList';
import ProductDetails from '../pages/shop/ProductDetails';
import Cart from '../pages/shop/Cart';
import Wishlist from '../pages/shop/Wishlist';
import Checkout from '../pages/shop/Checkout';
import PaymentSuccess from '../pages/shop/PaymentSuccess';
import MyOrders from '../pages/shop/MyOrders';
import MyProfile from '../pages/profile/MyProfile';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import NotFound from '../pages/NotFound';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminProducts from '../pages/admin/Products';
import AdminAddProduct from '../pages/admin/AddProduct';
import AdminEditProduct from '../pages/admin/EditProduct';
import AdminCategories from '../pages/admin/Categories';
import AdminOrders from '../pages/admin/Orders';
import AdminOrderDetails from '../pages/admin/OrderDetails';
import AdminCustomers from '../pages/admin/Customers';
import AdminReports from '../pages/admin/Reports';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Customer & Public Routes wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        {/* Public Storefront */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer Protected Pages */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/profile" element={<MyProfile />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin Protected Routes wrapped in AdminRoute and AdminLayout */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/add" element={<AdminAddProduct />} />
          <Route path="products/edit/:id" element={<AdminEditProduct />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetails />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
