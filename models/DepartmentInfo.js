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
    info = await this.create({ totalStudents: 0, totalFaculty: 0 });
  }
  return info;
};

module.exports = mongoose.model('DepartmentInfo', departmentInfoSchema);
