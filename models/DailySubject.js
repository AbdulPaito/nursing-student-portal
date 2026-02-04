const mongoose = require('mongoose');

const subjectItemSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Subject name
  customName: { type: String, default: '' }, // Custom subject name (e.g., "Algebra Basics")
  type: { type: String, enum: ['Theory', 'Practical', 'Lab', 'Seminar', 'Other'], default: 'Theory' },
  time: { type: String, default: '' }, // HH:MM format (e.g., "09:00")
  date: { type: String, default: '' }, // YYYY-MM-DD format (optional for specific dates)
  location: { type: String, default: '' }, // Room or location
  itemsNeeded: [{ type: String }] // Array of items needed
}, { _id: false });

const dailySubjectSchema = new mongoose.Schema({
  dayOfWeek: { type: String, required: true }, // e.g., "Monday", "Tuesday", etc.
  subjects: [subjectItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('DailySubject', dailySubjectSchema);
