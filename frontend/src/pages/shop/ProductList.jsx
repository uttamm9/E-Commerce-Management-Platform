import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../../redux/slices/productSlice';
import ProductCard from '../../components/products/ProductCard';
import ProductFilters from '../../components/products/ProductFilters';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import { PackageX } from 'lucide-react';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const { products, pagination, categories, loading, error } = useSelector(
    (state) => state.products
  );

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    order: searchParams.get('order') || 'desc',
    page: parseInt(searchParams.get('page'), 10) || 1,
    limit: 12,
  });

  useEffect(() => {
    dispatch(fetchCategories({ status: 'active' }));
  }, [dispatch]);

  useEffect(() => {
    // Build query params
    const queryParams = { ...filters };
    Object.keys(queryParams).forEach((k) => {
      if (queryParams[k] === '' || queryParams[k] === null || queryParams[k] === undefined) {
        delete queryParams[k];
      }
    });

    dispatch(fetchProducts(queryParams));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);

    // Update browser URL query params
    const params = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.minPrice) params.minPrice = newFilters.minPrice;
    if (newFilters.maxPrice) params.maxPrice = newFilters.maxPrice;
    if (newFilters.sortBy) params.sortBy = newFilters.sortBy;
    if (newFilters.order) params.order = newFilters.order;
    if (newFilters.page > 1) params.page = newFilters.page;

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdAt',
      order: 'desc',
      page: 1,
      limit: 12,
    };
    setFilters(defaultFilters);
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    handleFilterChange({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumbs */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Explore All Products
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Showing authentic high-grade products curated directly from our official catalog.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <ProductFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        onReset={handleResetFilters}
      />

      {/* Content Area */}
      {loading ? (
        <Loader size="lg" text="Loading product inventory..." />
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-700">
          <p className="font-semibold text-sm">{error}</p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-3 text-xs underline font-medium text-rose-800"
          >
            Clear filters and reload
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-2xs space-y-3">
          <PackageX className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No products match your criteria</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your search terms, changing the category, or clearing the price filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-2 inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ProductList;
