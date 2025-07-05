// quickfix-website/client/src/components/guides/SearchBar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../../utils/constants';
import { toast } from 'react-toastify';

function SearchBar({ initialQuery = '' }) {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const navigate = useNavigate();

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to search results page with the keyword
            navigate(`${ROUTES.SEARCH_RESULTS}?keyword=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            toast.info("Please enter a search term.");
        }
    };

    return (
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl mx-auto my-8">
            <input
                type="text"
                placeholder="Search for repair guides, issues, devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-border dark:border-gray-700 bg-cardBackground dark:bg-gray-700 focus:ring-primary focus:border-primary text-textDefault dark:text-white text-lg shadow-md transition-all duration-200"
            />
            <button
                type="submit"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors duration-200"
            >
                <MagnifyingGlassIcon className="h-6 w-6" />
            </button>
        </form>
    );
}

export default SearchBar;