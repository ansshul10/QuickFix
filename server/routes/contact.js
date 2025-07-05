const express = require('express');
const {
    submitContactMessage,
    getAllContactMessages,
    getContactMessageById,
    updateContactMessage,
    deleteContactMessage,
    getTicketByNumber
} = require('../controllers/contactController'); // <-- replyToContactMessage removed
const { protect } = require('../middleware/authMiddleware'); // Assuming authorize('admin') is handled inside routes or not needed for this logic
const validate = require('../middleware/validationMiddleware');
const {
    submitContactMessageSchema,
    updateContactMessageSchema
    // replyContactMessageSchema removed
} = require('../utils/validation');

const router = express.Router();

// PUBLIC ROUTES
router.get('/ticket/:ticketNumber', getTicketByNumber);
router.post('/', validate(submitContactMessageSchema), submitContactMessage);


// ADMIN ROUTES
// All routes below this line require user to be authenticated
router.use(protect);

router.route('/admin')
    .get(getAllContactMessages);

router.route('/admin/:id')
    .get(getContactMessageById)
    // This PUT route is now the single endpoint for all ticket updates
    .put(validate(updateContactMessageSchema), updateContactMessage)
    .delete(deleteContactMessage);

// The separate POST route for replying has been removed for simplicity.

module.exports = router;