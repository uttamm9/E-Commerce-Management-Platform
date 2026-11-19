require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to database and start HTTP server
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });

    // Handle unhandled promise rejections gracefully
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Promise Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error(`Uncaught Exception: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Server initialization error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
