// quickfix-website/client/src/pages/ResetPasswordPage.js
import React from 'react';
import ResetPassword from '../components/auth/ResetPassword'; // Reuses the ResetPassword component

function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <ResetPassword />
        </div>
    );
}

export default ResetPasswordPage;