import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, LogOut, ShieldCheck, User } from 'lucide-react';
import Sidebar from './Sidebar';
import { logout } from '../../redux/slices/authSlice';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Admin Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Open Sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[10px] text-gray-500">{user?.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
