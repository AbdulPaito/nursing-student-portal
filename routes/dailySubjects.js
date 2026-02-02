const express = require('express');
const DailySubject = require('../models/DailySubject');
const auth = require('../middleware/auth');

const router = express.Router();

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Public: get all daily subjects (ordered by day)
router.get('/', async (req, res) => {
  try {
    const docs = await DailySubject.find();
    docs.sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: get by day
router.get('/day/:day', async (req, res) => {
  try {
    const doc = await DailySubject.findOne({ dayOfWeek: req.params.day });
    if (!doc) return res.json({ dayOfWeek: req.params.day, subjects: [] });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create daily subject (one document per day with subjects array)
router.post('/', auth, async (req, res) => {
  try {
    const subjectData = req.body.subject || (Array.isArray(req.body.subjects) && req.body.subjects[0]) || {};
    if (!subjectData.name) {
      return res.status(400).json({ success: false, error: 'Subject name is required.' });
    }
    let doc = await DailySubject.findOne({ dayOfWeek: req.body.dayOfWeek });
    if (doc) {
      doc.subjects = doc.subjects || [];
      doc.subjects.push({ name: subjectData.name, type: subjectData.type || 'Theory', itemsNeeded: Array.isArray(subjectData.itemsNeeded) ? subjectData.itemsNeeded : [] });
      await doc.save();
    } else {
      doc = new DailySubject({
        dayOfWeek: req.body.dayOfWeek,
        subjects: [{ name: subjectData.name, type: subjectData.type || 'Theory', itemsNeeded: Array.isArray(subjectData.itemsNeeded) ? subjectData.itemsNeeded : [] }]
      });
      await doc.save();
    }
    res.status(201).json({ success: true, message: 'Subject added.', data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin: update entire day document
router.put('/:id', auth, async (req, res) => {
  try {
    const doc = await DailySubject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Daily subject not found.' });
    res.json({ success: true, message: 'Subject updated.', data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin: delete subject from a day (by day id and subject index) or delete whole day
router.delete('/:id', auth, async (req, res) => {
  try {
    const { subjectIndex } = req.query;
    const doc = await DailySubject.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found.' });
    if (subjectIndex !== undefined) {
      const idx = parseInt(subjectIndex, 10);
      const subjects = doc.subjects || [];
      if (idx < 0 || idx >= subjects.length) {
        return res.status(400).json({ success: false, error: 'Invalid subject index.' });
      }
      subjects.splice(idx, 1);
      doc.subjects = subjects;
      if (subjects.length === 0) await DailySubject.findByIdAndDelete(req.params.id);
      else await doc.save();
    } else {
      await DailySubject.findByIdAndDelete(req.params.id);
    }
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
