// quickfix-website/client/src/pages/ProfilePage.js
import React from 'react';
import Profile from '../components/auth/Profile'; // Reuses the Profile component
import Breadcrumbs from '../components/common/Breadcrumbs';

function ProfilePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Breadcrumbs customSegments={[{name: 'Profile', path: '/profile'}]} />
            </div>
            <Profile />
        </div>
    );
}

export default ProfilePage;