import React, { useState, useEffect } from 'react';
import { Layers, Search, Check, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import categoryService from '../../services/categoryService';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';

const CategorySelector = ({
  value = '',
  onChange,
  error = '',
  initialCategoryObj = null,
  categories = [],
}) => {
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategories, setModalCategories] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalPagination, setModalPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 6,
  });

  // Inline Pagination State for quick-picker dropdown
  const [inlineCategories, setInlineCategories] = useState(categories || []);
  const [inlinePage, setInlinePage] = useState(1);
  const [inlineTotalPages, setInlineTotalPages] = useState(1);
  const [inlineTotalRecords, setInlineTotalRecords] = useState(categories?.length || 0);
  const [inlineLoading, setInlineLoading] = useState(false);

  // Selected Category details for visual display
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryObj || null);

  // If initialCategoryObj changes (e.g. after product load in EditProduct)
  useEffect(() => {
    if (initialCategoryObj) {
      setSelectedCategory(initialCategoryObj);
    }
  }, [initialCategoryObj]);

  // If initial categories prop changes
  useEffect(() => {
    if (categories && categories.length > 0) {
      setInlineCategories(categories);
      setInlineTotalRecords(categories.length);
      setInlineTotalPages(Math.ceil(categories.length / 10) || 1);
    }
  }, [categories]);

  // Fetch categories for inline quick selector when page changes
  const fetchInlinePage = async (page) => {
    try {
      setInlineLoading(true);
      const res = await categoryService.getCategories({
        page,
        limit: 10,
      });
      const fetched = res.data?.categories || [];
      setInlineCategories(fetched);
      if (res.data?.pagination) {
        setInlinePage(res.data.pagination.currentPage);
        setInlineTotalPages(res.data.pagination.totalPages);
        setInlineTotalRecords(res.data.pagination.totalRecords);
      }
    } catch (err) {
      // silently fallback to initial categories
    } finally {
      setInlineLoading(false);
    }
  };

  // Fetch categories for Modal (full paginated category browser)
  const fetchModalCategories = async (
    page = modalPagination.currentPage,
    limit = modalPagination.limit
  ) => {
    try {
      setModalLoading(true);
      const res = await categoryService.getCategories({
        search: modalSearch || undefined,
        page,
        limit,
      });
      setModalCategories(res.data?.categories || []);
      if (res.data?.pagination) {
        setModalPagination({
          currentPage: res.data.pagination.currentPage,
          totalPages: res.data.pagination.totalPages,
          totalRecords: res.data.pagination.totalRecords,
          limit: res.data.pagination.limit,
        });
      }
    } catch (err) {
      console.error('Failed to load categories in modal:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // When modal opens or search changes, load categories
  useEffect(() => {
    if (modalOpen) {
      fetchModalCategories(1, modalPagination.limit);
    }
  }, [modalOpen, modalSearch]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    if (onChange) {
      onChange(cat._id, cat);
    }
    // Also ensure this category is in inlineCategories so the select displays it
    setInlineCategories((prev) => {
      if (prev.some((c) => c._id === cat._id)) return prev;
      return [cat, ...prev];
    });
    setModalOpen(false);
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
    if (onChange) {
      onChange('', null);
    }
  };

  const handleDropdownChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      handleClearCategory();
      return;
    }
    const cat =
      inlineCategories.find((c) => c._id === selectedId) ||
      modalCategories.find((c) => c._id === selectedId) ||
      (selectedCategory?._id === selectedId ? selectedCategory : { _id: selectedId, name: 'Selected' });

    setSelectedCategory(cat);
    if (onChange) {
      onChange(selectedId, cat);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Category <span className="text-rose-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Browse All Categories ({inlineTotalRecords || categories.length || 0})</span>
        </button>
      </div>

      {/* Selected Category Highlight Card */}
      {selectedCategory && (
        <div className="flex items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Check className="w-3 h-3" />
            </span>
            <div>
              <span className="font-semibold text-indigo-950">
                {selectedCategory.name}
              </span>
              {selectedCategory.slug && (
                <span className="text-indigo-600 ml-1.5 font-mono text-[11px]">
                  ({selectedCategory.slug})
                </span>
              )}
            </div>
            {selectedCategory.status && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedCategory.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {selectedCategory.status}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearCategory}
            className="p-1 text-gray-400 hover:text-rose-600 rounded"
            title="Clear category"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Category Dropdown with Quick Select */}
      <div className="relative">
        <select
          name="category"
          value={value}
          onChange={handleDropdownChange}
          disabled={inlineLoading}
          className={`w-full p-2.5 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-300 focus:ring-rose-200'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
          }`}
        >
          <option value="">-- Choose Category or Browse All Below --</option>
          {selectedCategory && !inlineCategories.some((c) => c._id === selectedCategory._id) && (
            <option value={selectedCategory._id}>
              {selectedCategory.name} (Current)
            </option>
          )}
          {inlineCategories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} {c.status === 'inactive' ? '(Inactive)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Inline Pagination Toolbar */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span>Page {inlinePage} of {inlineTotalPages || 1}</span>
          {inlineTotalRecords > 0 && (
            <span className="text-gray-400">({inlineTotalRecords} total)</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fetchInlinePage(inlinePage - 1)}
            disabled={inlinePage <= 1 || inlineLoading}
            className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Previous category page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => fetchInlinePage(inlinePage + 1)}
            disabled={inlinePage >= inlineTotalPages || inlineLoading}
            className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Next category page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="ml-2 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors"
          >
            View All
          </button>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      {/* Full Paginated Category Browser Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="All Product Categories"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500">
                Browse, search, and select any category with pagination.
              </p>
            </div>

            {/* Modal Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {modalSearch && (
                <button
                  type="button"
                  onClick={() => setModalSearch('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categories Table inside Modal */}
          {modalLoading && modalCategories.length === 0 ? (
            <div className="py-12 flex justify-center">
              <Loader text="Loading categories..." />
            </div>
          ) : modalCategories.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-xs">
              No categories found matching your query.
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50/90 sticky top-0 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Category Name</th>
                      <th className="py-2.5 px-3">Slug</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {modalCategories.map((cat) => {
                      const isSelected = value === cat._id;
                      return (
                        <tr
                          key={cat._id}
                          className={`hover:bg-indigo-50/40 transition-colors ${
                            isSelected ? 'bg-indigo-50/60 font-semibold' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-gray-900">
                            {cat.name}
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                            {cat.slug}
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 max-w-xs truncate">
                            {cat.description || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                cat.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}
                            >
                              {cat.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-lg">
                                <Check className="w-3 h-3" /> Selected
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectCategory(cat)}
                                className="!py-1 !px-2.5 !text-xs"
                              >
                                Select
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal Pagination Component */}
              <Pagination
                currentPage={modalPagination.currentPage}
                totalPages={modalPagination.totalPages}
                totalRecords={modalPagination.totalRecords}
                limit={modalPagination.limit}
                onPageChange={(page) => fetchModalCategories(page, modalPagination.limit)}
                onLimitChange={(newLimit) => fetchModalCategories(1, newLimit)}
                limitOptions={[5, 6, 10, 20]}
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategorySelector;
