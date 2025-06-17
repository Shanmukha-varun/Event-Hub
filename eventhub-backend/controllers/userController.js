// Import necessary models
const User = require('../models/User');
const Event = require('../models/Event'); // Needed to populate event details

/**
 * @desc    Get purchased tickets for the logged-in user
 * @route   GET /api/users/me/tickets
 * @access  Private
 */
const getMyTickets = async (req, res) => {
  try {
    // The user object (excluding password) is attached to req.user by the 'protect' middleware
    const userId = req.user._id;

    // Find the user and populate the event details within the purchasedTickets array
    // We select specific fields from the referenced Event model
    const userWithTickets = await User.findById(userId)
        .populate({
            path: 'purchasedTickets.eventId', // Path within the User document
            model: 'Event',                   // The model to use for population
            select: 'name date location price imageUrl' // Fields to select from the Event
        });

    if (!userWithTickets) {
      // Should not happen if protect middleware worked, but good practice to check
      return res.status(404).json({ message: 'User not found' });
    }

    // Respond with the purchased tickets array
    res.status(200).json(userWithTickets.purchasedTickets || []); // Send empty array if no tickets

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ message: 'Server error fetching tickets' });
  }
};

// Export controller functions
module.exports = {
  getMyTickets,
  // Add other user-related functions here later (e.g., get profile, update profile)
};
