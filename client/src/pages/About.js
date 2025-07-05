// quickfix-website/client/src/pages/About.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, WrenchIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../utils/constants';
import { SettingsContext } from '../context/SettingsContext';

function About() {
    const { settings } = useContext(SettingsContext);
    const privacyPolicyLastUpdated = settings?.privacyPolicyLastUpdated;
    const cookiePolicyLastUpdated = settings?.cookiePolicyLastUpdated; // Correctly referencing from settings

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto bg-cardBackground dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-border dark:border-gray-700">
                <h1 className="text-4xl font-extrabold text-center text-primary dark:text-primary-light mb-8">About QuickFix</h1>

                <section className="mb-10 text-textDefault dark:text-gray-200 leading-relaxed">
                    <h2 className="text-3xl font-bold text-textDefault dark:text-white mb-4 border-b-2 border-primary-light pb-2">Our Mission</h2>
                    <p className="mb-4">
                        At QuickFix, our mission is to empower individuals with the knowledge and tools to confidently troubleshoot and repair their electronic devices. In a world of increasing technological complexity and planned obsolescence, we believe in the right to repair and the value of extending the life of your beloved gadgets.
                    </p>
                    <p>
                        We strive to be the most comprehensive, easy-to-understand, and community-driven resource for all things related to tech repair. From smartphones and laptops to gaming consoles and smart home devices, QuickFix is here to guide you every step of the way.
                    </p>
                </section>

                <section className="mb-10 text-textDefault dark:text-gray-200 leading-relaxed">
                    <h2 className="text-3xl font-bold text-textDefault dark:text-white mb-4 border-b-2 border-primary-light pb-2">Why Choose QuickFix?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mt-6">
                        <div className="bg-black p-4 dark:bg-gray-700 rounded-lg shadow-sm border border-border dark:border-gray-600">
                            <WrenchIcon className="h-12 w-12 text-accent mx-auto mb-3 " />
                            <h3 className="text-xl font-semibold text-[#3b82f6] dark:text-white mb-2">Expert Guides</h3>
                            <p className="text-white dark:text-gray-400 text-sm">Detailed, step-by-step instructions crafted by experienced technicians.</p>
                        </div>
                        <div className="p-4 bg-black dark:bg-gray-700 rounded-lg shadow-sm border border-border dark:border-gray-600">
                            <UsersIcon className="h-12 w-12 text-white mx-auto mb-3" />
                            <h3 className="text-xl font-semibold text-[#3b82f6] dark:text-white mb-2">Vibrant Community</h3>
                            <p className="text-white dark:text-gray-400 text-sm">Share tips, ask questions, and get support from fellow DIY enthusiasts.</p>
                        </div>
                        <div className="p-4 bg-black dark:bg-gray-700 rounded-lg shadow-sm border border-border dark:border-gray-600">
                            <SparklesIcon className="h-12 w-12 text-[#db1111] mx-auto mb-3" />
                            <h3 className="text-xl font-semibold text-[#3b82f6] dark:text-white mb-2">Constantly Evolving</h3>
                            <p className="text-white dark:text-gray-400 text-sm">New guides and features are added regularly to keep you updated.</p>
                        </div>
                    </div>
                </section>

                <section className="text-center text-textDefault dark:text-gray-200">
                    <h2 className="text-3xl font-bold text-textDefault dark:text-white mb-4 border-b-2 border-primary-light pb-2">Our Values</h2>
                    <p className="mb-4">
                        We believe in accessibility, accuracy, and empowering our users. Every guide on QuickFix is designed with clarity and safety in mind.
                    </p>
                    <p className="text-lg font-medium mb-6">
                        Join us in building a sustainable future, one fix at a time.
                    </p>
                    <Link to={ROUTES.CONTACT} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-primary hover:bg-primary-dark transition-colors">
                        Get in Touch
                    </Link>
                </section>

                <div className="mt-10 border-t border-border dark:border-gray-700 pt-6 text-sm text-textSecondary dark:text-gray-400 text-center">
                    <p>
                        Read our <Link to={ROUTES.PRIVACY_POLICY} className="text-primary hover:underline">Privacy Policy</Link> (Last Updated: {privacyPolicyLastUpdated || 'N/A'})
                    </p>
                    <p>
                        And our <Link to={ROUTES.COOKIE_POLICY} className="text-primary hover:underline">Cookie Policy</Link> (Last Updated: {cookiePolicyLastUpdated || 'N/A'})
                    </p>
                </div>
            </div>
        </div>
    );
}

export default About;