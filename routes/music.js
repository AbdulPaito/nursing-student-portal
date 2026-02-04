const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Music = require('../models/Music');
const auth = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nursing-portal/music',
    resource_type: 'video', // Use 'video' for audio files in Cloudinary
    allowed_formats: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return 'music-' + uniqueSuffix;
    }
  }
});

const fileFilter = (req, file, cb) => {
  // Accept audio files only
  const allowedTypes = /mp3|wav|ogg|m4a|aac/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.includes('audio') || allowedTypes.test(file.mimetype);

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed (mp3, wav, ogg, m4a, aac)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// @route   POST /api/music/upload
// @desc    Upload a music file
// @access  Admin only
router.post('/upload', auth, upload.single('music'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      // Delete uploaded file from Cloudinary if not admin
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id, { resource_type: 'video' });
      }
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, location, duration } = req.body;

    if (!title || !location) {
      // Delete uploaded file from Cloudinary if validation fails
      if (req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id, { resource_type: 'video' });
      }
      return res.status(400).json({ message: 'Title and location are required' });
    }

    const music = new Music({
      title: title,
      fileName: req.file.filename || req.file.public_id,
      filePath: req.file.path, // Cloudinary URL
      fileSize: req.file.size || 0,
      duration: duration || 0,
      location: location,
      uploadedBy: req.user.id,
      cloudinaryId: req.file.public_id // Store for deletion
    });

    await music.save();

    res.status(201).json({
      message: 'Music uploaded successfully',
      music: music
    });
  } catch (error) {
    console.error('Music upload error:', error);
    // Delete uploaded file from Cloudinary if database save fails
    if (req.file && req.file.public_id) {
      try {
        await cloudinary.uploader.destroy(req.file.public_id, { resource_type: 'video' });
      } catch (deleteError) {
        console.error('Failed to delete file from Cloudinary:', deleteError);
      }
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/music
// @desc    Get all music files (admin only)
// @access  Admin only
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const music = await Music.find()
      .sort({ uploadedAt: -1 })
      .populate('uploadedBy', 'name email');

    res.json(music);
  } catch (error) {
    console.error('Get music error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/music/active/:location
// @desc    Get active music for a specific location (public)
// @access  Public
router.get('/active/:location', async (req, res) => {
  try {
    const { location } = req.params;

    if (!['login', 'portal', 'both'].includes(location)) {
      return res.status(400).json({ message: 'Invalid location' });
    }

    // Find active music for the specified location
    const music = await Music.findOne({
      $or: [
        { location: location },
        { location: 'both' }
      ],
      isActive: true
    }).sort({ uploadedAt: -1 });

    if (!music) {
      return res.json({ message: 'No active music found' });
    }

    res.json(music);
  } catch (error) {
    console.error('Get active music error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/music/:id/toggle
// @desc    Toggle music active status
// @access  Admin only
router.put('/:id/toggle', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const music = await Music.findById(req.params.id);

    if (!music) {
      return res.status(404).json({ message: 'Music not found' });
    }

    music.isActive = !music.isActive;
    await music.save();

    res.json({
      message: `Music ${music.isActive ? 'activated' : 'deactivated'} successfully`,
      music: music
    });
  } catch (error) {
    console.error('Toggle music error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/music/:id
// @desc    Delete a music file
// @access  Admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const music = await Music.findById(req.params.id);

    if (!music) {
      return res.status(404).json({ message: 'Music not found' });
    }

    // Delete file from Cloudinary
    if (music.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(music.cloudinaryId, { resource_type: 'video' });
      } catch (cloudError) {
        console.error('Failed to delete from Cloudinary:', cloudError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await Music.findByIdAndDelete(req.params.id);

    res.json({ message: 'Music deleted successfully' });
  } catch (error) {
    console.error('Delete music error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/music/:id
// @desc    Update music details
// @access  Admin only
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { title, location } = req.body;

    const music = await Music.findById(req.params.id);

    if (!music) {
      return res.status(404).json({ message: 'Music not found' });
    }

    if (title) music.title = title;
    if (location) music.location = location;

    await music.save();

    res.json({
      message: 'Music updated successfully',
      music: music
    });
  } catch (error) {
    console.error('Update music error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
