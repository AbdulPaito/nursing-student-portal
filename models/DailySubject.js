const mongoose = require('mongoose');

const subjectItemSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Subject/Course name
  customName: { type: String, default: '' }, // Custom subject name
  type: { type: String, default: '' }, // Now stores unit/credit value (e.g., "3", "4.5")
  time: { type: String, default: '' }, // HH:MM format (e.g., "09:00")
  date: { type: String, default: '' }, // YYYY-MM-DD format (optional for specific dates)
  location: { type: String, default: '' }, // Room or location
  itemsNeeded: [{ type: String }], // Now stores year level (e.g., "1st Year", "2nd Year")
  sem: { type: String, default: '' }, // Semester (e.g., "1st Sem", "2nd Sem", "Midyear")
  isActive: { type: Boolean, default: true } // Active/Inactive status
}, { _id: false });

const dailySubjectSchema = new mongoose.Schema({
  dayOfWeek: { type: String, required: true }, // e.g., "Monday", "Tuesday", etc.
  subjects: [subjectItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('DailySubject', dailySubjectSchema);
