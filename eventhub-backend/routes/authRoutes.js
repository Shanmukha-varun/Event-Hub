// Import necessary modules
const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController'); // Import controller functions

// Create an Express router instance
const router = express.Router();

// --- Define Authentication Routes ---

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', loginUser);


// Export the router
module.exports = router;
