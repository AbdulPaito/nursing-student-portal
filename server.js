require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const dailySubjectsRoutes = require('./routes/dailySubjects');
const announcementsRoutes = require('./routes/announcements');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/daily-subjects', dailySubjectsRoutes);
app.use('/api/announcements', announcementsRoutes);

// Public pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/events', (req, res) => res.sendFile(path.join(__dirname, 'public', 'events.html')));
app.get('/daily-subjects', (req, res) => res.sendFile(path.join(__dirname, 'public', 'daily-subjects.html')));
app.get('/announcements', (req, res) => res.sendFile(path.join(__dirname, 'public', 'announcements.html')));
// Admin: no-cache to prevent back-button bypass, login then dashboard
function noCache(req, res, next) { res.set('Cache-Control', 'no-store, no-cache, must-revalidate'); next(); }
app.get('/admin/login', noCache, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html')));
app.get('/admin', noCache, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html')));
app.get('/admin/*', noCache, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
