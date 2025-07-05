// quickfix-website/client/src/utils/validation.js
// Basic client-side validation utilities

export const validateEmail = (email) => {
    // This is for REQUIRED emails (e.g., registration, login)
    if (!email) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Please enter a valid email address.";
    }
    return null; // No error
};

// New: Validation for OPTIONAL email fields (e.g., contactEmail in settings if it can be empty)
// Use this for fields where an empty string is acceptable, but if present, it must be valid.
export const validateOptionalEmail = (email) => {
    if (!email) return null; // If empty, it's valid (optional)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Please enter a valid email address, or leave empty.";
    }
    return null; // No error
};


export const validatePassword = (password) => {
    if (!password) return "Password is required.";
    if (password.length < 8) { // Increased minimum length for better security
        return "Password must be at least 8 characters long.";
    }
    // Added more robust password requirements: at least one uppercase, one lowercase, one number, one special character
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?~`]).{8,}/.test(password)) {
        return "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.";
    }
    return null;
};

export const validateUsername = (username) => {
    if (!username) return "Username is required.";
    if (username.length < 3) {
        return "Username must be at least 3 characters long.";
    }
    if (username.length > 30) {
        return "Username cannot exceed 30 characters.";
    }
    // Optional: Add regex for allowed characters if needed (e.g., alphanumeric only)
    // if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    //      return "Username can only contain letters, numbers, and underscores.";
    // }
    return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) return "Confirm password is required.";
    if (password !== confirmPassword) {
        return "Passwords do not match.";
    }
    return null;
};

export const validateOtp = (otp, length) => {
    if (!otp) return "OTP is required.";
    // Ensure OTP is exactly 'length' digits
    if (otp.length !== length || !/^\d+$/.test(otp)) {
        return `OTP must be a ${length}-digit number.`;
    }
    return null;
};

export const validateTitle = (title) => {
    if (!title) return "Title is required.";
    if (title.length < 5) return "Title must be at least 5 characters.";
    if (title.length > 100) return "Title cannot exceed 100 characters.";
    return null;
};

export const validateDescription = (description) => {
    if (!description) return "Description is required.";
    if (description.length < 10) return "Description must be at least 10 characters.";
    if (description.length > 500) return "Description cannot exceed 500 characters.";
    return null;
};

export const validateContent = (content) => {
    // Check for empty content, including just a <p><br></p> from rich text editors
    if (!content || content.trim() === "" || content === "<p><br></p>") return "Content cannot be empty.";
    if (content.length < 50) return "Content must be at least 50 characters."; // Basic length check for rich text
    return null;
};

export const validateCategoryId = (categoryId) => {
    if (!categoryId) return "Category is required.";
    return null;
};

export const validateRating = (rating) => {
    if (rating === null || rating === undefined) return "Rating is required.";
    if (rating < 1 || rating > 5) return "Rating must be between 1 and 5.";
    return null;
};

export const validateTransactionId = (transactionId) => {
    if (!transactionId) return "Transaction ID is required.";
    if (transactionId.length < 5) return "Transaction ID seems too short."; // Basic check
    return null;
};

// This was validateAnyEmail, renamed to be explicit for optional fields
export const validateOptionalString = (value) => {
    if (typeof value === 'string' && value.trim() === '') return null; // Empty string is valid (optional)
    return null; // Return null if not empty (further type-specific validation might be needed elsewhere)
};

// Refined validateUrl to handle optional URLs correctly
export const validateUrl = (url) => {
    if (!url) return null; // If the URL is empty/null/undefined, it's valid because it's optional
    try {
        new URL(url); // Attempt to create a URL object to validate format
        return null; // Valid URL
    } catch (e) {
        return "Please enter a valid URL, or leave empty."; // Invalid format
    }
};

// Refined validateDate to handle optional dates correctly
export const validateDate = (dateString) => {
    if (!dateString) return null; // If the date string is empty, it's valid (optional)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return "Date must be in YYYY-MM-DD format, or leave empty.";
    }
    // Optional: Add more robust date validation if you need to check for valid dates (e.g., 2025-02-30 should be invalid)
    // For now, the regex is sufficient for format.
    return null;
};
