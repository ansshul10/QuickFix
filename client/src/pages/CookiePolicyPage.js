// quickfix-website/client/src/pages/CookiePolicyPage.js
import React from 'react';
import Breadcrumbs from '../components/common/Breadcrumbs';

function CookiePolicyPage() {
    // You might also use a setting for last updated date here, similar to Privacy Policy
    const lastUpdated = '2025-01-01'; // Hardcoded for now

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Breadcrumbs customSegments={[{name: 'Cookie Policy', path: '/cookie-policy'}]} />
            </div>
            <div className="max-w-4xl mx-auto bg-cardBackground dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-border dark:border-gray-700">
                <h1 className="text-4xl font-extrabold text-center text-primary dark:text-primary-light mb-8">Cookie Policy</h1>

                <p className="text-sm text-textSecondary dark:text-gray-400 text-center mb-8">
                    Last Updated: {lastUpdated}
                </p>

                <div className="prose dark:prose-invert max-w-none text-textDefault dark:text-gray-200 leading-relaxed space-y-6">
                    <p>
                        This Cookie Policy explains what cookies are, how QuickFix uses them, and your choices regarding our use of cookies.
                    </p>

                    <h2>1. What are Cookies?</h2>
                    <p>
                        Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work or work more efficiently, as well as to provide reporting information.
                    </p>
                    <p>
                        Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your personal computer or mobile device when you go offline, while session cookies are deleted as soon as you close your web browser.
                    </p>

                    <h2>2. How We Use Cookies</h2>
                    <p>
                        QuickFix uses cookies for the following purposes:
                    </p>
                    <ul>
                        <li><strong>Essential Cookies:</strong> These cookies are strictly necessary to provide you with services available through our website and to enable you to use some of its features, such as accessing secure areas. Without these cookies, the services you have asked for cannot be provided.</li>
                        <li><strong>Performance and Functionality Cookies:</strong> These cookies enhance the performance and functionality of our website but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.</li>
                        <li><strong>Analytics and Customization Cookies:</strong> These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our website for you.</li>
                        <li><strong>Advertising Cookies:</strong> These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.</li>
                    </ul>

                    <h2>3. Your Choices Regarding Cookies</h2>
                    <p>
                        You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by clicking on the appropriate opt-out links provided in the cookie banner (if active) or by setting your preferences within your web browser.
                    </p>
                    <p>
                        Most web browsers allow you to manage cookies through their settings. You can set your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you disable cookies, you may not be able to use some features of our website effectively.
                    </p>

                    <h2>4. Third-Party Cookies</h2>
                    <p>
                        In addition to our own cookies, we may also use various third-parties cookies to report usage statistics of the service, deliver advertisements on and through the service, and so on. These third-parties have their own privacy policies.
                    </p>

                    <h2>5. Changes to This Cookie Policy</h2>
                    <p>
                        We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page. We encourage you to review this Cookie Policy periodically for any changes.
                    </p>

                    <h2>6. Contact Us</h2>
                    <p>
                        If you have any questions about this Cookie Policy, please contact us.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default CookiePolicyPage;