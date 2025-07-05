// quickfix-website/client/src/context/GuideContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import * as guideService from '../services/guideService';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext'; // To potentially show premium warnings
import { SettingsContext } from './SettingsContext'; // For enabling/disabling comments/ratings
import logger from '../utils/logger'; // Frontend logger

export const GuideContext = createContext();

export const GuideProvider = ({ children }) => {
    const { user } = useContext(AuthContext); // Access user for premium checks
    const { settings, loadingSettings } = useContext(SettingsContext); // Access global settings for feature toggles
    const [guides, setGuides] = useState([]);
    const [guide, setGuide] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    // Fetch guides with filters/pagination
    const fetchGuides = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const { keyword, category, pageNumber, pageSize, isPremium } = filters;
            const res = await guideService.getGuides(keyword, category, pageNumber, pageSize, isPremium);
            setGuides(res.data.guides);
            setPagination({
                page: res.data.page,
                pages: res.data.pages,
                total: res.data.total
            });
            logger.info('Guides fetched successfully.');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch guides.';
            setError(errorMessage);
            toast.error(errorMessage);
            logger.error('Error fetching guides:', errorMessage, err);
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array means this function is stable

    // Fetch a single guide by slug
    const fetchGuideBySlug = useCallback(async (slug) => {
        setLoading(true);
        setError(null);
        setGuide(null); // Clear previous guide data
        try {
            const res = await guideService.getGuideBySlug(slug);
            setGuide(res.data.data); // Backend response is often { success: true, data: ... }
            logger.info(`Guide "${slug}" fetched successfully.`);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch guide.';
            setError(errorMessage);
            toast.error(errorMessage);
            setGuide(null); // Ensure guide is null on error
            logger.error(`Error fetching guide "${slug}":`, errorMessage, err);

            // Specific handling for premium content access denied (403)
            if (err.response?.status === 403) {
                toast.warn("This is premium content. Please log in or upgrade to access.", { autoClose: 5000 });
            } else if (err.response?.status === 404) {
                 toast.warn("The guide you are looking for does not exist or has been removed.");
            }
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array

    // Admin: Add a guide
    const addGuide = async (guideData) => {
        setLoading(true);
        setError(null);
        try {
            const res = await guideService.createGuide(guideData);
            toast.success('Guide created successfully!');
            // Optionally update guides list or refetch all guides
            // fetchGuides();
            return res.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create guide.';
            setError(errorMessage);
            toast.error(errorMessage);
            logger.error('Error creating guide:', errorMessage, err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Admin: Update a guide
    const updateGuide = async (id, guideData) => {
        setLoading(true);
        setError(null);
        try {
            const res = await guideService.updateGuide(id, guideData);
            toast.success('Guide updated successfully!');
            // After updating, refetch the specific guide to ensure UI is updated
            // if (guide && guide._id === id) {
            //     fetchGuideBySlug(res.data.slug); // If you're on the guide detail page
            // }
            return res.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update guide.';
            setError(errorMessage);
            toast.error(errorMessage);
            logger.error('Error updating guide:', errorMessage, err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Admin: Delete a guide
    const deleteGuide = async (id) => {
        setLoading(true);
        setError(null);
        try {
            await guideService.deleteGuide(id);
            toast.success('Guide deleted successfully!');
            // Optimistically remove from current guides list
            setGuides(prevGuides => prevGuides.filter(g => g._id !== id));
            return true;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to delete guide.';
            setError(errorMessage);
            toast.error(errorMessage);
            logger.error('Error deleting guide:', errorMessage, err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Add a comment to a guide
    const addComment = async (guideId, content) => {
        setLoading(true);
        setError(null);
        const enableComments = settings?.enableComments; // Get setting from context
        if (!enableComments && !loadingSettings) {
            toast.error("Commenting is currently disabled by the administrator.");
            setLoading(false);
            return false;
        }

        try {
            const res = await guideService.addComment(guideId, content);
            // Assuming the backend returns the new comment, add it to the current guide's comments
            setGuide(prevGuide => ({
                ...prevGuide,
                comments: [...(prevGuide.comments || []), res.data.data]
            }));
            toast.success('Comment added successfully!');
            return true;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to add comment.';
            setError(errorMessage);
            toast.error(errorMessage);
            logger.error('Error adding comment:', errorMessage, err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Add a rating to a guide
    const addRating = async (guideId, rating) => {
        setLoading(true);
        setError(null);
        const enableRatings = settings?.enableRatings; // Get setting from context
        if (!enableRatings && !loadingSettings) {
            toast.error("Rating feature is currently disabled by the administrator.");
            setLoading(false);
            return false;
        }

        try {
            const res = await guideService.addRating(guideId, rating);
            // Update the guide's average rating and number of reviews locally for immediate feedback
            setGuide(prevGuide => ({
                ...prevGuide,
                averageRating: res.data.data.averageRating, // Assuming backend returns updated avg
                numOfReviews: res.data.data.numOfReviews // Assuming backend returns updated count
            }));
            toast.success('Rating added successfully!');
            return true;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to add rating.';
            setError(errorMessage);
            toast.error(errorMessage);
            logger.error('Error adding rating:', errorMessage, err);
            return false;
        } finally {
            setLoading(false);
        }
    };


    return (
        <GuideContext.Provider value={{
            guides,
            guide,
            loading,
            error,
            pagination,
            fetchGuides,
            fetchGuideBySlug,
            addGuide,
            updateGuide,
            deleteGuide,
            addComment,
            addRating,
        }}>
            {children}
        </GuideContext.Provider>
    );
};