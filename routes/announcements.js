const express = require('express');
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');

const router = express.Router();

// Public: get active announcements (carousel-ready)
router.get('/', async (req, res) => {
  try {
    const list = await Announcement.find({ active: { $ne: false } }).sort({ date: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create
router.post('/', auth, async (req, res) => {
  try {
    const doc = new Announcement(req.body);
    await doc.save();
    res.status(201).json({ success: true, message: 'Announcement created.', data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin: update
router.put('/:id', auth, async (req, res) => {
  try {
    const doc = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Announcement not found.' });
    res.json({ success: true, message: 'Announcement updated.', data: doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Announcement.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Announcement not found.' });
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
