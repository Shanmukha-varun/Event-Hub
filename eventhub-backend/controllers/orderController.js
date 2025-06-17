    // File: eventhub-backend/controllers/orderController.js
    // UPDATED: Removed MongoDB Transaction Logic

    const User = require('../models/User');
    const Event = require('../models/Event');
    const { sendOrderConfirmationEmail, sendAdminNotificationEmail } = require('../services/emailService');
    const mongoose = require('mongoose'); // Still needed for ObjectId validation

    /**
     * @desc    Create a new order from cart items (simulates purchase)
     * @route   POST /api/orders
     * @access  Private
     */
    const createOrder = async (req, res) => {
        // cartItems should be an array like: [{ eventId: '...', quantity: 2 }, ...]
        const { cartItems } = req.body;
        const userId = req.user._id;

        // --- Basic Validation ---
        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart items are required' });
        }
        for (const item of cartItems) {
            if (!item.eventId || !mongoose.Types.ObjectId.isValid(item.eventId) || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
                 return res.status(400).json({ message: 'Invalid cart item data. Each item needs a valid eventId and a positive integer quantity.' });
            }
        }
        // ------------------------

        try {
            // --- Database Operations (No Transaction) ---

            // 1. Find the user
            // Use lean() for potentially better performance if only reading initially,
            // but we need the full Mongoose document to save later.
            const user = await User.findById(userId);
            if (!user) {
                // This check remains important
                return res.status(404).json({ message: 'User not found' });
            }

            // 2. Find all necessary events and populate creator email
            const eventIds = cartItems.map(item => item.eventId);
            const events = await Event.find({ '_id': { $in: eventIds } }).populate('createdBy', 'email'); // Populate creator email

            // Create a map for quick event lookup
            const eventMap = new Map(events.map(event => [event._id.toString(), event]));

            // 3. Prepare ticket data and admin notifications
            const newlyCreatedTickets = []; // To store tickets created
            const adminNotifications = new Map(); // Map<creatorEmail, { buyerUser: user, tickets: [], eventDetailsMap: Map }>

            for (const item of cartItems) {
                const event = eventMap.get(item.eventId);
                if (!event) {
                    // If an event wasn't found, stop the process
                    return res.status(404).json({ message: `Event with ID ${item.eventId} not found.` });
                }

                const creatorEmail = event.createdBy?.email; // Get creator email

                for (let i = 0; i < item.quantity; i++) {
                    // Generate unique ticket ID
                    const ticketId = `TKT-${event._id.toString().slice(-4)}-${Date.now().toString().slice(-5)}-${Math.random().toString(36).substring(2, 7)}`;

                    const newTicket = {
                        eventId: event._id,
                        ticketId: ticketId,
                        purchaseDate: new Date(),
                    };
                    // Add directly to the user document's array
                    user.purchasedTickets.push(newTicket);
                    newlyCreatedTickets.push(newTicket); // Add to list for email

                    // Prepare admin notification data
                     if (creatorEmail) {
                        if (!adminNotifications.has(creatorEmail)) {
                            adminNotifications.set(creatorEmail, {
                                buyerUser: { _id: user._id, name: user.name, email: user.email },
                                tickets: [],
                                eventDetailsMap: new Map()
                            });
                        }
                        const notificationData = adminNotifications.get(creatorEmail);
                        notificationData.tickets.push(newTicket);
                        if (!notificationData.eventDetailsMap.has(event._id.toString())) {
                            notificationData.eventDetailsMap.set(event._id.toString(), {
                                name: event.name,
                                date: event.date,
                                location: event.location
                            });
                        }
                    }
                }
            }

            // 4. Save the updated user document
            // This is now a single save operation for the user
            await user.save();

            // --- Send Emails (After successful save) ---
            // Prepare event details map for user email
            const userEventDetailsMap = new Map();
            newlyCreatedTickets.forEach(ticket => {
                const eventIdStr = ticket.eventId.toString();
                if (!userEventDetailsMap.has(eventIdStr)) {
                    const event = eventMap.get(eventIdStr);
                    if (event) {
                        userEventDetailsMap.set(eventIdStr, {
                             name: event.name,
                             date: event.date,
                             location: event.location
                        });
                    }
                }
            });

            // Send confirmation email to the buyer (fire-and-forget, don't block response)
            sendOrderConfirmationEmail(user, newlyCreatedTickets, userEventDetailsMap)
                .catch(err => console.error("Failed to send buyer confirmation email:", err));

            // Send notification emails to event creators (fire-and-forget)
            for (const [creatorEmail, data] of adminNotifications.entries()) {
                 sendAdminNotificationEmail(creatorEmail, data.buyerUser, data.tickets, data.eventDetailsMap)
                     .catch(err => console.error(`Failed to send admin notification email to ${creatorEmail}:`, err));
            }
            // -----------------------------------------

            // 5. Send Success Response
            res.status(201).json({
                message: 'Purchase successful! Check your email for tickets.',
                tickets: newlyCreatedTickets // Send back the generated tickets
            });

        } catch (error) {
            // Catch any errors during find or save
            console.error('Order creation failed:', error);
            res.status(500).json({ message: error.message || 'Server error processing purchase.' });
        }
    };

    module.exports = {
        createOrder,
    };
    