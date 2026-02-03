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

// CORS Configuration
// Parse CORS_ORIGINS from env or use defaults
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

// Add common Netlify domains pattern
const allowedOrigins = [
  ...corsOrigins,
  // Allow any Netlify subdomain
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.netlify\.com$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health / smoke tests
app.get('/', (req, res) => {
  res.json({ 
    message: 'Nursing Student Portal API', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    dbReadyState: mongoose.connection.readyState,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    success: true,
    status: dbState === 1 ? 'healthy' : 'unhealthy',
    database: states[dbState] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Database middleware
function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    console.error('MongoDB not connected');
    return res.status(503).json({ 
      success: false,
      error: 'Database not connected. Please try again shortly.' 
    });
  }
  next();
}

// API routes
app.use('/api/auth', requireDb, authRoutes);
app.use('/api/admin', requireDb, authRoutes);  // Alias for auth routes
app.use('/api/events', requireDb, eventsRoutes);
app.use('/api/daily-subjects', requireDb, dailySubjectsRoutes);
app.use('/api/announcements', requireDb, announcementsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS error: Origin not allowed'
    });
  }
  
  res.status(err.status || 500).json({ 
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Port configuration
const PORT = process.env.PORT || 3000;

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (e) => {
  console.error('❌ MongoDB connection error:', e && e.message ? e.message : e);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

// Try connecting, but don't crash the process on transient failures
connectDB().catch((err) => {
  console.error('MongoDB initial connection failed:', err && err.message ? err.message : err);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Allowed CORS origins: ${corsOrigins.join(', ')}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /          - Health check`);
  console.log(`   GET  /api/test  - DB connection test`);
  console.log(`   GET  /api/health - Detailed health check`);
  console.log(`   POST /api/auth/register - Create admin account`);
  console.log(`   POST /api/auth/login    - Admin login`);
  console.log(`   GET  /api/auth/me       - Get current user`);
  console.log(`   GET  /api/events        - List all events`);
  console.log(`   GET  /api/announcements - List all announcements`);
  console.log(`   GET  /api/daily-subjects - List all subjects`);
  console.log('');
});

module.exports = app;
