// quickfix-website/client/src/components/auth/ResetPassword.js
import React, { useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Import Link
import { AuthContext } from '../../context/AuthContext';
import { validatePassword, validateConfirmPassword } from '../../utils/validation';
import { motion } from 'framer-motion'; // Import motion for animations
import Tilt from 'react-parallax-tilt'; // Import Tilt for parallax effect
import { toast } from 'react-toastify'; // Import toast for messages

import { ROUTES } from '../../utils/constants';

// Assets
import LoginBg from '../../assets/images/Login_bg.png'; // Use the same background image

// --- SVG ICONS --- (Re-used from Login/Register for consistency)
const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const EyeIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064 7-9.542 7 .847 0 1.67.111 2.458.317M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 2.298V12c0-1.149-.22-2.26-.635-3.302M12 12l3 3m-3-3l-3-3" /></svg>);

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


function ResetPassword() {
    const { resetPassword } = useContext(AuthContext);
    const { resettoken } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [formLoading, setFormLoading] = useState(false); // Controls button loading
    const [showPassword, setShowPassword] = useState(false); // For password visibility toggle
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // For confirm password visibility toggle

    const handleSubmit = async (e) => {
        e.preventDefault();

        setPasswordError('');
        setConfirmPasswordError('');

        const passwordValidation = validatePassword(password);
        const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);

        if (passwordValidation) setPasswordError(passwordValidation);
        if (confirmPasswordValidation) setConfirmPasswordError(confirmPasswordValidation);

        if (passwordValidation || confirmPasswordValidation) {
            toast.error("Please correct the errors in the form.", { toastId: 'reset-password-validation-error' }); // Added toast
            return;
        }

        setFormLoading(true);
        const result = await resetPassword(resettoken, password, confirmPassword);
        setFormLoading(false);

        if (result.success) {
            navigate(ROUTES.PROFILE, { replace: true });
        }
        // AuthContext already handles success/error toasts for the API call result.
    };

    // Framer Motion variants for animated elements (consistent with Login/Register)
    const formItemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
    const textFadeInVariants = { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.8 } } };
    const formContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };


    return (
        <div className="rounded-3xl min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed p-4 sm:p-6 lg:p-8" style={{ backgroundImage: `url(${LoginBg})` }}>
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 max-w-screen-2xl w-full mx-auto items-center">
                {/* Left side: Marketing text / Info (similar to Login/Register) */}
                <motion.div
                    className="text-white flex-col justify-center text-shadow-lg hidden lg:flex"
                    initial="hidden"
                    animate="visible"
                    variants={textFadeInVariants}
                >
                    <motion.h1 variants={textFadeInVariants} className="text-5xl xl:text-6xl font-bold mb-4 leading-tight">Secure Your Account.</motion.h1>
                    <motion.h2 variants={textFadeInVariants} className="text-3xl xl:text-4xl font-semibold mb-6 text-primary-light/90">Set a New Password.</motion.h2>
                    <motion.p variants={textFadeInVariants} className="text-lg xl:text-xl text-gray-200/90 max-w-2xl">
                        Choose a strong, unique password to protect your account. Ensure it meets our security requirements for maximum protection.
                    </motion.p>
                </motion.div>

                {/* Right side: Reset Password Form */}
                <motion.div variants={formContainerVariants} initial="hidden" animate="visible">
                    <Tilt className="transform-style-3d h-full" tiltMaxAngleX={3} tiltMaxAngleY={3} perspective={1000} transitionSpeed={1500} scale={1.01} glareEnable={true} glareMaxOpacity={0.15} glareColor="#ffffff" glarePosition="all" glareBorderRadius="1.5rem">
                        <motion.div variants={formItemVariants} className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-gray-100/10 shadow-2xl p-8 lg:p-12 transform-style-3d h-full flex flex-col justify-center">
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-extrabold text-white">Reset Your Password</h2>
                                <p className="text-gray-400 mt-2">Enter your new password below.</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                                {/* New Password Input with Toggle */}
                                <FormInput
                                    id="new-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                                    placeholder="New Password"
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

                                {/* Confirm New Password Input with Toggle */}
                                <FormInput
                                    id="confirm-new-password"
                                    name="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(''); }}
                                    placeholder="Confirm New Password"
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
                                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 min-h-[52px]" // Ensure min-h
                                    >
                                        {formLoading ? (
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6 text-center">
                                <Link to={ROUTES.LOGIN} className="font-medium text-primary-light hover:text-primary-lighter transition-colors">
                                    Remembered your password? Sign In
                                </Link>
                            </div>
                        </motion.div>
                    </Tilt>
                </motion.div>
            </main>
        </div>
    );
}

export default ResetPassword;