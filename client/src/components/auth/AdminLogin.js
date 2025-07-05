// quickfix-website/client/src/components/auth/AdminLogin.js
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import motion for animations
import Tilt from 'react-parallax-tilt'; // Import Tilt for parallax effect
import { toast } from 'react-toastify'; // Import toast for messages

import { AuthContext } from '../../context/AuthContext';
import { SettingsContext } from '../../context/SettingsContext';
import { validateEmail, validatePassword } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';
// Removed LoadingSpinner import as it's not used directly here anymore for form loading.

// Assets
import LoginBg from '../../assets/images/Login_bg.png'; // Use the same background image

// --- SVG ICONS --- (Re-used from Login/Register for consistency)
const MailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 0 01-4.5 1.207" /></svg>);
const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const EyeIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064 7-9.542 7 .847 0 1.67.111 2.458.317M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 2.298V12c0-1.149-.22-2.26-.635-3.302M12 12l3 3m-3-3l-3-3" /></svg>);
const UserShieldIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-primary-light"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-2.25M12 1.5l-6 6V12m6-10.5l6 6V12m-6-10.5v11.25m-9.75 0l-4.5 4.5v1.657M21.75 12l-4.5 4.5v1.657m-12.75 0h11.25" /></svg>);


// --- Reusable FormInput Component ---
// This is assumed to be defined globally or imported from a common place.
// Included here for direct context as per your request format.
const FormInput = ({ id, name, type, value, onChange, placeholder, error, icon, children }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
        <input id={id} name={name} type={type} required className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500/50' : 'border-gray-300/20'} bg-black/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent transition-all placeholder-gray-500`} placeholder={placeholder} value={value} onChange={onChange} autoComplete="off" />
        {children}
        {error && (<motion.p className="mt-2 text-sm text-red-400" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p>)}
    </div>
);


function AdminLogin() {
    const { login, user, loading: authLoading } = useContext(AuthContext);
    const { loadingSettings } = useContext(SettingsContext); // Removed `settings` as it's not directly used here
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // For password visibility toggle


    // Redirect if already logged in as admin
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role === 'admin') {
                const from = location.state?.from?.pathname || ROUTES.ADMIN_DASHBOARD;
                navigate(from, { replace: true });
            } else {
                // If logged in as regular user, redirect from admin login
                navigate(ROUTES.PROFILE, { replace: true });
            }
        }
    }, [user, authLoading, navigate, location.state]);

    // Show initial full-screen loading spinner while auth and settings are loading
    if (loadingSettings || authLoading) {
        // You can return a simple div with message, as full-screen LoadingSpinner is handled by App.js
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed p-4" style={{ backgroundImage: `url(${LoginBg})` }}>
                <div className="text-center bg-black/60 backdrop-blur-lg p-10 rounded-2xl shadow-xl border border-gray-100/10">
                    <h1 className="text-4xl font-bold text-primary-light mb-4">Loading...</h1>
                    <p className="text-lg text-gray-200 max-w-md">
                        Please wait while we prepare the admin login page.
                    </p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        setEmailError('');
        setPasswordError('');

        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password); // Using general password validation

        if (emailValidation) setEmailError(emailValidation);
        if (passwordValidation) setPasswordError(passwordValidation);

        if (emailValidation || passwordValidation) {
            toast.error("Please correct the errors in the form.", { toastId: 'admin-login-validation-error' }); // Added toast
            return;
        }

        setFormLoading(true);
        // The `login` function handles the backend call. Backend will verify role and show toasts.
        const result = await login(email, password);
        setFormLoading(false);

        if (result.success) {
            // Redirection handled by useEffect based on user.role in AuthContext
        } else {
            // AuthContext handles error toasts (e.g., invalid credentials, not admin).
        }
    };

    // Framer Motion variants for animated elements (consistent with other auth forms)
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };
    const itemVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } };
    const formContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
    const formItemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };


    return (
        <div className="rounded-3xl min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed p-4 sm:p-6 lg:p-8" style={{ backgroundImage: `url(${LoginBg})` }}>
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 max-w-screen-2xl w-full mx-auto items-center">
                {/* Left side: Admin-specific marketing/info */}
                <motion.div
                    className="text-white flex-col justify-center text-shadow-lg hidden lg:flex"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants}>
                        <h1 className="text-5xl xl:text-6xl font-bold mb-4 leading-tight">Secure Admin Access.</h1>
                        <h2 className="text-3xl xl:text-4xl font-semibold mb-6 text-primary-light/90">Your Gateway to Control.</h2>
                        <p className="text-lg xl:text-xl text-gray-200/90 max-w-2xl">
                            This panel provides powerful tools to manage website content, users, and settings.
                            Ensure your credentials are secure and access is restricted to authorized personnel.
                        </p>
                    </motion.div>
                </motion.div>

                {/* Right side: Admin Login Form */}
                <motion.div variants={formContainerVariants} initial="hidden" animate="visible">
                    <Tilt className="transform-style-3d h-full" tiltMaxAngleX={3} tiltMaxAngleY={3} perspective={1000} transitionSpeed={1500} scale={1.01} glareEnable={true} glareMaxOpacity={0.15} glareColor="#ffffff" glarePosition="all" glareBorderRadius="1.5rem">
                        <motion.div variants={formItemVariants} className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-gray-100/10 shadow-2xl p-8 lg:p-12 transform-style-3d h-full flex flex-col justify-center">
                            <div className="text-center mb-8">
                                <UserShieldIcon className="mx-auto mb-4" /> {/* Replaced UserCircleIcon for more admin feel */}
                                <h2 className="text-4xl font-extrabold text-white">Admin Sign In</h2>
                                <p className="text-gray-400 mt-2">Access the administrative dashboard.</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                                <FormInput
                                    id="admin-email-address"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                                    placeholder="Admin Email address"
                                    error={emailError}
                                    icon={<MailIcon />}
                                />
                                <FormInput
                                    id="admin-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                                    placeholder="Admin Password"
                                    error={passwordError}
                                    icon={<LockIcon />}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </FormInput>

                                <div className="text-sm text-right">
                                    <Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-primary-light hover:text-primary-lighter transition-colors">
                                        Forgot admin password?
                                    </Link>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 min-h-[52px]"
                                    >
                                        {formLoading ? (
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        ) : (
                                            'Sign in as Admin'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </Tilt>
                </motion.div>
            </main>
        </div>
    );
}

export default AdminLogin;