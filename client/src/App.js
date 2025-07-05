// quickfix-website/client/src/App.js
import React, { useContext, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

// Contexts
import { AuthContext } from './context/AuthContext';
import { ThemeContext } from './context/ThemeContext';
import { SettingsContext } from './context/SettingsContext';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CookieConsent from './components/common/CookieConsent';
import LoadingSpinner from './components/common/LoadingSpinner'; // Keep this import
import Modal from './components/common/Modal';

// Pages
import HomePage from './pages/Home';
import AboutPage from './pages/About';
import ContactPage from './pages/Contact';
import GuidesPage from './pages/Guides';
import GuidePage from './pages/GuidePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import PremiumPage from './pages/PremiumPage';
import NotificationsPage from './pages/NotificationsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import SearchResultsPage from './pages/SearchResultsPage';
import NotFound from './pages/NotFound';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Check if user data is still loading OR if user is not present OR if role is not allowed
    // Only redirect if loading is FALSE, otherwise, show spinner to prevent flash of content.
    useEffect(() => {
        if (!loading && !user) {
            toast.info("You need to log in to access this page.", { autoClose: 2000, toastId: 'login-required' });
            navigate('/login', { state: { from: location.pathname }, replace: true });
        } else if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
            toast.error("You do not have permission to view this page.", { autoClose: 2000, toastId: 'permission-denied' });
            navigate('/', { replace: true });
        }
    }, [user, loading, allowedRoles, navigate, location]);

    // Show initial loading spinner for routes that require auth/roles
    // This spinner is for the initial load/auth check, not form submissions.
    if (loading || (!user && !loading) || (user && allowedRoles && !allowedRoles.includes(user.role))) {
        return <LoadingSpinner fullScreen />; // Use fullScreen for initial app/route loading
    }

    return children;
};

// Public Route Wrapper with Maintenance Mode Check
const PublicRouteWrapper = ({ children, hideDuringMaintenance = false }) => {
    const { settings, loadingSettings } = useContext(SettingsContext);
    const { user, loading: authLoading } = useContext(AuthContext);

    // Show initial loading spinner if settings or auth state are still loading
    if (loadingSettings || authLoading) {
        return <LoadingSpinner fullScreen />; // Use fullScreen for initial app load
    }

    const isMaintenanceMode = settings?.websiteMaintenanceMode;

    if (isMaintenanceMode) {
        if (user && user.role === 'admin') {
            return children; // Admin bypasses maintenance
        }

        if (hideDuringMaintenance) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center bg-background text-textDefault p-8 rounded-lg shadow-lg">
                    <h1 className="text-4xl font-bold text-primary mb-4">Website Under Maintenance</h1>
                    <p className="text-lg text-textSecondary max-w-md">We're performing some essential updates. We'll be back shortly!</p>
                    {settings?.contactEmail && (
                        <p className="mt-4 text-textSecondary">For urgent inquiries, please contact us at <a href={`mailto:${settings.contactEmail}`} className="text-primary hover:underline">{settings.contactEmail}</a>.</p>
                    )}
                </div>
            );
        }
    }
    return children;
};

function App() {
    const { theme } = useContext(ThemeContext);
    const { settings, loadingSettings } = useContext(SettingsContext);
    const { loading: authLoading } = useContext(AuthContext); // Get AuthContext's loading state

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
    }, [theme]);

    useEffect(() => {
        if (!loadingSettings && settings?.globalAnnouncement) {
            // Consider using a dedicated banner component for global announcements
            // toast.info(settings.globalAnnouncement, { autoClose: false, closeButton: true, toastId: 'global-announcement' });
        }
    }, [settings, loadingSettings]);

    // Show initial full-screen loading spinner only when the app is first loading its core contexts
    if (authLoading || loadingSettings) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-textDefault transition-colors duration-300">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                    <Route path="/" element={<PublicRouteWrapper><HomePage /></PublicRouteWrapper>} />
                    <Route path="/about" element={<PublicRouteWrapper><AboutPage /></PublicRouteWrapper>} />
                    <Route path="/contact" element={<PublicRouteWrapper><ContactPage /></PublicRouteWrapper>} />
                    <Route path="/guides" element={<PublicRouteWrapper><GuidesPage /></PublicRouteWrapper>} />
                    <Route path="/guides/:slug" element={<PublicRouteWrapper><GuidePage /></PublicRouteWrapper>} />
                    <Route path="/privacy-policy" element={<PublicRouteWrapper><PrivacyPolicyPage /></PublicRouteWrapper>} />
                    <Route path="/cookie-policy" element={<PublicRouteWrapper><CookiePolicyPage /></PublicRouteWrapper>} />
                    <Route path="/search-results" element={<PublicRouteWrapper><SearchResultsPage /></PublicRouteWrapper>} />
                    <Route path="/premium" element={<PublicRouteWrapper><PremiumPage /></PublicRouteWrapper>} />

                    <Route path="/login" element={<PublicRouteWrapper hideDuringMaintenance><LoginPage /></PublicRouteWrapper>} />
                    <Route path="/register" element={<PublicRouteWrapper hideDuringMaintenance><RegisterPage /></PublicRouteWrapper>} />
                    {/* Adjusted routes for email verification */}
                    <Route path="/verify-email" element={<PublicRouteWrapper hideDuringMaintenance><EmailVerificationPage /></PublicRouteWrapper>} />
                    <Route path="/verify-email/:token" element={<PublicRouteWrapper hideDuringMaintenance><EmailVerificationPage /></PublicRouteWrapper>} />
                    <Route path="/forgotpassword" element={<PublicRouteWrapper hideDuringMaintenance><ForgotPasswordPage /></PublicRouteWrapper>} />
                    <Route path="/resetpassword/:resettoken" element={<PublicRouteWrapper hideDuringMaintenance><ResetPasswordPage /></PublicRouteWrapper>} />

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute allowedRoles={['user', 'admin']}>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/notifications"
                        element={
                            <ProtectedRoute allowedRoles={['user', 'admin']}>
                                <NotificationsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin-dashboard/*"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboardPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <CookieConsent />
            <Footer />
        </div>
    );
}

export default App;