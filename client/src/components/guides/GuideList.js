// quickfix-website/client/src/components/guides/GuideList.js
import React, { useState, useEffect, useContext } from 'react';
import { GuideContext } from '../../context/GuideContext';
import { getCategories as fetchAllCategories } from '../../services/guideService'; // Aliased to avoid name conflict
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';
import GuideCard from './GuideCard'; // Individual guide card component
import { PAGINATION_DEFAULTS } from '../../utils/constants';
import { toast } from 'react-toastify';
import useDebounce from '../../hooks/useDebounce';

function GuideList() {
    const { guides, loading, error, pagination, fetchGuides } = useContext(GuideContext);

    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filterPremium, setFilterPremium] = useState(''); // 'true', 'false', or ''
    const [categories, setCategories] = useState([]); // All available categories for filter dropdown

    const debouncedSearchKeyword = useDebounce(searchKeyword, 500); // Debounce search input

    // Fetch categories on mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await fetchAllCategories();
                setCategories(res.data.data);
            } catch (err) {
                toast.error("Failed to load categories for filter.");
            }
        };
        loadCategories();
    }, []);

    // Effect to fetch guides based on filters and pagination
    useEffect(() => {
        fetchGuides({
            pageNumber: pagination.page, // Use current page from context (or local state)
            pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
            keyword: debouncedSearchKeyword,
            category: selectedCategory,
            isPremium: filterPremium
        });
    }, [fetchGuides, pagination.page, debouncedSearchKeyword, selectedCategory, filterPremium]); // Depend on debounced keyword

    const handlePageChange = (pageNumber) => {
        // Update the context's pagination page
        fetchGuides({
            pageNumber: pageNumber,
            pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
            keyword: debouncedSearchKeyword,
            category: selectedCategory,
            isPremium: filterPremium
        });
    };

    if (loading && !guides.length) { // Show full spinner if initial load and no guides
        return <LoadingSpinner fullScreen={true} message="Fetching guides..." />;
    }

    if (error) {
        return <div className="text-center text-error dark:text-error-light text-lg mt-8">{error}</div>;
    }

    return (
        <div className="py-8">
            <h1 className="text-4xl font-extrabold text-center text-textDefault dark:text-white mb-8">All Repair Guides</h1>

            {/* Filter and Search Section */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                    type="text"
                    placeholder="Search guides by title..."
                    className="p-3 border border-border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-primary focus:border-primary transition-colors"
                    value={searchKeyword}
                    onChange={(e) => {
                        setSearchKeyword(e.target.value);
                        // Reset page to 1 when search keyword changes
                        if (pagination.page !== 1) {
                            fetchGuides({
                                pageNumber: 1,
                                pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                                keyword: e.target.value,
                                category: selectedCategory,
                                isPremium: filterPremium
                            });
                        }
                    }}
                />
                <select
                    className="p-3 border border-border rounded-lg dark:bg-gray-700 text-black focus:ring-primary focus:border-primary transition-colors"
                    value={selectedCategory}
                    onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        // Reset page to 1 when category changes
                        if (pagination.page !== 1) {
                            fetchGuides({
                                pageNumber: 1,
                                pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                                keyword: debouncedSearchKeyword,
                                category: e.target.value,
                                isPremium: filterPremium
                            });
                        }
                    }}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat._id} value={cat.slug}>{cat.name}</option>
                    ))}
                </select>
                <select
                    className="p-3 border border-border rounded-lg dark:bg-gray-700 text-black focus:ring-primary focus:border-primary transition-colors"
                    value={filterPremium}
                    onChange={(e) => {
                        setFilterPremium(e.target.value);
                        // Reset page to 1 when premium filter changes
                        if (pagination.page !== 1) {
                            fetchGuides({
                                pageNumber: 1,
                                pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                                keyword: debouncedSearchKeyword,
                                category: selectedCategory,
                                isPremium: e.target.value
                            });
                        }
                    }}
                >
                    <option value="">All Guides</option>
                    <option value="true">Premium Guides</option>
                    <option value="false">Free Guides</option>
                </select>
            </div>

            {/* Guides Grid */}
            {loading && guides.length === 0 ? (
                <LoadingSpinner message="Loading guides..." />
            ) : guides.length === 0 ? (
                <p className="text-center text-textSecondary dark:text-gray-400 text-lg">No guides found matching your criteria.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {guides.map(guideItem => (
                        <GuideCard key={guideItem._id} guide={guideItem} />
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={handlePageChange}
                    maxPageNumbers={5}
                />
            )}
        </div>
    );
}

export default GuideList;
