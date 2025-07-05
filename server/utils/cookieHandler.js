// quickfix-website/server/utils/cookieHandler.js
const setCookie = (res, token) => {
    const jwtExpiresInDays = parseInt(process.env.JWT_COOKIE_EXPIRES_IN_DAYS, 10);
    const maxAge = jwtExpiresInDays * 24 * 60 * 60 * 1000;

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: maxAge,
    });
};

module.exports = { setCookie };