// quickfix-website/client/src/components/guides/GuideCard.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { formatTitle, truncateString } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import { AuthContext } from '../../context/AuthContext'; // Import AuthContext

function GuideCard({ guide }) {
    const { user } = useContext(AuthContext); // Get user from AuthContext
    const isPremiumAndNotSubscribed = guide.isPremium && (!user || !user.isPremium);

    if (!guide) return null;

    return (
        <div className="bg-cardBackground dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-border dark:border-gray-700 flex flex-col transform transition-all duration-300 hover:scale-[1.02]">
            <div className="relative h-48 sm:h-56 overflow-hidden">
                <img
                    src={guide.imageUrl || '/images/default-guide.png'}
                    alt={guide.title}
                    className={`w-full h-full object-cover object-center transition-transform duration-500 ${isPremiumAndNotSubscribed ? 'filter blur-sm grayscale' : 'hover:scale-110'}`}
                />
                {guide.isPremium && (
                    <div className="absolute top-3 right-3 bg-accent text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-md">
                        <SolidStarIcon className="h-4 w-4 mr-1" /> Premium
                    </div>
                )}
                {isPremiumAndNotSubscribed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 text-white text-center p-4">
                        <p className="text-lg font-semibold">Premium Content</p>
                    </div>
                )}
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-textDefault dark:text-white mb-2 leading-tight">
                    <Link to={`${ROUTES.GUIDES}/${guide.slug}`} className="hover:text-primary dark:hover:text-primary-light transition-colors">
                        {truncateString(guide.title, 60)}
                    </Link>
                </h3>
                <p className="text-textSecondary dark:text-gray-400 text-sm mb-4 flex-grow">
                    {truncateString(guide.description, 100)}
                </p>
                <div className="flex items-center justify-between text-sm text-textSecondary dark:text-gray-400 mt-auto">
                    <div className="flex items-center space-x-1">
                        <SolidStarIcon className="h-4 w-4 text-yellow-400" />
                        <span>{guide.averageRating?.toFixed(1) || '0.0'}</span>
                        <span>({guide.numOfReviews} reviews)</span>
                    </div>
                    <span className="px-2 py-1 bg-black dark:bg-gray-700 rounded-full text-xs font-medium text-white dark:text-white">
                        {guide.category?.name || 'Uncategorized'}
                    </span>
                </div>
                {isPremiumAndNotSubscribed ? (
                    <Link
                        to={ROUTES.PREMIUM} // Link to premium page
                        className="mt-5 inline-block text-center w-full px-4 py-2 bg-accent text-white rounded-md font-medium hover:bg-accent-dark transition-colors duration-200"
                    >
                        Subscribe to View
                    </Link>
                ) : (
                    <Link
                        to={`${ROUTES.GUIDES}/${guide.slug}`}
                        className="mt-5 inline-block text-center w-full px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors duration-200"
                    >
                        Read Guide
                    </Link>
                )}
            </div>
        </div>
    );
}

export default GuideCard;
