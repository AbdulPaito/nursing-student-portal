const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const authMiddleware = require('../middleware/auth');

// GET all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ yearLevel: 1, semester: 1, code: 1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch courses' });
  }
});

// GET single course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch course' });
  }
});

// POST create new course - requires authentication
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { code, name, unit, yearLevel, semester, status } = req.body;

    // Validate required fields
    if (!code || !name || unit === undefined || !yearLevel || !semester) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: code, name, unit, yearLevel, semester' 
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code: code.trim().toUpperCase() });
    if (existingCourse) {
      return res.status(400).json({ 
        success: false, 
        error: 'Course code already exists' 
      });
    }

    const course = new Course({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      unit: Number(unit),
      yearLevel,
      semester,
      status: status || 'Active'
    });

    await course.save();
    res.status(201).json({ success: true, data: course, message: 'Course created successfully' });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create course' });
  }
});

// PUT update course - requires authentication
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { code, name, unit, yearLevel, semester, status } = req.body;

    // Check if course exists
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // If updating code, check for duplicates
    if (code && code.trim().toUpperCase() !== course.code) {
      const existingCourse = await Course.findOne({ 
        code: code.trim().toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingCourse) {
        return res.status(400).json({ 
          success: false, 
          error: 'Course code already exists' 
        });
      }
    }

    // Update fields
    if (code) course.code = code.trim().toUpperCase();
    if (name) course.name = name.trim();
    if (unit !== undefined) course.unit = Number(unit);
    if (yearLevel) course.yearLevel = yearLevel;
    if (semester) course.semester = semester;
    if (status) course.status = status;

    await course.save();
    res.json({ success: true, data: course, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update course' });
  }
});

// DELETE course - requires authentication
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ success: false, error: 'Failed to delete course' });
  }
});

module.exports = router;
