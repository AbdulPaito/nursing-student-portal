const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  time: { type: String, default: '09:00' }, // HH:MM format
  type: { type: String, default: 'General' }, // e.g., "General", "Urgent", "Academic", "Event"
  itemsNeeded: [{ type: String }], // Optional items related to announcement
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
