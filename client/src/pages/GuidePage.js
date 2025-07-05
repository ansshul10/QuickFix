// quickfix-website/client/src/pages/GuidePage.js
import React from 'react';
import GuideDetail from '../components/guides/GuideDetail'; // Reuses the GuideDetail component
import Breadcrumbs from '../components/common/Breadcrumbs'; // For navigation clarity
import { useParams } from 'react-router-dom';
import { capitalizeFirstLetter } from '../utils/formatters';

function GuidePage() {
    const { slug } = useParams(); // Get slug to pass to breadcrumbs
    
    // Custom breadcrumbs for guide detail page
    const customBreadcrumbs = [
        { name: 'Guides', path: '/guides' },
        { name: capitalizeFirstLetter(slug.replace(/-/g, ' ')), path: `/guides/${slug}` }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Breadcrumbs customSegments={customBreadcrumbs} />
            </div>
            <GuideDetail /> {/* The core guide detail component */}
        </div>
    );
}

export default GuidePage;