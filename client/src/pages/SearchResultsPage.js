// quickfix-website/client/src/pages/SearchResultsPage.js
import React, { useEffect, useState, useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { GuideContext } from '../context/GuideContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import GuideCard from '../components/guides/GuideCard';
import Pagination from '../components/common/Pagination';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { PAGINATION_DEFAULTS, ROUTES } from '../utils/constants';

function SearchResultsPage() {
    const location = useLocation();
    const { guides, loading, error, pagination, fetchGuides } = useContext(GuideContext);

    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(PAGINATION_DEFAULTS.PAGE_NUMBER);

    // Extract keyword from URL query params
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const keyword = queryParams.get('keyword') || '';
        setSearchKeyword(keyword);
        setCurrentPage(parseInt(queryParams.get('pageNumber')) || PAGINATION_DEFAULTS.PAGE_NUMBER);
    }, [location.search]);

    // Fetch guides when keyword or page changes
    useEffect(() => {
        if (searchKeyword) {
            fetchGuides({
                pageNumber: currentPage,
                pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                keyword: searchKeyword,
                category: '', // No category filter on search results page by default
                isPremium: '' // No premium filter by default
            });
        } else {
            // If no keyword, clear guides
            // setGuides([]); // This would be done in GuideContext if fetchGuides clears on empty keyword
            // You might want to redirect to a general guides page if no keyword
        }
    }, [searchKeyword, currentPage, fetchGuides]);

    // Custom breadcrumbs for search results
    const customBreadcrumbs = [
        { name: 'Home', path: ROUTES.HOME },
        { name: `Search: "${searchKeyword}"`, path: `${ROUTES.SEARCH_RESULTS}?keyword=${encodeURIComponent(searchKeyword)}` }
    ];

    if (loading && guides.length === 0) {
        return <LoadingSpinner fullScreen={true} message="Searching..." />;
    }

    if (error) {
        return <div className="text-center text-error dark:text-error-light text-lg mt-8">{error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Breadcrumbs customSegments={customBreadcrumbs} />
            </div>

            <h1 className="text-4xl font-extrabold text-center text-textDefault dark:text-white mb-8">
                Search Results for "{searchKeyword}"
            </h1>

            {guides.length === 0 && !loading ? (
                <p className="text-center text-textSecondary dark:text-gray-400 text-lg">
                    No results found for "{searchKeyword}". Try a different search term.
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {guides.map(guideItem => (
                            <GuideCard key={guideItem._id} guide={guideItem} />
                        ))}
                    </div>

                    {pagination.pages > 1 && (
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={setCurrentPage}
                            maxPageNumbers={5}
                        />
                    )}
                </>
            )}

            <div className="mt-12 text-center">
                <Link to={ROUTES.GUIDES} className="text-primary hover:underline text-lg">
                    Browse All Guides
                </Link>
            </div>
        </div>
    );
}

export default SearchResultsPage;