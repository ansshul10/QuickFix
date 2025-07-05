// quickfix-website/client/src/components/guides/RatingReview.js
import React, { useState, useEffect, useContext } from 'react';
import { StarIcon as OutlineStarIcon } from '@heroicons/react/24/outline'; // Outline for empty stars
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid'; // Solid for filled stars
import { AuthContext } from '../../context/AuthContext';
import { validateRating } from '../../utils/validation';
import LoadingSpinner from '../common/LoadingSpinner'; // <--- FIX IS HERE: Import LoadingSpinner
import { toast } from 'react-toastify';
import { ROUTES } from '../../utils/constants';
import { Link } from 'react-router-dom';

function RatingReview({ guideId, addRating, currentRating = null }) {
    const { user, loading } = useContext(AuthContext); // Check if user is logged in
    const [rating, setRating] = useState(currentRating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [ratingError, setRatingError] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    useEffect(() => {
        setRating(currentRating || 0);
    }, [currentRating]);

    const handleClick = async (starValue) => {
        if (!user) {
            toast.error("You must be logged in to rate a guide.");
            return;
        }
        setRatingError('');

        const validationError = validateRating(starValue);
        if (validationError) {
            setRatingError(validationError);
            toast.error(validationError);
            return;
        }

        setSubmittingRating(true);
        const success = await addRating(guideId, starValue);
        if (success) {
        }
        setSubmittingRating(false);
    };

    if (!user) {
        return (
            <p className="text-textSecondary dark:text-gray-400">
                <Link to={ROUTES.LOGIN} className="text-primary hover:underline">Log in</Link> to add your rating.
            </p>
        );
    }

    return (
        <div className="flex flex-col items-start space-y-3">
            <p className="text-md font-medium text-textDefault dark:text-white">Your rating:</p>
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                        key={starValue}
                        type="button"
                        onClick={() => handleClick(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        disabled={submittingRating}
                        className="transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Rate ${starValue} stars`}
                    >
                        {(hoverRating || rating) >= starValue ? (
                            <SolidStarIcon className="h-8 w-8 text-yellow-500" />
                        ) : (
                            <OutlineStarIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        )}
                    </button>
                ))}
            </div>
            {ratingError && <p className="text-error text-sm mt-1">{ratingError}</p>}
            {submittingRating && <LoadingSpinner size="sm" message="Submitting rating..." />} {/* Corrected usage */}
            {rating > 0 && !submittingRating && (
                <p className="text-sm text-textSecondary dark:text-gray-400">You rated this guide {rating} stars.</p>
            )}
        </div>
    );
}

export default RatingReview;
