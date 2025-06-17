// Import necessary modules
const User = require('../models/User'); // User model
const bcrypt = require('bcryptjs'); // For comparing passwords
const jwt = require('jsonwebtoken'); // For creating JSON Web Tokens

// --- Helper Function to Generate JWT ---
const generateToken = (userId) => {
  // Sign a new token with the user ID and the JWT secret
  // Set an expiration time (e.g., '1d' for 1 day, '30m' for 30 minutes)
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });
};


// --- Controller Functions ---

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  // 1. Extract data from request body
  const { name, email, password } = req.body;

  // 2. Basic Validation (ensure required fields are present)
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password' });
  }

  try {
    // 3. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 4. Create new user (password hashing happens via pre-save hook in User model)
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password, // Pass the plain password, it gets hashed before saving
    });

    // 5. Save the user to the database
    const savedUser = await newUser.save();

    // 6. Generate JWT
    const token = generateToken(savedUser._id);

    // 7. Respond with user info (excluding password) and token
    res.status(201).json({ // 201 Created
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      purchasedTickets: savedUser.purchasedTickets, // Send initial empty array
      token: token, // Send the JWT to the client
    });

  } catch (error) {
    console.error('Registration Error:', error);
    // Handle potential validation errors from Mongoose
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  // 1. Extract email and password from request body
  const { email, password } = req.body;

  // 2. Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    // 3. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // 4. Check if user exists and if password matches
    if (user && (await user.comparePassword(password))) {
      // Password matches!
      const token = generateToken(user._id);
      // 6. Respond with user info (excluding password) and token
      res.status(200).json({ // 200 OK
        _id: user._id,
        name: user.name,
        email: user.email,
        purchasedTickets: user.purchasedTickets, // Send current purchased tickets
        token: token,
      });
    } else {
      // User not found or password doesn't match
      res.status(401).json({ message: 'Invalid email or password' }); // 401 Unauthorized
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};


// Export the controller functions
module.exports = {
  registerUser,
  loginUser,
};
