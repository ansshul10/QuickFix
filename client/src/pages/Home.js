import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsContext } from '../context/SettingsContext';
import { ThemeContext } from '../context/ThemeContext'; // --- NEW: Import ThemeContext
import { FireIcon, WrenchScrewdriverIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../utils/constants';

function Home() {
    const { settings, loadingSettings } = useContext(SettingsContext);
    const { theme } = useContext(ThemeContext) || { theme: 'light' }; // --- NEW: Get theme from context
    const [globalAnnouncement, setGlobalAnnouncement] = useState('');

    useEffect(() => {
        if (!loadingSettings && settings?.globalAnnouncement) {
            setGlobalAnnouncement(settings.globalAnnouncement);
        }
    }, [settings, loadingSettings]);

    return (
        <div className="text-center py-16 px-4 sm:px-6 lg:px-8">
            {/* Global Announcement Banner (if any) */}
            {globalAnnouncement && (
                // --- MODIFIED: Banner colors are now theme-aware ---
                <div className={`p-4 rounded-lg mb-8 shadow-md ${theme === 'dark' ? 'bg-[#1A1A1A] text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p className="font-medium text-lg">{globalAnnouncement}</p>
                </div>
            )}

            {/* --- MODIFIED: Heading colors updated as requested --- */}
            <h1 className={`text-5xl md:text-6xl font-extrabold mb-6 leading-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                QuickFix: Your Device, Fixed Fast.
            </h1>
            
            {/* --- MODIFIED: Paragraph text color is now theme-aware --- */}
            <p className={`text-xl md:text-2xl mb-10 max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Comprehensive guides and expert solutions for all your tech repair and troubleshooting needs. Empowering you to fix it yourself!
            </p>

            <div className="space-y-4 sm:space-y-0 sm:space-x-6 flex flex-col sm:flex-row justify-center mb-16">
                <Link
                    to={ROUTES.GUIDES}
                    className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-full shadow-lg text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500/50"
                >
                    <WrenchScrewdriverIcon className="h-6 w-6 mr-2" /> Explore Guides
                </Link>
                <Link
                    to={ROUTES.PREMIUM}
                    className={`inline-flex items-center justify-center px-8 py-4 border text-lg font-bold rounded-full shadow-lg transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-75 ${theme === 'dark' ? 'border-red-500 text-red-400 hover:bg-red-500 hover:text-white focus:ring-red-400' : 'border-red-600 text-red-600 bg-transparent hover:bg-red-600 hover:text-white focus:ring-red-600'}`}
                >
                    <FireIcon className="h-6 w-6 mr-2" /> Go Premium!
                </Link>
            </div>

            {/* Feature Highlights Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                 {/* --- MODIFIED: Card styles are now theme-aware --- */}
                <div className={`p-8 rounded-lg shadow-lg border ${theme === 'dark' ? 'bg-[#1A1A1A] border-gray-700' : 'bg-white border-gray-200'} flex flex-col items-center`}>
                    <WrenchScrewdriverIcon className="h-16 w-16 text-red-500 mb-4" />
                    <h3 className={`text-2xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Step-by-Step Guides</h3>
                    <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Clear, easy-to-follow instructions for a wide range of devices and issues.
                    </p>
                </div>
                <div className={`p-8 rounded-lg shadow-lg border ${theme === 'dark' ? 'bg-[#1A1A1A] border-gray-700' : 'bg-white border-gray-200'} flex flex-col items-center`}>
                    <FireIcon className="h-16 w-16 text-red-500 mb-4" />
                    <h3 className={`text-2xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Premium Content</h3>
                    <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Unlock exclusive, advanced guides and ad-free experience with a premium membership.
                    </p>
                </div>
                <div className={`p-8 rounded-lg shadow-lg border ${theme === 'dark' ? 'bg-[#1A1A1A] border-gray-700' : 'bg-white border-gray-200'} flex flex-col items-center`}>
                    <ShieldCheckIcon className="h-16 w-16 text-red-500 mb-4" />
                    <h3 className={`text-2xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Trusted Solutions</h3>
                    <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Reliable and community-vetted fixes to get your devices back in action.
                    </p>
                </div>
            </div>

            {/* Call to Action for Newsletter */}
             {/* --- MODIFIED: Newsletter CTA colors are now theme-aware --- */}
            <div className={`p-10 rounded-lg shadow-xl max-w-4xl mx-auto ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-gray-100'}`}>
                <h3 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Stay Updated!</h3>
                <p className={`text-lg mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Join our newsletter to get the latest repair guides, tech tips, and exclusive offers directly to your inbox.
                </p>
                <Link to={ROUTES.CONTACT} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 transition-colors">
                    Subscribe to Newsletter
                </Link>
            </div>
        </div>
    );
}

export default Home;