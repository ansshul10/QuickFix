// quickfix-website/client/src/pages/Guides.js
import React from 'react';
import GuideList from '../components/guides/GuideList'; // Reuses the GuideList component
import Breadcrumbs from '../components/common/Breadcrumbs'; // For navigation clarity
import SearchBar from '../components/guides/SearchBar'; // Optional standalone search bar

function Guides() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Breadcrumbs />
            </div>

            {/* Optional: A prominent search bar above the list */}
            {/* <SearchBar /> */}

            <GuideList /> {/* The core guide listing component */}
        </div>
    );
}

export default Guides;