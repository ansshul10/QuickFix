// quickfix-website/client/src/services/guideService.js
import api from '../utils/api'; // Our Axios instance

// Guide API calls
export const getGuides = async (keyword = '', category = '', pageNumber = 1, pageSize = 10, isPremium = '') => {
    return api.get('/guides', {
        params: { keyword, category, pageNumber, pageSize, isPremium }
    });
};

export const getGuideBySlug = async (slug) => {
    return api.get(`/guides/${slug}`);
};

export const createGuide = async (guideData) => {
    return api.post('/guides', guideData);
};

export const updateGuide = async (id, guideData) => {
    return api.put(`/guides/${id}`, guideData);
};

export const deleteGuide = async (id) => {
    return api.delete(`/guides/${id}`);
};

export const uploadGuideImage = async (id, imageUrl) => {
    // This assumes backend expects a URL in the body, not a file upload from frontend directy
    return api.put(`/guides/${id}/image`, { imageUrl });
};

// Comments
export const getCommentsForGuide = async (guideId) => {
    return api.get(`/comments/guide/${guideId}`);
};

export const addComment = async (guideId, content) => {
    return api.post('/comments', { guideId, content });
};

// Ratings
export const addRating = async (guideId, rating) => {
    return api.post('/ratings', { guideId, rating });
};

// Categories (Often fetched separately for filters)
export const getCategories = async () => {
    return api.get('/categories');
};