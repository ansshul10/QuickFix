// quickfix-website/client/src/components/auth/Login.js
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { toast } from 'react-toastify';

// Contexts & Utils
import { AuthContext } from '../../context/AuthContext';
import { SettingsContext } from '../../context/SettingsContext';
import { validateEmail, validatePassword } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';

// Assets
import LoginBg from '../../assets/images/Login_bg.png';

// --- SVG ICONS --- (Unchanged)
const MailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>);
const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const EyeIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064 7-9.542 7 .847 0 1.67.111 2.458.317M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 2.298V12c0-1.149-.22-2.26-.635-3.302M12 12l3 3m-3-3l-3-3" /></svg>);
const GoogleIcon = () => <svg className="w-5 h-5" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8 0 120.5 109.8 11.8 244 11.8c70.3 0 129.8 27.8 175.2 73.2L343.8 169.6c-22.6-21.6-54.2-36.1-99.8-36.1-82.7 0-149.5 67.3-149.5 150.3s66.8 150.3 149.5 150.3c95.7 0 129.2-70.1 133.8-106.4H244V261.8h244z"></path></svg>;
const GithubIcon = () => <svg className="w-5 h-5" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.3-6.2-10.1-27.8 2.3-57.4 0 0 21.1-7.1 69.2 25.8 20.1-5.6 41.6-8.4 63.1-8.4 21.3 0 43.1 2.8 63.1 8.4 48.1-33 69.2-25.8 69.2-25.8 12.4 29.6 4.6 51.2 2.3 57.4 16 17.6 23.6 31.4 23.6 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4.2-3.3-5.6-2z"></path></svg>;
const ShieldCheckIcon = () => <svg className="w-7 h-7 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>;

// --- Reusable Components --- (Unchanged)
const FormInput = ({ id, name, type, value, onChange, placeholder, error, icon, children }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
        <input id={id} name={name} type={type} required className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500/50' : 'border-gray-300/20'} bg-black/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent transition-all placeholder-gray-500`} placeholder={placeholder} value={value} onChange={onChange} />
        {children}
        {error && (<motion.p className="mt-2 text-sm text-red-400" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p>)}
    </div>
);

// --- Main Login Component ---
function Login() {
    const { login, user, loading: authLoading } = useContext(AuthContext); // Get user and authLoading from context
    const { loadingSettings, settings } = useContext(SettingsContext); // Get settings from context
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [formLoading, setFormLoading] = useState(false); // Custom loading for the button

    useEffect(() => {
        // If user is already logged in (either verified or unverified), redirect them to profile.
        // The AuthContext's login function now handles specific messaging about unverified status.
        if (!authLoading && user) {
            const from = location.state?.from?.pathname || ROUTES.PROFILE;
            navigate(from, { replace: true });
        }
    }, [user, authLoading, navigate, location]);

    // Show a general loading message if settings or auth are still loading
    if (loadingSettings || authLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed p-4" style={{ backgroundImage: `url(${LoginBg})` }}>
                <div className="text-center bg-black/60 backdrop-blur-lg p-10 rounded-2xl shadow-xl border border-gray-100/10">
                    <h1 className="text-4xl font-bold text-primary-light mb-4">Loading...</h1>
                    <p className="text-lg text-gray-200 max-w-md">
                        Please wait while we prepare the login page.
                    </p>
                </div>
            </div>
        );
    }

    const handleSocialLoginClick = (e) => {
        e.preventDefault();
        toast.info('This feature is coming soon!', { toastId: 'social-login-soon' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEmailError('');
        setPasswordError('');

        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);

        if (emailValidation) setEmailError(emailValidation);
        if (passwordValidation) setPasswordError(passwordValidation);
        if (emailValidation || passwordValidation) {
            toast.error("Please correct the errors in the form.", { toastId: 'login-validation-error' });
            return;
        }

        setFormLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                // AuthContext already handles the success toast and redirects to profile.
                // It also handles toasts for unverified email after login.
            } else {
                // AuthContext already handles error toasts for non-verification failures
            }
        } catch (error) {
            // Error handling is primarily in AuthContext and api.js interceptor
            // No need for a toast here unless there's specific additional client-side error handling
        } finally {
            setFormLoading(false);
        }
    };

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };
    const itemVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } };
    const formContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
    const formItemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

    return (
        <div className="rounded-3xl min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed p-4 sm:p-6 lg:p-8" style={{ backgroundImage: `url(${LoginBg})` }}>
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 max-w-screen-2xl w-full mx-auto items-center">
                <motion.div className="text-white flex-col justify-center text-shadow-lg hidden lg:flex" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.div variants={itemVariants}>
                        <h1 className="text-5xl xl:text-6xl font-bold mb-4 leading-tight">Unlock Your Potential.</h1>
                        <h2 className="text-3xl xl:text-4xl font-semibold mb-6 text-primary-light/90">One Secure Login Away.</h2>
                        <p className="text-lg xl:text-xl text-gray-200/90 max-w-2xl mb-12">Gain access to a powerful suite of tools designed to streamline your workflow, boost productivity, and safeguard your digital assets with enterprise-grade security.</p>
                    </motion.div>
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 bg-primary-light/10 p-3 rounded-full"><ShieldCheckIcon /></div>
                            <div>
                                <h3 className="font-semibold text-xl">Enterprise Security</h3>
                                <p className="text-gray-300/80">Multi-factor authentication and end-to-end encryption.</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div variants={formContainerVariants} initial="hidden" animate="visible">
                    <Tilt className="transform-style-3d h-full" tiltMaxAngleX={3} tiltMaxAngleY={3} perspective={1000} transitionSpeed={1500} scale={1.01} glareEnable={true} glareMaxOpacity={0.15} glareColor="#ffffff" glarePosition="all" glareBorderRadius="1.5rem">
                        <motion.div variants={formItemVariants} className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-gray-100/10 shadow-2xl p-8 lg:p-12 transform-style-3d h-full flex flex-col justify-center">
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-extrabold text-white">Welcome Back</h2>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                                <FormInput id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={emailError} icon={<MailIcon />} />
                                <FormInput id="password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" error={passwordError} icon={<LockIcon />}>
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                                </FormInput>
                                <div className="flex items-center justify-end"><div className="text-sm"><Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-primary-light hover:text-primary-lighter">Forgot your password?</Link></div></div>
                                <div>
                                    <button type="submit" disabled={formLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 min-h-[52px]">
                                        {formLoading ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        ) : ('Sign In')}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-300">
                                    Don't have an account?{' '}
                                    <Link to={ROUTES.REGISTER} className="font-medium text-primary-light hover:text-primary-lighter transition-colors">
                                        Sign up for free
                                    </Link>
                                </p>
                            </div>

                            <div className="mt-6">
                                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-500/50" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-800 text-gray-400 rounded-full">Or continue with</span></div></div>
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <a href="#" onClick={handleSocialLoginClick} className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-500/80 rounded-xl bg-white/5 text-sm font-medium text-gray-200 hover:bg-white/10 transition-colors"><GoogleIcon /><span className="ml-2">Google</span></a>
                                    <a href="#" onClick={handleSocialLoginClick} className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-500/80 rounded-xl bg-white/5 text-sm font-medium text-gray-200 hover:bg-white/10 transition-colors"><GithubIcon /><span className="ml-2">GitHub</span></a>
                                </div>
                            </div>
                        </motion.div>
                    </Tilt>
                </motion.div>
            </main>
        </div>
    );
}

export default Login;