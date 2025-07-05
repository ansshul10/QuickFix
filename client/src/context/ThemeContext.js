// quickfix-website/client/src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getCookie, setCookie } from '../utils/cookiesHandler'; // Import cookie utilities
import { COOKIE_NAMES } from '../utils/constants';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initialize theme state from local storage or cookie, fallback to 'light'
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') { // Check if window is defined (client-side)
            const storedTheme = localStorage.getItem(COOKIE_NAMES.THEME) || getCookie(COOKIE_NAMES.THEME);
            // Optionally, check user's system preference if no stored theme
            if (storedTheme) {
                return storedTheme;
            }
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        }
        return 'light'; // Default theme
    });

    // Effect to apply theme class to the document's root element (<html>)
    // and store preference in localStorage/cookie
    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
            }
            // Store theme preference
            localStorage.setItem(COOKIE_NAMES.THEME, theme);
            setCookie(COOKIE_NAMES.THEME, theme, 365); // Store in cookie for 1 year
        }
    }, [theme]); // Re-run effect whenever theme changes

    // Function to toggle between 'light' and 'dark' themes
    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []); // Memoize toggleTheme function

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};