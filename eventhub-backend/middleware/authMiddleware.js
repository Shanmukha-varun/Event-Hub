// Import necessary modules
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Need User model to find the user from token

/**
 * Middleware to protect routes by verifying JWT.
 * If token is valid, attaches user data (excluding password) to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // Check if the Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 1. Get token from header (remove 'Bearer ' prefix)
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify the token using the JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user associated with the token's ID
      //    Exclude the password field from the result
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
          // Handle case where user associated with token no longer exists
          return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // 4. Call the next middleware/route handler
      next();

    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' }); // 401 Unauthorized
    }
  }

  // If no token is found in the header
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Export the middleware
module.exports = { protect };
