// quickfix-website/client/src/pages/ForgotPasswordPage.js
import React from 'react';
import ForgotPassword from '../components/auth/ForgotPassword'; // Reuses the ForgotPassword component

function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <ForgotPassword />
        </div>
    );
}

export default ForgotPasswordPage;