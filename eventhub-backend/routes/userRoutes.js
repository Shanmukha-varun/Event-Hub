// Import necessary modules
const express = require('express');
const { getMyTickets } = require('../controllers/userController'); // Import user controller
const { protect } = require('../middleware/authMiddleware'); // Import auth middleware

// Create router instance
const router = express.Router();

// --- Define User Routes ---

// @route   GET /api/users/me/tickets
// @desc    Get logged-in user's purchased tickets
// @access  Private
router.get('/me/tickets', protect, getMyTickets); // Protect this route


// Add other user-related routes here (e.g., GET /me for profile)


// Export the router
module.exports = router;
