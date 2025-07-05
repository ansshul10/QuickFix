// quickfix-website/client/src/services/userService.js
import api from '../utils/api'; // Our Axios instance

// API calls for authenticated user's specific data
export const getMyGuides = async () => {
    return api.get('/users/my-guides');
};

export const getMyComments = async () => {
    return api.get('/users/my-comments');
};

export const getMyRatings = async () => {
    return api.get('/users/my-ratings');
};

// Admin-specific user management
export const getAllUsers = async (filters = {}) => {
    const { keyword, role, isPremium, active, pageNumber, pageSize } = filters;
    return api.get('/admin/users', {
        params: { keyword, role, isPremium, active, pageNumber, pageSize }
    });
};

export const getUserById = async (id) => {
    return api.get(`/admin/users/${id}`);
};

export const updateUserByAdmin = async (id, userData) => {
    return api.put(`/admin/users/${id}`, userData);
};

export const deleteUserByAdmin = async (id) => {
    return api.delete(`/admin/users/${id}`);
};