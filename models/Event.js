const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  customName: { type: String, default: '' }, // Alternative/custom name for the event
  description: { type: String, default: '' },
  category: { type: String, default: '' }, // e.g., "Academic", "Social", "Healthcare"
  type: { type: String, default: 'General' }, // e.g., "Seminar", "Workshop", "Orientation", "General"
  date: { type: String, required: true }, // YYYY-MM-DD format
  time: { type: String, required: true }, // HH:MM format
  location: { type: String, default: '' },
  items: [{ type: String }] // Items needed for the event
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
