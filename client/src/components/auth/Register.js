// quickfix-website/client/src/components/auth/Register.js
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { toast } from 'react-toastify';

// Contexts & Utils
import { AuthContext } from '../../context/AuthContext';
import { SettingsContext } from '../../context/SettingsContext';
import { validateUsername, validateEmail, validatePassword, validateConfirmPassword } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';

// Assets & Icons
import RegisterBg from '../../assets/images/Login_bg.png'; // Corrected path if needed, ensure it's accurate

// --- SVG ICONS ---
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 0 00-7-7z" /></svg>);
const MailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>);
const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const EyeIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064 7-9.542 7 .847 0 1.67.111 2.458.317M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 2.298V12c0-1.149-.22-2.26-.635-3.302M12 12l3 3m-3-3l-3-3" /></svg>);

// --- Reusable Components ---
const FormInput = ({ id, name, type, value, onChange, placeholder, error, icon, children }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
        <input id={id} name={name} type={type} required className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500/50' : 'border-gray-300/20'} bg-black/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent transition-all placeholder-gray-500`} placeholder={placeholder} value={value} onChange={onChange} autoComplete="off" />
        {children}
        {error && (<motion.p className="mt-2 text-sm text-red-400" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p>)}
    </div>
);

function Register() {
    const { register, user, loading: authLoading } = useContext(AuthContext);
    const { settings, loadingSettings } = useContext(SettingsContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newsletterSubscriber, setNewsletterSubscriber] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [formLoading, setFormLoading] = useState(false); // State for button-specific loading

    useEffect(() => {
        // Redirect authenticated users away from the register page
        // If user is logged in (either verified or unverified), they shouldn't be on the register page.
        // The AuthContext's login/register handles specific redirects based on verification status.
        if (!authLoading && user) {
            navigate(ROUTES.PROFILE, { replace: true });
        }
    }, [user, authLoading, navigate]);

    // Display loading or registration closed message if settings are still loading or registration is disabled
    // This is the initial full-screen load
    if (loadingSettings || authLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed p-4" style={{ backgroundImage: `url(${RegisterBg})` }}>
                <div className="text-center bg-black/60 backdrop-blur-lg p-10 rounded-2xl shadow-xl border border-gray-100/10">
                    <h1 className="text-4xl font-bold text-primary-light mb-4">Loading...</h1>
                    <p className="text-lg text-gray-200 max-w-md">
                        Please wait while we load the registration settings.
                    </p>
                </div>
            </div>
        );
    }

    // If registration is not allowed and user is not an admin, show a message
    if (!settings?.allowRegistration && (!user || user.role !== 'admin')) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed p-4" style={{ backgroundImage: `url(${RegisterBg})` }}>
                <div className="text-center bg-black/60 backdrop-blur-lg p-10 rounded-2xl shadow-xl border border-gray-100/10">
                    <h1 className="text-4xl font-bold text-primary-light mb-4">Registration Closed</h1>
                    <p className="text-lg text-gray-200 max-w-md">
                        New user registration is currently disabled by the administrator. Please check back later.
                    </p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Clear previous errors
        setUsernameError(''); setEmailError(''); setPasswordError(''); setConfirmPasswordError('');

        // Perform validations
        const usernameValidation = validateUsername(username);
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);
        const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);

        let hasError = false;
        if (usernameValidation) { setUsernameError(usernameValidation); hasError = true; }
        if (emailValidation) { setEmailError(emailValidation); hasError = true; }
        if (passwordValidation) { setPasswordError(passwordValidation); hasError = true; }
        if (confirmPasswordValidation) { setConfirmPasswordError(confirmPasswordValidation); hasError = true; }

        // If any client-side validation fails, stop the submission and show a single error toast
        if (hasError) {
            toast.error("Please correct the errors in the form.", { toastId: 'form-validation-error' });
            return;
        }

        setFormLoading(true); // Start loading animation on the button
        const result = await register(username, email, password, confirmPassword, newsletterSubscriber);
        setFormLoading(false); // Stop loading animation on the button

        if (result.success) {
            // AuthContext already handles the success toast and redirects to profile.
        } else {
            // AuthContext already handles the toast.error for API failures.
        }
    };

    // Framer Motion variants for animated elements
    const formItemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

    return (
        <div className="rounded-3xl min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-center p-4" style={{ backgroundImage: `url(${RegisterBg})` }}>
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8 max-w-screen-2xl w-full">
                {/* Left side: Marketing text (hidden on small screens) */}
                <motion.div
                    className="text-white flex-col justify-center text-shadow-lg hidden lg:flex"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl xl:text-6xl font-bold mb-4 leading-tight">Begin Your Journey.</h1>
                    <h2 className="text-3xl xl:text-4xl font-semibold mb-6 text-primary-light/90">Create Your Free Account.</h2>
                    <p className="text-lg text-gray-300">
                        Unlock a world of exclusive content, personalized guides, and community support.
                        Join us today and take the first step towards mastering your skills.
                    </p>
                </motion.div>

                {/* Right side: Registration Form */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Tilt className="transform-style-3d h-full" tiltMaxAngleX={3} tiltMaxAngleY={3}>
                        <motion.div variants={formItemVariants} className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-gray-100/10 shadow-2xl p-8 lg:p-12 h-full flex flex-col justify-center">
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-extrabold text-white">Create Account</h2>
                                <p className="text-gray-400 mt-2">Join QuickFix and get started!</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                                {/* Username Input */}
                                <FormInput
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Choose a username"
                                    error={usernameError}
                                    icon={<UserIcon />}
                                />
                                {/* Email Input */}
                                <FormInput
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    error={emailError}
                                    icon={<MailIcon />}
                                />

                                {/* Password Input with Toggle */}
                                <FormInput
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a password"
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

                                {/* Confirm Password Input with Toggle */}
                                <FormInput
                                    id="confirm-password"
                                    name="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    error={confirmPasswordError}
                                    icon={<LockIcon />}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </FormInput>

                                {/* Newsletter Subscription Checkbox */}
                                <div className="flex items-center">
                                    <input
                                        id="newsletter-subscribe"
                                        name="newsletter-subscribe"
                                        type="checkbox"
                                        checked={newsletterSubscriber}
                                        onChange={(e) => setNewsletterSubscriber(e.target.checked)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="newsletter-subscribe" className="ml-2 block text-sm text-gray-300">
                                        Subscribe to our newsletter for updates and tips!
                                    </label>
                                </div>

                                {/* Submit Button with Loading Spinner */}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full flex justify-center items-center py-3 px-4 text-lg font-semibold rounded-xl text-white bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all min-h-[52px]"
                                    >
                                        {formLoading ? (
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> // Inline spinner
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Link to Login Page */}
                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-300">
                                    Already have an account?{' '}
                                    <Link to={ROUTES.LOGIN} className="font-medium text-primary-light hover:text-primary-lighter transition-colors">Sign In</Link>
                                </p>
                            </div>
                        </motion.div>
                    </Tilt>
                </motion.div>
            </main>
        </div>
    );
}

export default Register;