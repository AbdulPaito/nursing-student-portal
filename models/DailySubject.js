const mongoose = require('mongoose');

const subjectItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Theory', 'Lab', 'Seminar'], default: 'Theory' },
  itemsNeeded: [{ type: String }]
}, { _id: false });

const dailySubjectSchema = new mongoose.Schema({
  dayOfWeek: { type: String, required: true },
  subjects: [subjectItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('DailySubject', dailySubjectSchema);
