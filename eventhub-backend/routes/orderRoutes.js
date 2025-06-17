    // File: eventhub-backend/routes/orderRoutes.js

    const express = require('express');
    const { createOrder } = require('../controllers/orderController');
    const { protect } = require('../middleware/authMiddleware');

    const router = express.Router();

    // @route   POST /api/orders
    // @desc    Create a new order (confirm purchase from cart)
    // @access  Private
    router.post('/', protect, createOrder);

    module.exports = router;