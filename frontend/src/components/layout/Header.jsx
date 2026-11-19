import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShoppingBag,
  Heart,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  PackageCheck,
  UserCheck,
} from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const cartCount = cart?.totalItems || 0;
  const wishlistCount = wishlist?.products?.length || 0;
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    dispatch(logout());
    setUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-100">
                E
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-800 bg-clip-text text-transparent">
                EliteStore
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/products"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
              >
                All Products
              </Link>
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User Dropdown / Auth Links */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline-block text-sm font-medium max-w-[120px] truncate">
                    {user?.name}
                  </span>
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-gray-100 py-1 z-40 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.email}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                          {user?.role}
                        </span>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Console
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-gray-400" />
                        My Profile
                      </Link>

                      <Link
                        to="/my-orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <PackageCheck className="w-4 h-4 text-gray-400" />
                        My Orders
                      </Link>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors px-3 py-1.5"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-xs transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Home
          </Link>
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            All Products
          </Link>
          <Link
            to="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Wishlist ({wishlistCount})
          </Link>
          <Link
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Shopping Cart ({cartCount})
          </Link>
          {!isAuthenticated ? (
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-100 space-y-1">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                My Profile
              </Link>
              <Link
                to="/my-orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                My Orders
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  Admin Console
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
