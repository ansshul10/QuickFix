// quickfix-website/client/src/pages/PrivacyPolicyPage.js
import React, { useContext } from 'react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { SettingsContext } from '../context/SettingsContext';

function PrivacyPolicyPage() {
    const { settings } = useContext(SettingsContext);
    const lastUpdated = settings?.privacyPolicyLastUpdated || 'N/A';

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Breadcrumbs customSegments={[{name: 'Privacy Policy', path: '/privacy-policy'}]} />
            </div>
            <div className="max-w-4xl mx-auto bg-cardBackground dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-border dark:border-gray-700">
                <h1 className="text-4xl font-extrabold text-center text-primary dark:text-primary-light mb-8">Privacy Policy</h1>

                <p className="text-sm text-textSecondary dark:text-gray-400 text-center mb-8">
                    Last Updated: {lastUpdated}
                </p>

                <div className="prose dark:prose-invert max-w-none text-textDefault dark:text-gray-200 leading-relaxed space-y-6">
                    <p>
                        Your privacy is important to us. This Privacy Policy explains how QuickFix collects, uses, and protects your personal information when you use our website.
                    </p>

                    <h2>1. Information We Collect</h2>
                    <p>
                        We collect information to provide better services to all our users. The types of information we collect include:
                    </p>
                    <ul>
                        <li><strong>Personal Information:</strong> When you register for an account, we may ask for information like your username, email address, and password. If you subscribe to premium services, we may collect payment-related details (though actual payment processing is handled by third-party gateways).</li>
                        <li><strong>Usage Data:</strong> We automatically collect information about how you interact with our website, such as pages visited, time spent, search queries, and referring URLs.</li>
                        <li><strong>Device Information:</strong> We may collect information about the device you use to access our services, including IP address, browser type, operating system, and unique device identifiers.</li>
                    </ul>

                    <h2>2. How We Use Your Information</h2>
                    <p>
                        We use the information we collect for various purposes, including:
                    </p>
                    <ul>
                        <li>To provide and maintain our services.</li>
                        <li>To personalize your experience and deliver tailored content.</li>
                        <li>To improve our website, features, and user experience.</li>
                        <li>To communicate with you, including sending updates, security alerts, and support messages.</li>
                        <li>To process transactions and manage subscriptions.</li>
                        <li>To detect, prevent, and address technical issues or security incidents.</li>
                        <li>For internal analytics and research to understand usage patterns.</li>
                    </ul>

                    <h2>3. Data Sharing and Disclosure</h2>
                    <p>
                        We do not share your personal information with third parties except in the following limited circumstances:
                    </p>
                    <ul>
                        <li>With your consent.</li>
                        <li>For external processing by trusted third-party service providers (e.g., payment gateways, email service providers) who adhere to strict data protection standards.</li>
                        <li>For legal reasons, such as responding to a valid court order or government request.</li>
                        <li>To enforce our Terms of Service or protect our rights and safety.</li>
                    </ul>

                    <h2>4. Data Security</h2>
                    <p>
                        We implement robust security measures, including encryption, access controls, and regular security audits, to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
                    </p>

                    <h2>5. Your Rights</h2>
                    <p>
                        You have certain rights regarding your personal data, including the right to access, correct, delete, or restrict its processing. Please contact us if you wish to exercise any of these rights.
                    </p>

                    <h2>6. Changes to This Policy</h2>
                    <p>
                        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page with a revised "Last Updated" date. We encourage you to review this Privacy Policy periodically for any changes.
                    </p>

                    <h2>7. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at {settings?.contactEmail || 'our support email address'}.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicyPage;