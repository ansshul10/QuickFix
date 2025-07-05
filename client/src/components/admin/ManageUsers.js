// quickfix-website/client/src/components/admin/ManageUsers.js
import React, { useState, useEffect, useCallback } from 'react';
import * as userService from '../../services/userService'; // Admin part of userService
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { toast } from 'react-toastify';
import {
    PencilSquareIcon, TrashIcon, UserCircleIcon, UserIcon as SolidUserIcon
} from '@heroicons/react/24/outline';
import {
    validateUsername, validateEmail, validatePassword, validateUrl
} from '../../utils/validation';
import Pagination from '../common/Pagination';
import { PAGINATION_DEFAULTS, USER_ROLES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

// Import the default avatar image directly
import defaultAvatar from '../../assets/images/default-avatar.png'; // Correct path to your default avatar

function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // User being edited
    const [formMode, setFormMode] = useState('edit'); // Only 'edit' mode for users

    // Form states
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [active, setActive] = useState(true); // For soft-delete/deactivation
    const [password, setPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState('');
    const [newsletterSubscriber, setNewsletterSubscriber] = useState(false);


    // Error states
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [profilePictureError, setProfilePictureError] = useState('');


    const [formLoading, setFormLoading] = useState(false);

    // Pagination & Filter states
    const [currentPage, setCurrentPage] = useState(PAGINATION_DEFAULTS.PAGE_NUMBER);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterRole, setFilterRole] = useState(''); // 'user', 'admin', or ''
    const [filterPremium, setFilterPremium] = useState(''); // 'true', 'false', or ''
    const [filterActive, setFilterActive] = useState(''); // 'true', 'false', or ''

    const [pagination, setPagination] = useState({
        page: PAGINATION_DEFAULTS.PAGE_NUMBER,
        pages: 1, // Default to 1 page
        total: 0 // Default to 0 total items
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await userService.getAllUsers({
                pageNumber: currentPage,
                pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                keyword: searchKeyword,
                role: filterRole,
                isPremium: filterPremium,
                active: filterActive
            });
            setUsers(res.data.data);
            setPagination({
                page: res.data.page,
                pages: res.data.pages,
                total: res.data.count // Backend 'count' from getAllUsers is actually 'total'
            });
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch users.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchKeyword, filterRole, filterPremium, filterActive]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Populate form fields when a user is selected for editing
    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setEmail(currentUser.email || '');
            setRole(currentUser.role || USER_ROLES.USER);
            setIsPremium(currentUser.isPremium || false);
            setActive(currentUser.active !== undefined ? currentUser.active : true);
            setProfilePicture(currentUser.profilePicture || ''); // Set profilePicture from currentUser
            setNewsletterSubscriber(currentUser.newsletterSubscriber || false);
            setPassword(''); // Clear password field for security
            // Clear errors
            setUsernameError('');
            setEmailError('');
            setPasswordError('');
            setProfilePictureError('');
        }
    }, [currentUser]);

    const handleOpenModal = (user) => {
        setCurrentUser(user);
        setFormMode('edit');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
        setFormMode('edit'); // Reset mode
        // Clear all form states and errors
        setUsername(''); setEmail(''); setRole(''); setIsPremium(false); setActive(true); setPassword(''); setProfilePicture(''); setNewsletterSubscriber(false);
        setUsernameError(''); setEmailError(''); setPasswordError(''); setProfilePictureError('');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        setUsernameError('');
        setEmailError('');
        setPasswordError('');
        setProfilePictureError('');

        let hasError = false;
        const usernameValidation = validateUsername(username);
        if (usernameValidation) { setUsernameError(usernameValidation); hasError = true; }
        const emailValidation = validateEmail(email);
        if (emailValidation) { setEmailError(emailValidation); hasError = true; }
        // Only validate password if it's not empty (i.e., user intends to change it)
        if (password && validatePassword(password)) { setPasswordError(validatePassword(password)); hasError = true; }
        // Only validate profilePicture URL if it's not empty
        if (profilePicture && validateUrl(profilePicture)) { setProfilePictureError(validateUrl(profilePicture)); hasError = true; }


        if (hasError) {
            setFormLoading(false);
            toast.error("Please correct the form errors.");
            return;
        }

        const userData = {
            username,
            email,
            role,
            isPremium,
            active,
            profilePicture,
            newsletterSubscriber
        };
        if (password) {
            userData.password = password;
        }

        const success = await userService.updateUserByAdmin(currentUser._id, userData);

        if (success) {
            handleCloseModal();
            fetchUsers(); // Re-fetch list to show updated data
        }
        setFormLoading(false);
    };

    const handleDeleteUser = async (id, username) => {
        if (window.confirm(`Are you sure you want to delete user "${username}"? This action is irreversible.`)) {
            const success = await userService.deleteUserByAdmin(id);
            if (success) {
                // Adjust current page if last item on page was deleted
                if (users.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    fetchUsers(); // Re-fetch to update list and pagination
                }
            }
        }
    };

    if (loading && !users.length) {
        return <LoadingSpinner fullScreen={false} message="Loading users..." />;
    }

    return (
        <div className="p-4 bg-cardBackground dark:bg-gray-800 rounded-lg shadow-lg border border-border dark:border-gray-700">
            <h2 className="text-3xl font-bold text-textDefault dark:text-white mb-6 text-center">Manage Users</h2>

            {/* Filter and Search Section */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder="Search by username or email..."
                    className="p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                    value={searchKeyword}
                    onChange={(e) => { setCurrentPage(1); setSearchKeyword(e.target.value); }}
                />
                <select
                    className="p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                    value={filterRole}
                    onChange={(e) => { setCurrentPage(1); setFilterRole(e.target.value); }}
                >
                    <option value="">All Roles</option>
                    <option value={USER_ROLES.USER}>User</option>
                    <option value={USER_ROLES.ADMIN}>Admin</option>
                </select>
                <select
                    className="p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                    value={filterPremium}
                    onChange={(e) => { setCurrentPage(1); setFilterPremium(e.target.value); }}
                >
                    <option value="">All Members</option>
                    <option value="true">Premium</option>
                    <option value="false">Free</option>
                </select>
                <select
                    className="p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                    value={filterActive}
                    onChange={(e) => { setCurrentPage(1); setFilterActive(e.target.value); }}
                >
                    <option value="">All Statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>

            {error && <p className="text-error-dark dark:text-error-light text-center mb-4">{error}</p>}

            {/* Users List */}
            {users.length === 0 && !loading ? (
                <p className="text-center text-textSecondary dark:text-text-secondary">No users found matching your criteria.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border dark:border-border shadow-sm">
                    <table className="min-w-full divide-y divide-border dark:divide-border">
                        <thead className="bg-background dark:bg-card-background">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider hidden sm:table-cell">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider hidden md:table-cell">Premium</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider hidden lg:table-cell">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider hidden xl:table-cell">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card-background dark:bg-card-background divide-y divide-border dark:divide-border">
                            {users.map((userItem) => (
                                <tr key={userItem._id} className="hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-150"> {/* FIX: Changed dark hover */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img
                                                    className="h-10 w-10 rounded-full object-cover"
                                                    src={userItem.profilePicture || defaultAvatar} // Use imported defaultAvatar
                                                    alt={`${userItem.username} profile`}
                                                    onError={(e) => { e.target.src = defaultAvatar; }} // Add onError
                                                />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-textDefault dark:text-text-default">{userItem.username}</div>
                                                <div className="text-sm text-textSecondary dark:text-text-secondary">{userItem.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-text-secondary hidden sm:table-cell">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            userItem.role === USER_ROLES.ADMIN ? 'bg-primary-light text-primary-dark dark:bg-primary dark:text-white' :
                                            'bg-gray-100 text-gray-800 dark:bg-secondary dark:text-white'
                                        }`}>
                                            {userItem.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center hidden md:table-cell">
                                        {userItem.isPremium ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-accent-light text-accent-dark dark:bg-accent dark:text-black">Premium</span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-secondary dark:text-white">Free</span>
                                        )}
                                    </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center hidden lg:table-cell">
                                            {userItem.active ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-light text-success-dark dark:bg-success dark:text-white">Active</span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-error-light text-error-dark dark:bg-error dark:text-white">Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-text-secondary hidden xl:table-cell">
                                            {formatDate(userItem.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenModal(userItem)}
                                                className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:bg-[rgba(255,255,255,0.05)] mr-3 p-1 rounded-full hover:bg-primary-light transition-colors" // FIX: Changed dark hover
                                                title="Edit User"
                                            >
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(userItem._id, userItem.username)}
                                                className="text-error hover:text-error-dark dark:text-error-light dark:hover:bg-[rgba(255,255,255,0.05)] p-1 rounded-full hover:bg-error-light transition-colors" // FIX: Changed dark hover
                                                title="Delete User"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            {/* Pagination Controls */}
            {pagination.total > 0 && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Edit User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={`Edit User: ${currentUser?.username}`}
                size="lg"
            >
                {currentUser && (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="flex flex-col items-center mb-4">
                            <img
                                src={profilePicture || defaultAvatar} // Use imported defaultAvatar here
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-2 border-primary dark:border-primary"
                                onError={(e) => { e.target.src = defaultAvatar; }} // Add onError here
                            />
                             <input
                                type="text"
                                className={`w-full max-w-xs mt-3 p-2 text-center text-sm border ${profilePictureError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                placeholder="Profile Picture URL"
                                value={profilePicture}
                                onChange={(e) => { setProfilePicture(e.target.value); setProfilePictureError(''); }}
                                disabled={formLoading}
                            />
                            {profilePictureError && <p className="mt-1 text-sm text-error">{profilePictureError}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
                                    className={`w-full p-2 border ${usernameError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                    disabled={formLoading}
                                />
                                {usernameError && <p className="mt-1 text-sm text-error">{usernameError}</p>}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                                    className={`w-full p-2 border ${emailError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                    disabled={formLoading}
                                />
                                {emailError && <p className="mt-1 text-sm text-error">{emailError}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Role</label>
                                <select
                                    id="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                                    disabled={formLoading}
                                >
                                    <option value={USER_ROLES.USER}>User</option>
                                    <option value={USER_ROLES.ADMIN}>Admin</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="isPremium" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Premium Status</label>
                                <select
                                    id="isPremium"
                                    value={isPremium}
                                    onChange={(e) => setIsPremium(e.target.value === 'true')}
                                    className="w-full p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                                    disabled={formLoading}
                                >
                                    <option value="true">Premium</option>
                                    <option value="false">Free</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label htmlFor="active" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Account Status</label>
                                 <select
                                     id="active"
                                     value={active}
                                     onChange={(e) => setActive(e.target.value === 'true')}
                                     className="w-full p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                                     disabled={formLoading}
                                 >
                                     <option value="true">Active</option>
                                     <option value="false">Inactive</option>
                                 </select>
                             </div>
                             <div>
                                 <label htmlFor="newsletterSubscriber" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Newsletter Subscriber</label>
                                 <select
                                     id="newsletterSubscriber"
                                     value={newsletterSubscriber}
                                     onChange={(e) => setNewsletterSubscriber(e.target.value === 'true')}
                                     className="w-full p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                                     disabled={formLoading}
                                 >
                                     <option value="true">Subscribed</option>
                                     <option value="false">Not Subscribed</option>
                                 </select>
                             </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Set New Password (optional)</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                                className={`w-full p-2 border ${passwordError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                placeholder="Leave blank to keep current"
                                disabled={formLoading}
                            />
                            {passwordError && <p className="mt-1 text-sm text-error">{passwordError}</p>}
                        </div>


                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium transition-colors dark:bg-gray-600 dark:text-text-default dark:hover:bg-gray-500"
                                disabled={formLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {formLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}

export default ManageUsers;