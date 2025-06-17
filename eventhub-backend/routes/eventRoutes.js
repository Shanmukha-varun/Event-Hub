    // Import necessary modules
    const express = require('express');
    const {
      getAllEvents,
      getEventById,
      createEvent,
      updateEvent,
      // purchaseTicket, // <-- COMMENTED OUT (or remove) this line
      deleteEvent,
    } = require('../controllers/eventController'); // Import event controller functions (ensure purchaseTicket is removed/commented out here too if modifying controller)
    const { protect } = require('../middleware/authMiddleware'); // Import authentication middleware

    // Create an Express router instance
    const router = express.Router();

    // --- Define Event Routes ---

    // GET /api/events - Get all events (Public)
    router.get('/', getAllEvents);

    // POST /api/events - Create a new event (Private)
    router.post('/', protect, createEvent); // Apply 'protect' middleware here

    // GET /api/events/:id - Get a single event (Public)
    router.get('/:id', getEventById);

    // PUT /api/events/:id - Update an event (Private & Owner)
    router.put('/:id', protect, updateEvent); // Add the PUT route for updating

    // DELETE /api/events/:id - Delete an event (Private & Owner)
    router.delete('/:id', protect, deleteEvent); // Apply 'protect' middleware here

    // POST /api/events/:id/purchase - Purchase a ticket for an event (Private)
    // router.post('/:id/purchase', protect, purchaseTicket); // <-- COMMENTED OUT (or remove) this route

    // Export the router
    module.exports = router;
    