import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import { fetchCart } from '../../redux/slices/cartSlice';
import { fetchWishlist } from '../../redux/slices/wishlistSlice';

const MainLayout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Sync cart & wishlist upon mounting if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
