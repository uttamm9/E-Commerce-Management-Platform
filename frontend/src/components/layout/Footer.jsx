import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, Headphones } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      {/* Value Proposition Highlights */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="p-3 rounded-xl bg-gray-800 text-indigo-400">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Free Fast Shipping</h4>
                <p className="text-xs text-gray-400">On all orders above ₹1,000</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="p-3 rounded-xl bg-gray-800 text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Secure Payments</h4>
                <p className="text-xs text-gray-400">Protected with Razorpay & SSL</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="p-3 rounded-xl bg-gray-800 text-indigo-400">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Easy Returns</h4>
                <p className="text-xs text-gray-400">Hassle-free 7-day replacement</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="p-3 rounded-xl bg-gray-800 text-indigo-400">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">24/7 Dedicated Support</h4>
                <p className="text-xs text-gray-400">Live chat & ticket support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="font-extrabold text-lg text-white">EliteStore</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your premium destination for authentic electronics, apparel, and lifestyle accessories. Engineered with precision on the MERN stack.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Explore
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white transition-colors">
                  My Wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Customer Account
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/profile" className="hover:text-white transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/my-orders" className="hover:text-white transition-colors">
                  Order Tracking & History
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Create New Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Compliance */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Platform & Security
            </h5>
            <p className="text-xs text-gray-400 mb-3">
              Payment verification powered by Razorpay Test API. Invoices stored on Amazon S3.
            </p>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <span>● Razorpay Verified Gateway</span>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} EliteStore E-Commerce Management Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Terms of Service</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
