// quickfix-website/client/src/components/guides/GuideDetail.js
import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GuideContext } from '../../context/GuideContext';
import { AuthContext } from '../../context/AuthContext';
import { SettingsContext } from '../../context/SettingsContext';
import LoadingSpinner from '../common/LoadingSpinner';
import RatingReview from './RatingReview';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify'; // CORRECTED: Ensure this is imported and installed
import { formatDate } from '../../utils/formatters';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
// REMOVED: import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline'; // UNUSED, CAN BE REMOVED
import { ROUTES } from '../../utils/constants';

// Add a specific component for comments to keep GuideDetail cleaner
function CommentSection({ comments, guideId, addComment, loadingComments, enableComments }) {
    const { user } = useContext(AuthContext);
    const [newComment, setNewComment] = useState('');
    const [commentError, setCommentError] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        setCommentError('');
        if (!newComment.trim()) {
            setCommentError('Comment cannot be empty.');
            return;
        }
        if (!user) {
            toast.error("You must be logged in to comment.");
            return;
        }

        setSubmittingComment(true);
        const success = await addComment(guideId, newComment.trim());
        if (success) {
            setNewComment('');
        }
        setSubmittingComment(false);
    };

    if (!enableComments && (!user || user.role !== 'admin')) {
        return (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-textSecondary dark:text-gray-400 text-center mt-8">
                Commenting is currently disabled.
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h3 className="text-2xl font-semibold text-textDefault dark:text-white mb-4">Comments ({comments?.length || 0})</h3>

            {user && enableComments && (
                <form onSubmit={handleCommentSubmit} className="mb-8 p-4 bg-cardBackground dark:bg-gray-700 rounded-lg shadow-sm border border-border dark:border-gray-600">
                    <textarea
                        className={`w-full p-3 rounded-md border ${commentError ? 'border-error' : 'border-border'} dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary`}
                        rows="3"
                        placeholder="Add your comment..."
                        value={newComment}
                        onChange={(e) => { setNewComment(e.target.value); setCommentError(''); }}
                        disabled={submittingComment}
                    ></textarea>
                    {commentError && <p className="text-error text-sm mt-1">{commentError}</p>}
                    <button
                        type="submit"
                        className="mt-3 px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={submittingComment}
                    >
                        {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                </form>
            )}

            {loadingComments ? (
                <LoadingSpinner message="Loading comments..." />
            ) : comments && comments.length > 0 ? (
                <div className="space-y-6">
                    {comments.map(comment => (
                        <div key={comment._id} className="bg-cardBackground dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-border dark:border-gray-600">
                            <div className="flex items-center mb-2">
                                <img
                                    src={comment.user?.profilePicture || '/images/default-avatar.png'}
                                    alt={comment.user?.username}
                                    className="w-8 h-8 rounded-full object-cover mr-3"
                                />
                                <div>
                                    <p className="font-semibold text-textDefault dark:text-white">{comment.user?.username || 'Anonymous'}</p>
                                    <p className="text-xs text-textSecondary dark:text-gray-400">{formatDate(comment.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                            </div>
                            <p className="text-textDefault dark:text-gray-200">{comment.content}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-textSecondary dark:text-gray-400">No comments yet. Be the first to comment!</p>
            )}
            {!user && enableComments && (
                <p className="text-textSecondary dark:text-gray-400 text-center mt-4">
                    <Link to={ROUTES.LOGIN} className="text-primary hover:underline">Log in</Link> to add a comment.
                </p>
            )}
        </div>
    );
}


function GuideDetail() {
    const { slug } = useParams();
    const { guide, loading, error, fetchGuideBySlug, addComment, addRating } = useContext(GuideContext);
    const { user, loading: authLoading } = useContext(AuthContext);
    const { settings, loadingSettings } = useContext(SettingsContext);

    useEffect(() => {
        fetchGuideBySlug(slug);
    }, [slug, fetchGuideBySlug]);

    if (loading || authLoading || loadingSettings) {
        return <LoadingSpinner fullScreen={true} message="Loading guide details..." />;
    }

    if (error) {
        return (
            <div className="text-center py-12 text-error dark:text-error-light text-lg mt-8">
                {error}. <Link to={ROUTES.GUIDES} className="text-primary hover:underline">Go back to guides</Link>
                {error.includes("premium users only") && !user?.isPremium && (
                    <p className="mt-4 text-textSecondary dark:text-gray-400">
                        <Link to={ROUTES.PREMIUM} className="text-accent hover:underline font-semibold">Upgrade to Premium</Link> to access this content.
                    </p>
                )}
            </div>
        );
    }

    if (!guide) {
        return <div className="text-center py-12 text-textSecondary dark:text-gray-400 text-lg mt-8">Guide not found.</div>;
    }

    const cleanContent = DOMPurify.sanitize(guide.content, {
        USE_PROFILES: { html: true },
    });

    const enableComments = settings?.enableComments;
    const enableRatings = settings?.enableRatings;


    return (
        <div className="container mx-auto px-4 py-8 bg-background">
            <div className="max-w-4xl mx-auto bg-cardBackground dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-border dark:border-gray-700">
                <div className="mb-6">
                    <h1 className="text-4xl font-extrabold text-textDefault dark:text-white mb-3">{guide.title}</h1>
                    <p className="text-lg text-textSecondary dark:text-gray-400 mb-4">{guide.description}</p>
                    <div className="flex flex-wrap items-center text-sm text-textSecondary dark:text-gray-400 space-x-4 mb-4">
                        <span>By <span className="font-medium text-primary">{guide.user?.username || 'Unknown'}</span></span>
                        <span>|</span>
                        <span>Category: <span className="font-medium text-primary">{guide.category?.name || 'Uncategorized'}</span></span>
                        <span>|</span>
                        <span>Published: {formatDate(guide.createdAt, { dateStyle: 'medium' })}</span>
                        {guide.isPremium && (
                            <>
                                <span>|</span>
                                <span className="flex items-center text-accent font-semibold">
                                    <SolidStarIcon className="h-4 w-4 mr-1" /> Premium
                                </span>
                            </>
                        )}
                    </div>
                    {guide.imageUrl && (
                        <img
                            src={guide.imageUrl}
                            alt={guide.title}
                            className="w-full h-80 object-cover rounded-lg shadow-md mb-6"
                        />
                    )}
                </div>

                <div className="prose dark:prose-invert max-w-none text-textDefault dark:text-gray-200 leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
                </div>

                {enableRatings && (
                    <div className="mt-8 border-t border-border dark:border-gray-700 pt-6">
                        <h3 className="text-2xl font-semibold text-textDefault dark:text-white mb-4">Ratings & Reviews</h3>
                        <div className="flex items-center space-x-2 mb-4">
                            <SolidStarIcon className="h-6 w-6 text-yellow-400" />
                            <span className="text-xl font-bold text-textDefault dark:text-white">
                                {guide.averageRating?.toFixed(1) || '0.0'}
                            </span>
                            <span className="text-textSecondary dark:text-gray-400">
                                ({guide.numOfReviews} reviews)
                            </span>
                        </div>
                        {user ? (
                            <RatingReview guideId={guide._id} addRating={addRating} currentRating={guide.userRating} />
                        ) : (
                            <p className="text-textSecondary dark:text-gray-400">
                                <Link to={ROUTES.LOGIN} className="text-primary hover:underline">Log in</Link> to add your rating.
                            </p>
                        )}
                    </div>
                )}

                <CommentSection
                    comments={guide.comments}
                    guideId={guide._id}
                    addComment={addComment}
                    loadingComments={loading}
                    enableComments={enableComments}
                />
            </div>
        </div>
    );
}

export default GuideDetail;