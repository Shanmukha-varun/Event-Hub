    // File: eventhub-backend/server.js
    // UPDATED CODE

    // Import necessary packages
    const express = require('express');
    const dotenv = require('dotenv');
    const cors = require('cors');
    const connectDB = require('./config/db');

    // Load environment variables from .env file
    dotenv.config();

    // Connect to the database
    connectDB();

    // Initialize Express app
    const app = express();

    // --- Middleware ---

    // Enable CORS
    app.use(cors());

    // Enable Express to parse JSON
    app.use(express.json());

    // --- Basic Route ---
    app.get('/', (req, res) => {
      res.send('EventHub API Running!');
    });

    // --- Define API Routes ---
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/events', require('./routes/eventRoutes'));
    app.use('/api/users', require('./routes/userRoutes'));
    app.use('/api/orders', require('./routes/orderRoutes')); // <-- ADDED THIS LINE

    // --- Start the Server ---
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });