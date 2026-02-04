const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  location: {
    type: String,
    enum: ['login', 'portal', 'both'],
    required: true,
    default: 'both'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
musicSchema.index({ location: 1, isActive: 1 });

module.exports = mongoose.model('Music', musicSchema);
