// quickfix-website/client/src/components/common/CookieConsent.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // <--- Ensure this line is present
import { setCookie, getCookie } from '../../utils/cookiesHandler';
import { COOKIE_NAMES, ROUTES } from '../../utils/constants';

function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = getCookie(COOKIE_NAMES.COOKIE_CONSENT);
    if (!consent) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookie(COOKIE_NAMES.COOKIE_CONSENT, 'accepted', 365);
    setShowBanner(false);
  };

  const handleDecline = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 bg-opacity-95 text-white p-4 shadow-lg z-50 flex flex-col md:flex-row items-center justify-center space-y-3 md:space-y-0 md:space-x-6 text-center">
      <p className="text-sm md:text-base">
        We use cookies to ensure you get the best experience on our website.
        <Link to={ROUTES.COOKIE_POLICY} className="text-blue-400 hover:underline ml-1">
          Learn more
        </Link>
        .
      </p>
      <div className="flex space-x-3 mt-3 md:mt-0">
        <button
          onClick={handleAccept}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          Accept All
        </button>
        <button
          onClick={handleDecline}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

export default CookieConsent;