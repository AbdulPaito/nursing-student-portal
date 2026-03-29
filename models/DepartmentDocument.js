const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  comment: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    email: String,
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    userName: String,
    userEmail: String,
    userRole: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const departmentDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  contentType: {
    type: String,
    enum: ['file', 'text'],
    default: 'file'
  },

  // For uploaded files
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt']
  },
  fileSize: {
    type: Number // in bytes
  },
  cloudinaryPublicId: {
    type: String
  },

  // For text content
  textContent: {
    type: String
  },

  dateIssued: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  downloadedBy: [{
    userId: String,
    userName: String,
    downloadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // View tracking
  viewCount: {
    type: Number,
    default: 0
  },

  // Comments
  comments: [commentSchema],

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
departmentDocumentSchema.index({ isPublished: 1, isPinned: -1, dateIssued: -1 });
departmentDocumentSchema.index({ category: 1 });

module.exports = mongoose.model('DepartmentDocument', departmentDocumentSchema);
