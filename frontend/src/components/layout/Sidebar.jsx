import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Users,
  BarChart3,
  Store,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: Layers },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-gray-900 text-gray-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Admin Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              E
            </div>
            <div>
              <span className="font-bold text-white text-base">Elite Admin</span>
              <span className="block text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                Management
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Storefront Link */}
        <div className="p-4 border-t border-gray-800">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Store className="w-4 h-4 text-indigo-400" />
            <span>Customer Storefront</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
