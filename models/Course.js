const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: Number,
    required: true,
    min: 0
  },
  subjectType: {
    type: String,
    trim: true,
    default: ''
  },
  yearLevel: {
    type: String,
    required: true,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  },
  semester: {
    type: String,
    required: true,
    enum: ['1st Semester', '2nd Semester', 'Midyear', 'Summer']
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Index for faster queries
courseSchema.index({ code: 1 });
courseSchema.index({ yearLevel: 1, semester: 1 });

module.exports = mongoose.model('Course', courseSchema);
