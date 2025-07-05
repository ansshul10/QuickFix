import React, { useState, useEffect, useCallback } from 'react';
import contactService from '../../services/contactService';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import { toast } from 'react-toastify';
import {
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatters';
import { PAGINATION_DEFAULTS } from '../../utils/constants';

// --- NEW: A more powerful modal for updating tickets ---
const UpdateTicketModal = ({ isOpen, onClose, ticket, onUpdateSuccess }) => {
    // State for the form within the modal
    const [status, setStatus] = useState('');
    const [adminResponse, setAdminResponse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // When the ticket to be edited changes, update the modal's form state
    useEffect(() => {
        if (ticket) {
            setStatus(ticket.status || 'Pending');
            setAdminResponse(ticket.adminResponse || '');
        }
    }, [ticket]);

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Use the generic updateMessage service, which now handles everything
            await contactService.updateMessage(ticket._id, {
                status,
                adminResponse
            });
            toast.success(`Ticket #${ticket.ticketNumber} has been updated.`);
            onUpdateSuccess(); // Trigger a data refresh in the parent component
            onClose(); // Close the modal
        } catch (error) {
            toast.error("Failed to update ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!ticket) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Update Ticket #${ticket.ticketNumber}`} size="lg">
            <div className="p-4 mb-4 bg-gray-100 dark:bg-gray-700 rounded-md border border-border dark:border-gray-600">
                <p><strong>User:</strong> {ticket.name} ({ticket.email})</p>
                <p className="font-semibold text-textDefault dark:text-white mt-2">Original Complaint:</p>
                <p className="text-sm text-textSecondary dark:text-gray-300 italic">"{ticket.message}"</p>
            </div>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-textDefault dark:text-white mb-1">
                        Update Ticket Status
                    </label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-2 border border-border rounded-md bg-background text-textDefault dark:bg-gray-700 dark:text-white focus:ring-primary focus:border-primary"
                    >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="adminResponse" className="block text-sm font-medium text-textDefault dark:text-white mb-1">
                        Your Reply (This will be visible to the user)
                    </label>
                    <textarea
                        id="adminResponse"
                        rows="6"
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        className="w-full p-2 border border-border rounded-md bg-background text-textDefault dark:bg-gray-700 dark:text-white focus:ring-primary focus:border-primary"
                        placeholder="Provide a solution or update here..."
                        disabled={isSubmitting}
                    ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium transition-colors dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500" disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Saving...' : 'Save & Update Ticket'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- MODIFIED: The UserHelp component is now a Ticket Management System ---
function UserHelp() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(PAGINATION_DEFAULTS.PAGE_NUMBER);
    const [totalMessages, setTotalMessages] = useState(0);
    
    // --- ADDED: State for the new status filter ---
    const [filterStatus, setFilterStatus] = useState('');

    const [searchKeyword, setSearchKeyword] = useState('');
    const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');

    // --- ADDED: State for the new update modal ---
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedSearchKeyword(searchKeyword); }, 500);
        return () => clearTimeout(handler);
    }, [searchKeyword]);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const responseData = await contactService.getAllMessages({
                pageNumber: currentPage,
                pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                status: filterStatus || undefined, // Pass the new status filter
                keyword: debouncedSearchKeyword
            });
            setMessages(responseData.data);
            setTotalMessages(responseData.count);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch tickets.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterStatus, debouncedSearchKeyword]);

    useEffect(() => { fetchMessages(); }, [fetchMessages]);

    const handleDeleteMessage = async (messageId) => {
        if (window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
            try {
                await contactService.deleteMessage(messageId);
                toast.success('Ticket deleted successfully!');
                fetchMessages();
            } catch (err) { /* service handles toast */ }
        }
    };

    const handleOpenUpdateModal = (message) => {
        setSelectedTicket(message);
        setIsUpdateModalOpen(true);
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'Under Review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const totalPages = Math.ceil(totalMessages / PAGINATION_DEFAULTS.PAGE_SIZE);

    if (loading) return <LoadingSpinner fullScreen={false} message="Loading Tickets..." />;

    return (
        <div className="p-4 bg-cardBackground dark:bg-gray-800 rounded-lg shadow-lg border border-border dark:border-gray-700">
            <h2 className="text-3xl font-bold text-textDefault dark:text-white mb-6 text-center">Support Ticket Management</h2>

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-auto flex-grow">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, ticket #"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="pl-10 p-2 border border-border rounded-md bg-background text-textDefault dark:bg-gray-700 dark:text-white focus:ring-primary focus:border-primary w-full"
                    />
                </div>
                <select
                    className="p-2 border border-border rounded-md bg-background text-textDefault dark:bg-gray-700 dark:text-white focus:ring-primary focus:border-primary w-full sm:w-auto"
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {messages.length === 0 ? (
                <p className="text-center text-textSecondary py-10">No tickets found matching your criteria.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border dark:border-gray-600 shadow-sm">
                    <table className="min-w-full divide-y divide-border dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Ticket #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">User Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Message</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card-background dark:bg-gray-800 divide-y divide-border dark:divide-gray-600">
                            {messages.map((message) => (
                                <tr key={message._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary dark:text-red-400 font-semibold">{message.ticketNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textDefault dark:text-white">
                                        <div>{message.name}</div>
                                        <div className="text-xs text-textSecondary">{message.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(message.status)}`}>
                                            {message.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 max-w-sm truncate text-sm text-textSecondary">{message.message}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleOpenUpdateModal(message)} className="text-primary hover:text-primary-dark dark:text-red-400 dark:hover:text-red-300 p-1" title="Update & Reply">
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDeleteMessage(message._id)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1" title="Delete Ticket">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
            
            <UpdateTicketModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                ticket={selectedTicket}
                onUpdateSuccess={fetchMessages}
            />
        </div>
    );
}

export default UserHelp;