// quickfix-website/client/src/pages/RegisterPage.js
import React from 'react';
import Register from '../components/auth/Register'; // Reuses the Register component

function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Register />
        </div>
    );
}

export default RegisterPage;