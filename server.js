require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const dailySubjectsRoutes = require('./routes/dailySubjects');
const announcementsRoutes = require('./routes/announcements');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Health / smoke tests
app.get('/', (req, res) => {
  res.json({ message: 'Nursing Student Portal API', status: 'running' });
});
app.get('/api/test', (req, res) => {
  res.json({ success: true, dbReadyState: mongoose.connection.readyState });
});

function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected. Please try again shortly.' });
  }
  next();
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/events', requireDb, eventsRoutes);
app.use('/api/daily-subjects', requireDb, dailySubjectsRoutes);
app.use('/api/announcements', requireDb, announcementsRoutes);

// 404 as JSON (API-only service)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler as JSON
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;

mongoose.connection.on('connected', () => console.log('MongoDB connected'));
mongoose.connection.on('error', (e) => console.error('MongoDB connection error:', e && e.message ? e.message : e));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

// Try connecting, but don't crash the process on transient failures (prevents Render 502/503 restarts)
connectDB().catch((err) => {
  console.error('MongoDB initial connection failed:', err && err.message ? err.message : err);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
