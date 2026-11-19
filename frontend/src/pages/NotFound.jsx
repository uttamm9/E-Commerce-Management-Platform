import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-4xl mb-6 shadow-xs">
        404
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        The link you followed may be broken, or the page may have been relocated.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
};

export default NotFound;
