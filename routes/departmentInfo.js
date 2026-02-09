const express = require('express');
const router = express.Router();
const DepartmentInfo = require('../models/DepartmentInfo');
const authMiddleware = require('../middleware/auth');

// GET department info
router.get('/', async (req, res) => {
  try {
    const info = await DepartmentInfo.getSingleton();
    res.json({ success: true, data: info });
  } catch (error) {
    console.error('Error fetching department info:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch department info' });
  }
});

// PUT (update) department info - requires authentication
router.put('/', authMiddleware, async (req, res) => {
  try {
    const {
      totalStudents,
      totalFaculty,
      yearLevels,
      subjectsCount,
      programCoordinator
    } = req.body;

    // Validate inputs
    if (totalStudents !== undefined && (typeof totalStudents !== 'number' || totalStudents < 0)) {
      return res.status(400).json({ success: false, error: 'Total students must be a non-negative number' });
    }

    if (totalFaculty !== undefined && (typeof totalFaculty !== 'number' || totalFaculty < 0)) {
      return res.status(400).json({ success: false, error: 'Total faculty must be a non-negative number' });
    }

    if (yearLevels !== undefined && (typeof yearLevels !== 'number' || yearLevels < 1)) {
      return res.status(400).json({ success: false, error: 'Year levels must be at least 1' });
    }

    if (subjectsCount !== undefined && (typeof subjectsCount !== 'number' || subjectsCount < 0)) {
      return res.status(400).json({ success: false, error: 'Subjects count must be a non-negative number' });
    }

    const info = await DepartmentInfo.getSingleton();

    if (totalStudents !== undefined) info.totalStudents = totalStudents;
    if (totalFaculty !== undefined) info.totalFaculty = totalFaculty;
    if (yearLevels !== undefined) info.yearLevels = yearLevels;
    if (subjectsCount !== undefined) info.subjectsCount = subjectsCount;
    
    if (programCoordinator !== undefined) {
      if (programCoordinator.name !== undefined) info.programCoordinator.name = programCoordinator.name;
      if (programCoordinator.email !== undefined) info.programCoordinator.email = programCoordinator.email;
    }

    info.updatedBy = req.user._id;
    await info.save();

    res.json({ success: true, data: info, message: 'Department info updated successfully' });
  } catch (error) {
    console.error('Error updating department info:', error);
    res.status(500).json({ success: false, error: 'Failed to update department info' });
  }
});

module.exports = router;
