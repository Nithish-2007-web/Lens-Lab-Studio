// ==============================================================================
// Member 1: Backend Server & Routing
// Files Owned: server.js, routes.js
// Key Responsibilities:
// 1. Initialize Express application instance and configure PORT.
// 2. Register express.json() middleware to parse JSON request bodies.
// 3. Mount modular API router (routes.js).
// 4. Implement global 404 handler for unknown routes.
// 5. Ensure SQLite database is initialized before Express server begins listening.
// ==============================================================================

const express = require('express');
const { initializeDB } = require('./database/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Register API routes
app.use('/', routes);

// 404 Not Found handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database first, then start the Express server
const initializeDBAndServer = async () => {
  try {
    await initializeDB();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`Database initialization error: ${error.message}`);
    process.exit(1);
  }
};

// Start the application
initializeDBAndServer();

module.exports = app;
