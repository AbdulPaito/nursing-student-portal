const mongoose = require('mongoose');

const departmentInfoSchema = new mongoose.Schema({
  totalStudents: {
    type: Number,
    default: 0,
    min: 0
  },
  totalFaculty: {
    type: Number,
    default: 0,
    min: 0
  },
  yearLevels: {
    type: Number,
    default: 4,
    min: 1
  },
  subjectsCount: {
    type: Number,
    default: 20,
    min: 0
  },
  programCoordinator: {
    name: {
      type: String,
      default: 'BSN 2C - AQUINO (2025-2026)'
    },
    email: {
      type: String,
      default: 'nursing@msu.edu.ph'
    }
  },
  mission: {
    type: String,
    default: 'To produce competent, compassionate, and ethical nursing professionals equipped with the knowledge, skills, and values to meet the healthcare needs of the community and the global society.'
  },
  vision: {
    type: String,
    default: 'A Center of Excellence in Nursing Education that molds students to become leaders in the healthcare industry, committed to service, innovation, and lifelong learning.'
  },
  goals: {
    type: String,
    default: 'To continually improve the nursing curriculum, enhance clinical training facilities, and foster partnerships with healthcare institutions for the holistic development of nursing students.'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one document exists
departmentInfoSchema.statics.getSingleton = async function() {
  let info = await this.findOne();
  if (!info) {
    info = await this.create({
      totalStudents: 0,
      totalFaculty: 0,
      yearLevels: 4,
      subjectsCount: 20
    });
  }
  return info;
};

module.exports = mongoose.model('DepartmentInfo', departmentInfoSchema);
