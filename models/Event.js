const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, default: '' },
  items: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
