// quickfix-website/client/src/components/common/Pagination.js
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { PAGINATION_DEFAULTS } from '../../utils/constants';

/**
 * Reusable Pagination component.
 * @param {object} props
 * @param {number} props.currentPage - The current active page number (1-indexed).
 * @param {number} props.totalPages - The total number of pages available.
 * @param {function} props.onPageChange - Callback function when a page is clicked: (pageNumber: number) => void.
 * @param {number} [props.maxPageNumbers=5] - Maximum number of page buttons to display.
 * @param {object} props.pagination - The full pagination object from context, containing 'total' count. <--- ADDED THIS PROP
 */
function Pagination({ currentPage, totalPages, onPageChange, maxPageNumbers = 5, pagination }) { // <--- FIX IS HERE: Add 'pagination' to destructuring
  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page or less
  }

  const pageNumbers = [];
  // Calculate start and end page numbers for display
  let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
  let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

  // Adjust startPage if we hit the end of pages
  if (endPage - startPage + 1 < maxPageNumbers && endPage === totalPages) {
    startPage = Math.max(1, totalPages - maxPageNumbers + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <nav className="flex items-center justify-between border-t border-border dark:border-gray-700 px-4 py-3 sm:px-6 mt-8" aria-label="Pagination">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-border dark:border-gray-700 bg-cardBackground dark:bg-gray-700 px-4 py-2 text-sm font-medium text-textDefault dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-border dark:border-gray-700 bg-cardBackground dark:bg-gray-700 px-4 py-2 text-sm font-medium text-textDefault dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-textSecondary dark:text-gray-400">
            Showing <span className="font-medium">{(currentPage - 1) * PAGINATION_DEFAULTS.PAGE_SIZE + 1}</span> to <span className="font-medium">{Math.min(currentPage * PAGINATION_DEFAULTS.PAGE_SIZE, totalPages * PAGINATION_DEFAULTS.PAGE_SIZE)}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> results {/* Using pagination.total here directly */}
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-textSecondary dark:text-gray-400 ring-1 ring-inset ring-border dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            {/* Render ellipsis if necessary */}
            {startPage > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className="relative hidden items-center px-4 py-2 text-sm font-semibold text-textDefault dark:text-white ring-1 ring-inset ring-border dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 md:inline-flex"
                    >
                        1
                    </button>
                    {startPage > 2 && (
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-400 ring-1 ring-inset ring-border dark:ring-gray-700 focus:outline-offset-0">...</span>
                    )}
                </>
            )}

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                aria-current={currentPage === pageNumber ? 'page' : undefined}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 transition-colors ${
                  currentPage === pageNumber
                    ? 'z-10 bg-primary text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary'
                    : 'text-textDefault dark:text-white ring-1 ring-inset ring-border dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && (
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-400 ring-1 ring-inset ring-border dark:ring-gray-700 focus:outline-offset-0">...</span>
                    )}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className="relative hidden items-center px-4 py-2 text-sm font-semibold text-textDefault dark:text-white ring-1 ring-inset ring-border dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 md:inline-flex"
                    >
                        {totalPages}
                    </button>
                </>
            )}

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-textSecondary dark:text-gray-400 ring-1 ring-inset ring-border dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </nav>
  );
}

export default Pagination;