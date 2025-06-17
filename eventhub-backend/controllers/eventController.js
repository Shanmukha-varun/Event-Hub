// Import necessary modules
const Event = require('../models/Event');
const User = require('../models/User');
// Import mongoose if you need ObjectId validation directly (optional)
// const mongoose = require('mongoose');

// --- Controller Functions ---

/**
 * @desc    Get all events
 * @route   GET /api/events
 * @access  Public
 */
const getAllEvents = async (req, res) => {
  try {
    // Find all events, sort by date descending (newest first)
    // Optionally populate createdBy field with user's name and email
    const events = await Event.find().sort({ date: -1 }).populate('createdBy', 'name email');
    res.status(200).json(events); // 200 OK
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
};

/**
 * @desc    Get a single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    // Find event by its ID and populate creator info
    const event = await Event.findById(eventId).populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' }); // 404 Not Found
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Error fetching single event:', error);
     // Handle invalid MongoDB ObjectId format
     if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid event ID format' });
     }
    res.status(500).json({ message: 'Server error fetching event' });
  }
};

/**
 * @desc    Create a new event
 * @route   POST /api/events
 * @access  Private (Requires login)
 */
const createEvent = async (req, res) => {
  // Extract event details from request body
  const { name, date, location, description, price, imageUrl } = req.body;

  // Basic validation
  if (!name || !date || !location || !description || price === undefined || price === null) {
    return res.status(400).json({ message: 'Please provide all required event fields (name, date, location, description, price)' });
  }
   if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
     return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
   }

  try {
    // Create the new event object
    const newEvent = new Event({
      name,
      date,
      location,
      description,
      price: parseFloat(price), // Ensure price is stored as a number
      imageUrl: imageUrl || null, // Use null if imageUrl is empty/not provided
      createdBy: req.user._id, // Get user ID from the authenticated user (attached by 'protect' middleware)
    });

    // Save the event to the database
    const savedEvent = await newEvent.save();

    // Respond with the created event data
    res.status(201).json(savedEvent); // 201 Created

  } catch (error) {
    console.error('Error creating event:', error);
     if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating event' });
  }
};

/**
 * @desc    Update an existing event
 * @route   PUT /api/events/:id
 * @access  Private (Requires login and ownership)
 */
const updateEvent = async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user._id; // From protect middleware
    const { name, date, location, description, price, imageUrl } = req.body; // Get updated data

    // Basic validation for incoming data
    if (!name || !date || !location || !description || price === undefined || price === null) {
        return res.status(400).json({ message: 'Please provide all required event fields for update' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({ message: 'Updated price must be a valid non-negative number.' });
    }

    try {
        // 1. Find the event by ID
        const event = await Event.findById(eventId);

        // 2. Check if event exists
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // 3. Check if the logged-in user is the creator
        if (event.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'User not authorized to update this event' }); // 403 Forbidden
        }

        // 4. Update the event fields
        event.name = name;
        event.date = date;
        event.location = location;
        event.description = description;
        event.price = parseFloat(price);
        event.imageUrl = imageUrl || event.imageUrl; // Keep old image if new one isn't provided

        // 5. Save the updated event (this will trigger validation defined in the schema)
        const updatedEvent = await event.save();

        // 6. Respond with the updated event data
        res.status(200).json(updatedEvent); // 200 OK

    } catch (error) {
        console.error('Error updating event:', error);
        if (error.kind === 'ObjectId') {
           return res.status(400).json({ message: 'Invalid event ID format' });
        }
        if (error.name === 'ValidationError') {
           const messages = Object.values(error.errors).map(val => val.message);
           return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error updating event' });
    }
};


/**
 * @desc    Purchase a ticket for an event
 * @route   POST /api/events/:id/purchase
 * @access  Private (Requires login)
 */
const purchaseTicket = async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user._id; // From protect middleware

    try {
        // 1. Find the event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // 2. Find the user (we need the full user object to update)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 3. Check if user already purchased a ticket for this event
        const alreadyPurchased = user.purchasedTickets.some(
            ticket => ticket.eventId.toString() === eventId.toString()
        );
        if (alreadyPurchased) {
            return res.status(400).json({ message: 'Ticket already purchased for this event' });
        }

        // 4. Generate a unique ticket ID
        const ticketId = `TKT-${eventId.toString().slice(-4)}-${Date.now().toString().slice(-6)}`;

        // 5. Create the ticket object
        const newTicket = { eventId: eventId, ticketId: ticketId, purchaseDate: new Date() };

        // 6. Add the ticket to the user's array
        user.purchasedTickets.push(newTicket);

        // 7. Save the updated user document
        await user.save();

        // 8. Respond with success
        res.status(200).json({ message: 'Ticket purchased successfully', ticket: newTicket });

    } catch (error) {
        console.error('Error purchasing ticket:', error);
        if (error.kind === 'ObjectId') {
           return res.status(400).json({ message: 'Invalid event ID format' });
        }
        res.status(500).json({ message: 'Server error purchasing ticket' });
    }
};


/**
 * @desc    Delete an event
 * @route   DELETE /api/events/:id
 * @access  Private (Requires login and ownership)
 */
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'User not authorized to delete this event' });
    }

    // Clean up user purchased tickets
    await User.updateMany(
        { 'purchasedTickets.eventId': eventId },
        { $pull: { purchasedTickets: { eventId: eventId } } }
    );

    await event.deleteOne();

    res.status(200).json({ message: 'Event deleted successfully', eventId: eventId });

  } catch (error) {
    console.error('Error deleting event:', error);
     if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid event ID format' });
     }
    res.status(500).json({ message: 'Server error deleting event' });
  }
};


// Export controller functions
module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent, // Export the new update function
  purchaseTicket,
  deleteEvent,
};
