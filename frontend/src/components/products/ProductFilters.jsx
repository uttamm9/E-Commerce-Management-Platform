import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import Button from '../common/Button';

const ProductFilters = ({
  filters,
  onFilterChange,
  categories = [],
  onReset,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value, page: 1 });
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs mb-8 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Filter & Search</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              name="search"
              value={filters.search || ''}
              onChange={handleChange}
              placeholder="Search by name, brand..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            name="category"
            value={filters.category || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Price Range (₹)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice || ''}
              onChange={handleChange}
              placeholder="Min"
              min="0"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice || ''}
              onChange={handleChange}
              placeholder="Max"
              min="0"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            name="sortByOption"
            value={`${filters.sortBy || 'createdAt'}-${filters.order || 'desc'}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-');
              onFilterChange({ ...filters, sortBy, order, page: 1 });
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
