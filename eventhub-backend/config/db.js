// Import Mongoose
const mongoose = require('mongoose');

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    // Get the MongoDB connection string from environment variables
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('MONGO_URI not found in environment variables. Please set it in your .env file.');
      process.exit(1); // Exit process with failure
    }

    // Attempt to connect to the database
    const conn = await mongoose.connect(mongoURI, {
      // Mongoose connection options (optional but recommended)
      // useNewUrlParser: true, // No longer needed in Mongoose 6+
      // useUnifiedTopology: true, // No longer needed in Mongoose 6+
      // useCreateIndex: true, // No longer needed in Mongoose 6+
      // useFindAndModify: false // No longer needed in Mongoose 6+
    });

    // Log success message if connected
    console.log(`MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    // Log error message if connection fails
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit the process with failure code
    process.exit(1);
  }
};

// Export the connectDB function
module.exports = connectDB;
