// quickfix-website/client/src/components/common/LoadingSpinner.js
import React from 'react';

// This component is now primarily for full-screen application loading or large section loading.
// For in-button spinners, a custom spinner element is often directly embedded in the button.
// However, we can also make this component flexible enough to be used as an inline spinner.

function LoadingSpinner({ size = 'md', message = '', fullScreen = false, inline = false }) {
    // Define spinner size classes based on prop
    // These are for the spinner element itself.
    const spinnerSizeClass = {
        sm: 'h-4 w-4 border-2', // Smaller for inline buttons
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-3',
        xl: 'h-12 w-12 border-4',
    }[size];

    // Define wrapper classes based on fullScreen/inline prop
    let wrapperClass = 'flex items-center justify-center'; // Default inline alignment
    if (fullScreen) {
        wrapperClass = 'fixed inset-0 flex items-center justify-center bg-background bg-opacity-75 z-[9999]';
    } else if (!inline) { // For block-level loading but not full screen
        wrapperClass = 'flex items-center justify-center my-8';
    }
    // If 'inline' is true, the default 'flex items-center justify-center' is often sufficient,
    // as the parent component will control its positioning.

    return (
        <div className={wrapperClass}>
            <div className={`flex ${message ? 'flex-col' : 'flex-row'} items-center ${message ? 'space-y-3' : 'space-x-2'}`}>
                <div
                    className={`animate-spin rounded-full border-t-2 border-r-2 border-b-2 border-primary-light ${spinnerSizeClass}`}
                    role="status"
                >
                    <span className="sr-only">Loading...</span>
                </div>
                {message && (
                    <p className="text-lg font-medium text-textSecondary dark:text-gray-400">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}

export default LoadingSpinner;