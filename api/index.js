const express = require('express');
const cors = require('cors');
const path = require('path');

// Import backend modules
const config = require('../backend/src/config');
const availabilityRouter = require('../backend/src/routes/availability');

const app = express();
app.use(express.json());
app.use(cors());

// API routes
app.use('/availability', availabilityRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend is running' });
});

module.exports = app;
