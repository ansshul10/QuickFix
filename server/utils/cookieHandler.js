// quickfix-website/server/utils/cookieHandler.js
const setCookie = (res, token) => {
    const jwtExpiresInDays = parseInt(process.env.JWT_COOKIE_EXPIRES_IN_DAYS, 10);
    const maxAge = jwtExpiresInDays * 24 * 60 * 60 * 1000;

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Must be true in production for SameSite: 'None'
        maxAge: maxAge,
    };

    if (process.env.NODE_ENV === 'production') {
        // When frontend and backend are on different origins (even subdomains)
        cookieOptions.sameSite = 'None';
        // Set domain to your root domain (e.g., '.your-main-domain.com')
        // This allows subdomains like api.your-main-domain.com and app.your-main-domain.com to share the cookie.
        // Make sure process.env.COOKIE_DOMAIN is set correctly in your production .env
        cookieOptions.domain = process.env.COOKIE_DOMAIN; 
    } else {
        // For development, 'Lax' is generally fine and safer default
        cookieOptions.sameSite = 'Lax';
        // No domain needed for localhost
    }

    res.cookie('jwt', token, cookieOptions);
};

module.exports = { setCookie };
