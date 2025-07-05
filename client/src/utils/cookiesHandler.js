// quickfix-website/client/src/utils/cookiesHandler.js

// A simple utility to get a cookie value from the browser
export const getCookie = (name) => {
    if (typeof document === 'undefined') return null; // Ensure client-side execution
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

// A simple utility to set a cookie (primarily for cookie consent or non-sensitive flags)
// For JWT, server-side httpOnly cookies are preferred.
export const setCookie = (name, value, days) => {
    if (typeof document === 'undefined') return;
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax; Secure";
};

// A simple utility to delete a cookie
export const eraseCookie = (name) => {
    if (typeof document === 'undefined') return;
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure';
};