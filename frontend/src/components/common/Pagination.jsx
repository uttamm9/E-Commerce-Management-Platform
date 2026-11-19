import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalRecords = 0,
  limit = 10,
  showAlways = true,
  onLimitChange,
  limitOptions = [5, 10, 20, 50],
}) => {
  if (!showAlways && totalPages <= 1) return null;
  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= Math.max(1, totalPages); i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        start = 1;
        end = maxVisible;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 1;
        end = totalPages;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border-t border-gray-100 bg-gray-50/50">
      <div className="flex items-center gap-3">
        {totalRecords > 0 && (
          <p className="text-xs sm:text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{startRecord}</span> to{' '}
            <span className="font-semibold text-gray-800">{endRecord}</span> of{' '}
            <span className="font-semibold text-gray-800">{totalRecords}</span> results
          </p>
        )}

        {onLimitChange && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-2">
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="py-1 px-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            disabled={page === currentPage}
            className={`min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
