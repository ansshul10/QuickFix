// quickfix-website/client/src/components/auth/AdminRegister.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import motion for animations
import Tilt from 'react-parallax-tilt'; // Import Tilt for parallax effect
import { toast } from 'react-toastify';

import { AuthContext } from '../../context/AuthContext';
// Removed SettingsContext import as it's not directly used for UI logic here.
import { validateUsername, validateEmail, validatePassword, validateConfirmPassword } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';
// Removed LoadingSpinner import as it's not used directly here for form loading.

// Assets
import RegisterBg from '../../assets/images/Login_bg.png'; // Use the same background image

// --- SVG ICONS --- (Re-used from Login/Register for consistency)
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 0 00-7-7z" /></svg>);
const MailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 0 01-4.5 1.207" /></svg>);
const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const EyeIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064 7-9.542 7 .847 0 1.67.111 2.458.317M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 2.298V12c0-1.149-.22-2.26-.635-3.302M12 12l3 3m-3-3l-3-3" /></svg>);
const AdminShieldIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-red-400"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6.75v12.006A2.25 2.25 0 003.75 21z" /></svg>);

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


function AdminRegister() {
    // Only 'register' and 'user' are strictly needed from AuthContext for this component's logic.
    const { register, user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const [formLoading, setFormLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // For password visibility toggle
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // For confirm password visibility toggle


    // Redirect if already logged in as admin
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role === 'admin') {
                toast.info("You are already logged in as admin.", { toastId: 'admin-register-redirect-info' });
                navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
            } else {
                toast.info("You are already logged in.", { toastId: 'admin-register-redirect-user' });
                navigate(ROUTES.HOME, { replace: true });
            }
        }
    }, [user, authLoading, navigate]);

    // IMPORTANT: In a real application, this component should NOT be publicly accessible.
    // Admin registration should be handled via database seeding, a dedicated CLI,
    // or a highly secured internal tool. This is a placeholder for the structure.
    useEffect(() => {
        toast.warn("Admin registration is not publicly accessible. This component is for structural demonstration only. Do NOT expose this route in production.", { autoClose: false, toastId: 'admin-register-warning' });
        // Optionally redirect away immediately if not in development or testing.
        // if (process.env.NODE_ENV === 'production') {
        //     navigate(ROUTES.HOME, { replace: true });
        // }
    }, []);


    const handleSubmit = async (e) => {
        e.preventDefault();

        setUsernameError('');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');

        const usernameValidation = validateUsername(username);
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);
        const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);

        let hasError = false;
        if (usernameValidation) { setUsernameError(usernameValidation); hasError = true; }
        if (emailValidation) { setEmailError(emailValidation); hasError = true; }
        if (passwordValidation) { setPasswordError(passwordValidation); hasError = true; }
        if (confirmPasswordValidation) { setConfirmPasswordError(confirmPasswordValidation); hasError = true; }

        if (hasError) {
            toast.error("Please correct the errors in the form.", { toastId: 'admin-register-validation-error' }); // Added toast
            return;
        }

        setFormLoading(true);
        // Pass 'admin' role directly to the register function.
        // The backend will enforce that only authorized entities can actually set this role.
        const result = await register(username, email, password, confirmPassword, false /* no newsletter for admin register */, 'admin'); // Pass role directly
        setFormLoading(false);

        if (result.success) {
            // AuthContext's register function already handles redirection and toasts based on success/failure.
        } else {
            // Toast handled by AuthContext.
        }
    };

    // Framer Motion variants for animated elements (consistent with other auth forms)
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };
    const itemVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } };
    const formContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
    const formItemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };


    return (
        <div className="rounded-3xl min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed p-4 sm:p-6 lg:p-8" style={{ backgroundImage: `url(${RegisterBg})` }}>
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 max-w-screen-2xl w-full mx-auto items-center">
                {/* Left side: Admin Register Warning/Info */}
                <motion.div
                    className="text-white flex-col justify-center text-shadow-lg hidden lg:flex"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants}>
                        <h1 className="text-5xl xl:text-6xl font-bold mb-4 leading-tight text-red-400">Restricted Access.</h1>
                        <h2 className="text-3xl xl:text-4xl font-semibold mb-6 text-red-500/90">Admin Registration Only.</h2>
                        <p className="text-lg xl:text-xl text-gray-200/90 max-w-2xl">
                            This page is for creating administrator accounts. In a production environment,
                            this functionality should be strictly controlled and not publicly accessible.
                        </p>
                    </motion.div>
                </motion.div>

                {/* Right side: Admin Register Form */}
                <motion.div variants={formContainerVariants} initial="hidden" animate="visible">
                    <Tilt className="transform-style-3d h-full" tiltMaxAngleX={3} tiltMaxAngleY={3} perspective={1000} transitionSpeed={1500} scale={1.01} glareEnable={true} glareMaxOpacity={0.15} glareColor="#ffffff" glarePosition="all" glareBorderRadius="1.5rem">
                        <motion.div variants={formItemVariants} className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-gray-100/10 shadow-2xl p-8 lg:p-12 transform-style-3d h-full flex flex-col justify-center">
                            <div className="text-center mb-8">
                                <AdminShieldIcon className="mx-auto mb-4" /> {/* Icon for Admin Register */}
                                <h2 className="text-4xl font-extrabold text-white">Admin Register</h2>
                                <p className="text-gray-400 mt-2">Create a new admin account.</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                                <FormInput
                                    id="admin-reg-username"
                                    name="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
                                    placeholder="Admin Username"
                                    error={usernameError}
                                    icon={<UserIcon />}
                                />
                                <FormInput
                                    id="admin-reg-email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                                    placeholder="Admin Email address"
                                    error={emailError}
                                    icon={<MailIcon />}
                                />
                                {/* Password Input with Toggle */}
                                <FormInput
                                    id="admin-reg-password"
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
                                {/* Confirm Password Input with Toggle */}
                                <FormInput
                                    id="admin-reg-confirm-password"
                                    name="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(''); }}
                                    placeholder="Confirm Admin Password"
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

                                <div>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[52px]" // Ensure min-h
                                    >
                                        {formLoading ? (
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        ) : (
                                            'Register as Admin'
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

export default AdminRegister;