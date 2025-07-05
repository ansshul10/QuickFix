// quickfix-website/server/routes/settings.js
const express = require('express');
const { getSettings, manageSettings } = require('../controllers/adminController'); // Settings are managed by adminController
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { updateSettingSchema } = require('../utils/validation');

const router = express.Router();

// All settings routes are for admin only
router.use(protect, authorize('admin'));

router.route('/')
    .get(getSettings) // Get all global settings (admin view)
    .put(validate(updateSettingSchema), manageSettings); // Create/Update a setting


module.exports = router;