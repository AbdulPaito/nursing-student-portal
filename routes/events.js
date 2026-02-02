const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

// Public: get all events (upcoming first, then past)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1, time: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: get upcoming events only
router.get('/upcoming', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const events = await Event.find({ date: { $gte: today } }).sort({ date: 1, time: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create event
router.post('/', auth, async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({ success: true, message: 'Event created.', data: event });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin: update event
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });
    res.json({ success: true, message: 'Event updated.', data: event });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin: delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
