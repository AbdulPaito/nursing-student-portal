const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  customName: { type: String, default: '' }, // Alternative/custom name for the event
  description: { type: String, default: '' },
  category: { type: String, default: '' }, // e.g., "Academic", "Social", "Healthcare"
  type: { type: String, default: 'General' }, // e.g., "Seminar", "Workshop", "Orientation", "General"
  date: { type: String, required: true }, // YYYY-MM-DD format (kept for backward compatibility)
  startDate: { type: String, default: '' }, // Start date for multi-day events
  endDate: { type: String, default: '' }, // End date for multi-day events
  time: { type: String, required: true }, // HH:MM format (kept for backward compatibility)
  startTime: { type: String, default: '' }, // Start time (HH:MM format)
  endTime: { type: String, default: '' }, // End time (HH:MM format)
  location: { type: String, default: '' },
  items: [{ type: String }] // Items needed for the event
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
