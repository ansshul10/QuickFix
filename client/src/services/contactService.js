import api from '../utils/api';

const contactService = {
    submitMessage: async (name, email, message) => {
        try {
            const response = await api.post('/contact', { name, email, message });
            // The backend now returns { success, message, ticketNumber }
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    
    // --- NEW FUNCTION to check a ticket's status ---
    checkTicketStatus: async (ticketNumber) => {
        try {
            const response = await api.get(`/contact/ticket/${ticketNumber}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // --- Admin-specific functions ---
    getAllMessages: async (filters = {}) => {
        // --- MODIFIED: Added 'status' to the destructured filters ---
        const { isRead, keyword, pageNumber, pageSize, status } = filters;
        try {
            const response = await api.get('/contact/admin', {
                // --- MODIFIED: Pass the status parameter to the API ---
                params: { isRead, keyword, pageNumber, pageSize, status }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // No changes needed for the functions below
    getMessageById: async (id) => {
        try {
            const response = await api.get(`/contact/admin/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateMessage: async (id, updateData) => {
        try {
            const response = await api.put(`/contact/admin/${id}`, updateData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    replyToMessage: async (id, replyMessage) => {
        try {
            const response = await api.post(`/contact/admin/${id}/reply`, { replyMessage });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteMessage: async (id) => {
        try {
            const response = await api.delete(`/contact/admin/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default contactService;