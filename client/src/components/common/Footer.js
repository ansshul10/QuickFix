import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { SettingsContext } from '../../context/SettingsContext';
import { ThemeContext } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import { EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

import { AuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import * as newsletterService from '../../services/newsletterService';

// --- MODIFIED: The LoadingSpinner is no longer needed in this file ---
// import LoadingSpinner from '../common/LoadingSpinner';

function Footer() {
    const { settings } = useContext(SettingsContext);
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);

    const currentYear = new Date().getFullYear();

    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);

    const handleNewsletterSubscribe = async (e) => {
        e.preventDefault();
        setSubscriptionLoading(true);
        if (!newsletterEmail || !newsletterEmail.includes('@')) {
            toast.error("Please enter a valid email address.");
            setSubscriptionLoading(false);
            return;
        }

        try {
            const response = await newsletterService.subscribeNewsletter(newsletterEmail);
            if (response && response.success) {
                setNewsletterEmail('');
            }
        } catch (err) {
            console.error('Frontend subscription error (handled by service):', err);
        } finally {
            setSubscriptionLoading(false);
        }
    };

    return (
        <footer className={`py-10 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-[#1A1A1A] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 pb-8 border-b border-gray-200 dark:border-gray-700">

                {/* Brand Info & Social Links */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <h3 className='text-2xl font-extrabold mb-4'>QuickFix</h3>
                    <p className="text-sm mb-6 max-w-xs leading-relaxed">
                        Your trusted resource for expert device repair guides and tech troubleshooting solutions. Empowering you to fix it fast!
                    </p>
                    <div className="flex space-x-5 mt-2">
                        {settings?.socialFacebookUrl && (
                            <a href={settings.socialFacebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors duration-200 transform hover:scale-110">
                                <FaFacebookF className="h-6 w-6" />
                            </a>
                        )}
                        {settings?.socialTwitterUrl && (
                            <a href={settings.socialTwitterUrl} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors duration-200 transform hover:scale-110">
                                <FaTwitter className="h-6 w-6" />
                            </a>
                        )}
                        {settings?.socialInstagramUrl && (
                            <a href={settings.socialInstagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors duration-200 transform hover:scale-110">
                                <FaInstagram className="h-6 w-6" />
                            </a>
                        )}
                        {settings?.socialLinkedInUrl && (
                            <a href={settings.socialLinkedInUrl} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors duration-200 transform hover:scale-110">
                                <FaLinkedinIn className="h-6 w-6" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quick Links</h3>
                    <ul className="space-y-3 text-sm">
                        <li><Link to={ROUTES.HOME} className="hover:text-red-500 transition-colors duration-200">Home</Link></li>
                        <li><Link to={ROUTES.ABOUT} className="hover:text-red-500 transition-colors duration-200">About Us</Link></li>
                        <li><Link to={ROUTES.GUIDES} className="hover:text-red-500 transition-colors duration-200">All Guides</Link></li>
                        <li><Link to={ROUTES.CONTACT} className="hover:text-red-500 transition-colors duration-200">Contact</Link></li>
                        {user && <li><Link to={ROUTES.PROFILE} className="hover:text-red-500 transition-colors duration-200">My Profile</Link></li>}
                    </ul>
                </div>

                {/* Legal & Support */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Legal & Support</h3>
                    <ul className="space-y-3 text-sm">
                        <li><Link to={ROUTES.PRIVACY_POLICY} className="hover:text-red-500 transition-colors duration-200">Privacy Policy</Link></li>
                        <li><Link to={ROUTES.TERMS_OF_SERVICE} className="hover:text-red-500 transition-colors duration-200">Terms of Service</Link></li>
                        <li><Link to={ROUTES.COOKIE_POLICY} className="hover:text-red-500 transition-colors duration-200">Cookie Policy</Link></li>
                        {settings?.contactEmail && (
                            <li><a href={`mailto:${settings.contactEmail}`} className="hover:text-red-500 transition-colors duration-200">Support</a></li>
                        )}
                        <li className="flex items-center justify-center md:justify-start pt-2">
                            <MapPinIcon className="h-5 w-5 mr-2" />
                            <span className="text-xs">Indore, MP, India</span>
                        </li>
                    </ul>
                </div>

                {/* Newsletter Subscription */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Stay Updated</h3>
                    <p className="text-sm mb-4">
                        Subscribe to our newsletter for the latest repair guides, tech tips, and exclusive updates!
                    </p>
                    <form onSubmit={handleNewsletterSubscribe} className="w-full max-w-sm">
                        <div className="flex flex-col gap-3">
                            <input
                                type="email"
                                placeholder="Your email address"
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                className={`w-full p-3 rounded-md border focus:ring-red-500 focus:border-red-500 placeholder-gray-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                disabled={subscriptionLoading}
                            />
                            <button
                                type="submit"
                                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-md shadow-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
                                disabled={subscriptionLoading}
                            >
                                {/* --- MODIFIED: Replaced spinner with simple text to prevent resizing --- */}
                                {subscriptionLoading ? 'Subscribing...' : <><EnvelopeIcon className="h-5 w-5 mr-2" /> Subscribe</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Bottom Copyright and Contact Info */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-8 text-sm">
                <p>&copy; {currentYear} QuickFix. All rights reserved.</p>
                {settings?.contactEmail && (
                    <a href={`mailto:${settings.contactEmail}`} className="hover:text-red-500 transition-colors duration-200 mt-2 sm:mt-0">
                        Contact: {settings.contactEmail}
                    </a>
                )}
            </div>
        </footer>
    );
}

export default Footer;