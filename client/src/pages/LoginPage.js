// quickfix-website/client/src/pages/LoginPage.js
import React from 'react';
import Login from '../components/auth/Login'; // Reuses the Login component

function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Login />
        </div>
    );
}

export default LoginPage;