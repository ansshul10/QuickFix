// quickfix-website/server/utils/passwordUtils.js
// This utility is largely absorbed by the User model's pre-save hook for hashing
// and its matchPassword method for comparison.
// It serves as a placeholder if you need more advanced password utilities, such as:
// - Password strength validation
// - Password generation (random passwords for temporary accounts)
// - Integration with external password vault systems (highly advanced)

// const bcrypt = require('bcryptjs'); // Example of dependency

/* Example:
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const comparePassword = async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword);
};
*/

module.exports = {
    // hashPassword, // Example export
    // comparePassword,
};