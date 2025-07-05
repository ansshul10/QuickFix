// quickfix-website/client/src/components/auth/ForgotPassword.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validation';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import motion for animations
import Tilt from 'react-parallax-tilt'; // Import Tilt for parallax effect
import { toast } from 'react-toastify'; // Keep toast for messages

import { ROUTES } from '../../utils/constants';

// Assets
import LoginBg from '../../assets/images/Login_bg.png'; // Use the same background image

// --- SVG ICONS --- (Re-used from Login/Register for consistency)
const MailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 0 01-4.5 1.207" /></svg>);

// --- Reusable FormInput Component ---
// This is assumed to be defined globally or imported from a common place,
// but included here for direct context as per your request format.
const FormInput = ({ id, name, type, value, onChange, placeholder, error, icon, children }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
        <input id={id} name={name} type={type} required className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500/50' : 'border-gray-300/20'} bg-black/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent transition-all placeholder-gray-500`} placeholder={placeholder} value={value} onChange={onChange} autoComplete="off" />
        {children}
        {error && (<motion.p className="mt-2 text-sm text-red-400" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p>)}
    </div>
);


function ForgotPassword() {
    const { forgotPassword } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [formLoading, setFormLoading] = useState(false); // Controls button loading
    const [messageSent, setMessageSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setEmailError('');

        const emailValidation = validateEmail(email);
        if (emailValidation) {
            setEmailError(emailValidation);
            toast.error("Please enter a valid email address.", { toastId: 'forgot-password-validation-error' }); // Added toast
            return;
        }

        setFormLoading(true);
        const result = await forgotPassword(email);
        setFormLoading(false);

        if (result.success) {
            setMessageSent(true);
        }
        // AuthContext already handles the success/error toasts for the API call result.
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
                    <motion.h2 variants={textFadeInVariants} className="text-3xl xl:text-4xl font-semibold mb-6 text-primary-light/90">Reset Your Password.</motion.h2>
                    <motion.p variants={textFadeInVariants} className="text-lg xl:text-xl text-gray-200/90 max-w-2xl">
                        Don't worry, it happens! Just enter your email address and we'll send you a link to securely reset your password and regain access to your account.
                    </motion.p>
                </motion.div>

                {/* Right side: Forgot Password Form */}
                <motion.div variants={formContainerVariants} initial="hidden" animate="visible">
                    <Tilt className="transform-style-3d h-full" tiltMaxAngleX={3} tiltMaxAngleY={3} perspective={1000} transitionSpeed={1500} scale={1.01} glareEnable={true} glareMaxOpacity={0.15} glareColor="#ffffff" glarePosition="all" glareBorderRadius="1.5rem">
                        <motion.div variants={formItemVariants} className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-gray-100/10 shadow-2xl p-8 lg:p-12 transform-style-3d h-full flex flex-col justify-center">
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-extrabold text-white">Forgot Password?</h2>
                                <p className="text-gray-400 mt-2">Enter your email to reset it.</p>
                            </div>

                            {messageSent ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center text-green-400 font-medium space-y-4"
                                >
                                    <p>If an account with that email exists, a password reset link has been sent.</p>
                                    <p className="mt-4">Please check your inbox (and spam folder).</p>
                                    <Link to={ROUTES.LOGIN} className="mt-4 inline-block text-primary-light hover:text-primary-lighter transition-colors">Back to Login</Link>
                                </motion.div>
                            ) : (
                                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                                    <FormInput
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                                        placeholder="Enter your email address"
                                        error={emailError}
                                        icon={<MailIcon />}
                                    />

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={formLoading}
                                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 min-h-[52px]" // Ensure min-h to prevent size collapse
                                        >
                                            {formLoading ? (
                                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                            ) : (
                                                'Send Reset Link'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {!messageSent && (
                                <div className="mt-6 text-center">
                                    <Link to={ROUTES.LOGIN} className="font-medium text-primary-light hover:text-primary-lighter transition-colors">
                                        Remembered your password? Sign In
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </Tilt>
                </motion.div>
            </main>
        </div>
    );
}

export default ForgotPassword;