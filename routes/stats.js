const express = require('express');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const DailySubject = require('../models/DailySubject');

const router = express.Router();

// Get all statistics
router.get('/all', async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[now.getDay()];

    // Total events count
    const totalEvents = await Event.countDocuments();

    // Active announcements count
    const announcementsCount = await Announcement.countDocuments({ active: { $ne: false } });

    // Upcoming events count
    const upcomingEvents = await Event.countDocuments({ date: { $gte: today } });

    // Subjects today count
    const todaySubjects = await DailySubject.findOne({ dayOfWeek: todayName });
    const subjectsTodayCount = todaySubjects ? (todaySubjects.subjects || []).length : 0;

    res.json({
      success: true,
      stats: {
        totalEvents,
        announcementsCount,
        upcomingEvents,
        subjectsTodayCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get total events count
router.get('/events', async (req, res) => {
  try {
    const count = await Event.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get subjects today count
router.get('/subjects-today', async (req, res) => {
  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    
    const todaySubjects = await DailySubject.findOne({ dayOfWeek: today });
    const count = todaySubjects ? (todaySubjects.subjects || []).length : 0;
    
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get announcements count
router.get('/announcements', async (req, res) => {
  try {
    const count = await Announcement.countDocuments({ active: { $ne: false } });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get upcoming events count
router.get('/upcoming-events', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const count = await Event.countDocuments({ date: { $gte: today } });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
