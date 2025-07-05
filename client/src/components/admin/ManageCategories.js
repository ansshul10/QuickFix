// quickfix-website/client/src/components/admin/ManageCategories.js
import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { toast } from 'react-toastify';
import {
    PlusCircleIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/guideService'; // Using guideService for category API calls for now
import { validateTitle, validateDescription } from '../../utils/validation'; // Re-using guide validations for category
import Pagination from '../common/Pagination';
import { PAGINATION_DEFAULTS } from '../../utils/constants'; // Assuming you have PAGINATION_DEFAULTS

function ManageCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null); // For edit/view
    const [formMode, setFormMode] = useState('add'); // 'add', 'edit', 'view'

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const [nameError, setNameError] = useState('');
    const [descriptionError, setDescriptionError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // For pagination (though categories might not strictly need it depending on count)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);


    const fetchAllCategories = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            // For now, getCategories service fetches all, we'll implement pagination if necessary later.
            // If the backend /categories endpoint doesn't support pagination, adjust this.
            const res = await getCategories();
            setCategories(res.data.data); // Assuming res.data.data is an array of categories
            setTotalItems(res.data.data.length); // Assuming all categories are fetched at once
            setTotalPages(1); // Set to 1 if no backend pagination
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch categories.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllCategories(currentPage);
    }, [fetchAllCategories, currentPage]);

    useEffect(() => {
        if (formMode === 'edit' && currentCategory) {
            setName(currentCategory.name || '');
            setDescription(currentCategory.description || '');
        } else {
            setName('');
            setDescription('');
        }
        setNameError('');
        setDescriptionError('');
    }, [formMode, currentCategory]);


    const handleOpenModal = (mode, categoryData = null) => {
        setFormMode(mode);
        setCurrentCategory(categoryData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCategory(null);
        setFormMode('add');
        setName('');
        setDescription('');
        setNameError('');
        setDescriptionError('');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        setNameError('');
        setDescriptionError('');

        let hasError = false;
        const nameValidation = validateTitle(name); // Re-use title validation for name
        if (nameValidation) { setNameError(nameValidation); hasError = true; }
        const descriptionValidation = validateDescription(description); // Re-use description validation
        if (descriptionValidation) { setDescriptionError(descriptionValidation); hasError = true; }

        if (hasError) {
            setFormLoading(false);
            toast.error("Please correct the form errors.");
            return;
        }

        const categoryData = { name, description };
        let success = false;

        try {
            if (formMode === 'add') {
                await createCategory(categoryData);
                toast.success('Category created successfully!');
            } else if (formMode === 'edit' && currentCategory) {
                await updateCategory(currentCategory._id, categoryData);
                toast.success('Category updated successfully!');
            }
            success = true;
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to ${formMode} category.`;
            toast.error(errorMessage);
        } finally {
            setFormLoading(false);
            if (success) {
                handleCloseModal();
                fetchAllCategories(currentPage); // Refresh the list
            }
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete the category "${name}"? This action cannot be undone and will fail if guides are still linked to it.`)) {
            setLoading(true); // Show loading while deleting
            try {
                await deleteCategory(id);
                toast.success(`Category "${name}" deleted successfully.`);
                fetchAllCategories(currentPage); // Refresh list
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete category.';
                toast.error(errorMessage);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && categories.length === 0) {
        return <LoadingSpinner fullScreen={false} message="Loading categories..." />;
    }

    return (
        <div className="p-4 bg-cardBackground dark:bg-card-background rounded-lg shadow-lg border border-border dark:border-border">
            <h2 className="text-3xl font-bold text-textDefault dark:text-text-default mb-6 text-center">Manage Categories</h2>

            <p className="text-center text-textSecondary dark:text-gray-400 mb-8">
                Here you can manage all the categories for your QuickFix guides.
            </p>

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => handleOpenModal('add')}
                    className="flex items-center bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-md font-medium transition-colors duration-200 shadow-md"
                >
                    <PlusCircleIcon className="h-5 w-5 mr-2" /> Add New Category
                </button>
            </div>

            {error && <p className="text-error-dark dark:text-error-light text-center mb-4">{error}</p>}

            {categories.length === 0 && !loading ? (
                <p className="text-center text-textSecondary dark:text-text-secondary">No categories found.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border dark:border-border shadow-sm">
                    <table className="min-w-full divide-y divide-border dark:divide-border">
                        <thead className="bg-background dark:bg-card-background">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider hidden sm:table-cell">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card-background dark:bg-card-background divide-y divide-border dark:divide-border">
                            {categories.map((category) => (
                                <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textDefault dark:text-text-default">
                                        {category.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-text-secondary hidden sm:table-cell">
                                        {category.description || 'No description'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenModal('edit', category)}
                                            className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:bg-[rgba(255,255,255,0.05)] mr-3 p-1 rounded-full hover:bg-primary-light transition-colors"
                                            title="Edit Category"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(category._id, category.name)}
                                            className="text-error hover:text-error-dark dark:text-error-light dark:hover:bg-[rgba(255,255,255,0.05)] p-1 rounded-full hover:bg-error-light transition-colors"
                                            title="Delete Category"
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

            {/* Pagination is likely not needed for categories unless you expect thousands */}
            {/* {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    pagination={{ page: currentPage, pages: totalPages, total: totalItems }} // Pass relevant data
                />
            )} */}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={formMode === 'add' ? 'Add New Category' : `Edit Category: ${currentCategory?.name}`}
                size="md"
            >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="categoryName" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Category Name</label>
                        <input
                            type="text"
                            id="categoryName"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setNameError(''); }}
                            className={`w-full p-2 border ${nameError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                            disabled={formLoading}
                        />
                        {nameError && <p className="mt-1 text-sm text-error">{nameError}</p>}
                    </div>
                    <div>
                        <label htmlFor="categoryDescription" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Description (Optional)</label>
                        <textarea
                            id="categoryDescription"
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); setDescriptionError(''); }}
                            rows="3"
                            className={`w-full p-2 border ${descriptionError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                            disabled={formLoading}
                        ></textarea>
                        {descriptionError && <p className="mt-1 text-sm text-error">{descriptionError}</p>}
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
                                formMode === 'add' ? 'Add Category' : 'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default ManageCategories;
