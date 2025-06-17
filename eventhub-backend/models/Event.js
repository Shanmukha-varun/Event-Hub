// Import Mongoose
const mongoose = require('mongoose');

// Define the schema for the Event collection
const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an event name'],
    trim: true,
    maxlength: [100, 'Event name cannot be more than 100 characters'],
  },
  date: {
    type: Date,
    required: [true, 'Please provide the event date and time'],
  },
  location: {
    type: String,
    required: [true, 'Please provide the event location'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide a ticket price (can be 0 for free events)'],
    min: [0, 'Price cannot be negative'],
    // Consider using Decimal128 for precise currency handling if needed:
    // type: mongoose.Schema.Types.Decimal128,
    // get: v => v != null ? parseFloat(v.toString()) : null // Convert Decimal128 to float when retrieving
  },
  imageUrl: {
    type: String,
    trim: true,
    // Basic URL validation (consider a more robust library if needed)
    match: [
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
        'Please provide a valid image URL (optional)'
    ],
    default: null, // Default to null if no image provided
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User who created the event
    ref: 'User', // Links to the 'User' model
    required: true, // Ensure every event has a creator linked
  },
  // Optional: Array to store references to users attending (can get large)
  // attendees: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User'
  // }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // You could add fields like 'category', 'capacity', 'tags', etc.
});

// Optional: Add indexes for frequently queried fields
EventSchema.index({ date: 1 }); // Index for sorting/querying by date
EventSchema.index({ createdBy: 1 }); // Index for querying events by creator

// Create and export the Event model
// Mongoose will create a collection named 'events'
module.exports = mongoose.model('Event', EventSchema);
