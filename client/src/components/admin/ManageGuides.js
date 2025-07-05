// quickfix-website/client/src/components/admin/ManageGuides.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { GuideContext } from '../../context/GuideContext';
import { AuthContext } from '../../context/AuthContext';
import { getCategories } from '../../services/guideService';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { toast } from 'react-toastify';
import {
    PlusCircleIcon, PencilSquareIcon, TrashIcon, EyeIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
    validateTitle, validateDescription, validateContent, validateCategoryId, validateUrl
} from '../../utils/validation';
// REMOVED: import ReactQuill from 'react-quill';
// REMOVED: import 'react-quill/dist/quill.snow.css';
import Pagination from '../common/Pagination';
import { PAGINATION_DEFAULTS, ROUTES } from '../../utils/constants';
import { truncateString } from '../../utils/formatters';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify'; // Needed for rendering HTML safely if content has it

function ManageGuides() {
    const { guides, guide, loading, error, pagination, fetchGuides, fetchGuideBySlug, addGuide, updateGuide, deleteGuide } = useContext(GuideContext);
    const { user } = useContext(AuthContext);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGuide, setCurrentGuide] = useState(null);
    const [formMode, setFormMode] = useState('add');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState(''); // Changed to string for textarea
    const [categoryId, setCategoryId] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [imageUrl, setImageUrl] = useState('');

    const [titleError, setTitleError] = useState('');
    const [descriptionError, setDescriptionError] = useState('');
    const [contentError, setContentError] = useState('');
    const [categoryIdError, setCategoryIdError] = useState('');
    const [imageUrlError, setImageUrlError] = useState('');

    const [formLoading, setFormLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    const [currentPage, setCurrentPage] = useState(pagination.page);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filterPremium, setFilterPremium] = useState('');

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await getCategories();
                setCategories(res.data.data);
            } catch (err) {
                toast.error("Failed to load categories.");
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        fetchGuides({
            pageNumber: currentPage,
            pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
            keyword: searchKeyword,
            category: selectedCategory,
            isPremium: filterPremium
        });
    }, [fetchGuides, currentPage, searchKeyword, selectedCategory, filterPremium]);


    useEffect(() => {
        if (formMode === 'edit' && currentGuide) {
            setTitle(currentGuide.title || '');
            setDescription(currentGuide.description || '');
            setContent(currentGuide.content || ''); // Content will be string
            setCategoryId(currentGuide.category?._id || '');
            setIsPremium(currentGuide.isPremium || false);
            setImageUrl(currentGuide.imageUrl || '');
        } else if (formMode === 'add') {
            setTitle('');
            setDescription('');
            setContent('');
            setCategoryId('');
            setIsPremium(false);
            setImageUrl('');
        }
        setTitleError('');
        setDescriptionError('');
        setContentError('');
        setCategoryIdError('');
        setImageUrlError('');
    }, [formMode, currentGuide]);


    const handleOpenModal = (mode, guideData = null) => {
        setFormMode(mode);
        setCurrentGuide(guideData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentGuide(null);
        setFormMode('add');
        setTitle('');
        setDescription('');
        setContent('');
        setCategoryId('');
        setIsPremium(false);
        setImageUrl('');
        setTitleError('');
        setDescriptionError('');
        setContentError('');
        setCategoryIdError('');
        setImageUrlError('');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        setTitleError('');
        setDescriptionError('');
        setContentError('');
        setCategoryIdError('');
        setImageUrlError('');

        let hasError = false;
        const titleValidation = validateTitle(title);
        if (titleValidation) { setTitleError(titleValidation); hasError = true; }
        const descriptionValidation = validateDescription(description);
        if (descriptionValidation) { setDescriptionError(descriptionValidation); hasError = true; }
        const contentValidation = validateContent(content); // Use validateContent for string
        if (contentValidation) { setContentError(contentValidation); hasError = true; }
        const categoryIdValidation = validateCategoryId(categoryId);
        if (categoryIdValidation) { setCategoryIdError(categoryIdValidation); hasError = true; }
        const imageUrlValidation = validateUrl(imageUrl);
        if (imageUrlValidation) { setImageUrlError(imageUrlValidation); hasError = true; }


        if (hasError) {
            setFormLoading(false);
            toast.error("Please correct the form errors.");
            return;
        }

        const guideData = { title, description, content, categoryId, isPremium, imageUrl };
        let success = false;

        if (formMode === 'add') {
            success = await addGuide(guideData);
        } else if (formMode === 'edit' && currentGuide) {
            success = await updateGuide(currentGuide._id, guideData);
        }

        if (success) {
            handleCloseModal();
            fetchGuides({
                pageNumber: currentPage,
                pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                keyword: searchKeyword,
                category: selectedCategory,
                isPremium: filterPremium
            });
        }
        setFormLoading(false);
    };

    const handleDeleteGuide = async (id, title) => {
        if (window.confirm(`Are you sure you want to delete the guide "${title}"? This action cannot be undone.`)) {
            const success = await deleteGuide(id);
            if (success) {
                if (guides.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    fetchGuides({
                        pageNumber: currentPage,
                        pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                        keyword: searchKeyword,
                        category: selectedCategory,
                        isPremium: filterPremium
                    });
                }
            }
        }
    };


    if (loading && !guides.length) {
        return <LoadingSpinner fullScreen={false} message="Loading guides..." />;
    }

    return (
        <div className="p-4 bg-cardBackground dark:bg-card-background rounded-lg shadow-lg border border-border dark:border-border">
            <h2 className="text-3xl font-bold text-textDefault dark:text-text-default mb-6 text-center">Manage Guides</h2>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                    type="text"
                    placeholder="Search by title or description..."
                    className="p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                    value={searchKeyword}
                    onChange={(e) => { setCurrentPage(1); setSearchKeyword(e.target.value); }}
                />
                <select
                    className="p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                    value={selectedCategory}
                    onChange={(e) => { setCurrentPage(1); setSelectedCategory(e.target.value); }}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat._id} value={cat.slug}>{cat.name}</option>
                    ))}
                </select>
                <select
                    className="p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                    value={filterPremium}
                    onChange={(e) => { setCurrentPage(1); setFilterPremium(e.target.value); }}
                >
                    <option value="">All Guides</option>
                    <option value="true">Premium Guides</option>
                    <option value="false">Free Guides</option>
                </select>
            </div>

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => handleOpenModal('add')}
                    className="flex items-center bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-md font-medium transition-colors duration-200 shadow-md"
                >
                    <PlusCircleIcon className="h-5 w-5 mr-2" /> Add New Guide
                </button>
            </div>

            {error && <p className="text-error-dark dark:text-error-light text-center mb-4">{error}</p>}

            {guides.length === 0 && !loading ? (
                <p className="text-center text-textSecondary dark:text-text-secondary">No guides found matching your criteria.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border dark:border-border shadow-sm">
                    <table className="min-w-full divide-y divide-border dark:divide-border">
                        <thead className="bg-background dark:bg-card-background">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider hidden sm:table-cell">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider hidden md:table-cell">Premium</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider hidden lg:table-cell">Rating</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card-background dark:bg-card-background divide-y divide-border dark:divide-border">
                            {guides.map((guideItem) => (
                                <tr key={guideItem._id} className="hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textDefault dark:text-text-default">
                                        <Link to={`${ROUTES.GUIDES}/${guideItem.slug}`} className="text-primary hover:underline">
                                            {truncateString(guideItem.title, 50)}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-text-secondary hidden sm:table-cell">{guideItem.category?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center hidden md:table-cell">
                                        {guideItem.isPremium ? (
                                            // Using custom variables for premium badge
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-accent-light text-accent-dark dark:bg-accent dark:text-black">Premium</span>
                                        ) : (
                                            // Using custom variables for free badge
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-primary dark:text-white">Free</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-text-secondary hidden lg:table-cell">
                                        <div className="flex items-center">
                                            <SolidStarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                                            {guideItem.averageRating?.toFixed(1) || '0.0'} ({guideItem.numOfReviews})
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenModal('view', guideItem)}
                                            className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:bg-[rgba(255,255,255,0.05)] mr-3 p-1 rounded-full hover:bg-primary-light transition-colors"
                                            title="View Guide"
                                        >
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal('edit', guideItem)}
                                            className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:bg-[rgba(255,255,255,0.05)] mr-3 p-1 rounded-full hover:bg-primary-light transition-colors"
                                            title="Edit Guide"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGuide(guideItem._id, guideItem.title)}
                                            className="text-error hover:text-error-dark dark:text-error-light dark:hover:bg-[rgba(255,255,255,0.05)] p-1 rounded-full hover:bg-error-light transition-colors"
                                            title="Delete Guide"
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

            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={setCurrentPage}
                pagination={pagination}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={formMode === 'add' ? 'Add New Guide' : formMode === 'edit' ? `Edit Guide: ${currentGuide?.title}` : `View Guide: ${currentGuide?.title}`}
                size="xl"
            >
                {formMode === 'view' ? (
                    <div className="space-y-4">
                        <p className="text-textDefault dark:text-text-default text-xl font-semibold">{currentGuide?.title}</p>
                        <p className="text-textSecondary dark:text-text-secondary text-sm">{currentGuide?.description}</p>
                        {currentGuide?.imageUrl && (
                            <img src={currentGuide.imageUrl} alt={currentGuide.title} className="w-full h-auto max-h-60 object-cover rounded-md" />
                        )}
                        <p className="text-sm font-medium text-textDefault dark:text-text-default">Category: {currentGuide?.category?.name}</p>
                        <p className="text-sm font-medium text-textDefault dark:text-text-default">Premium: {currentGuide?.isPremium ? 'Yes' : 'No'}</p>
                        <div className="prose dark:prose-invert max-w-none border-t border-border dark:border-border pt-4 mt-4">
                            <h4 className="text-lg font-semibold text-textDefault dark:text-text-default">Content:</h4>
                            <p className="text-textDefault dark:text-text-default">{currentGuide?.content}</p> {/* Replaced with plain text and proper color class */}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Title</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
                                className={`w-full p-2 border ${titleError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                            />
                            {titleError && <p className="mt-1 text-sm text-error">{titleError}</p>}
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Description</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => { setDescription(e.target.value); setDescriptionError(''); }}
                                rows="3"
                                className={`w-full p-2 border ${descriptionError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                            ></textarea>
                            {descriptionError && <p className="mt-1 text-sm text-error">{descriptionError}</p>}
                        </div>
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Content</label>
                            <textarea // REPLACED ReactQuill with textarea
                                id="content"
                                value={content}
                                onChange={(e) => { setContent(e.target.value); setContentError(''); }}
                                rows="8"
                                className={`w-full p-2 border ${contentError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                            ></textarea>
                            {contentError && <p className="mt-1 text-sm text-error">{contentError}</p>}
                        </div>
                        <div>
                            <label htmlFor="categoryId" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Category</label>
                            <select
                                id="categoryId"
                                value={categoryId}
                                onChange={(e) => { setCategoryId(e.target.value); setCategoryIdError(''); }}
                                className={`w-full p-2 border ${categoryIdError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                            {categoryIdError && <p className="mt-1 text-sm text-error">{categoryIdError}</p>}
                        </div>
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Image URL</label>
                            <input
                                type="text"
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => { setImageUrl(e.target.value); setImageUrlError(''); }}
                                className={`w-full p-2 border ${imageUrlError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                placeholder="Optional: URL for guide's main image"
                                disabled={formLoading}
                            />
                            {imageUrlError && <p className="mt-1 text-sm text-error">{imageUrlError}</p>}
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isPremium"
                                checked={isPremium}
                                onChange={(e) => setIsPremium(e.target.checked)}
                                className="h-4 w-4 text-primary focus:ring-primary border-border rounded dark:bg-card-background dark:border-border"
                                disabled={formLoading}
                            />
                            <label htmlFor="isPremium" className="ml-2 block text-sm text-textDefault dark:text-text-default">Premium Guide</label>
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
                                    formMode === 'add' ? 'Add Guide' : 'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}

export default ManageGuides;