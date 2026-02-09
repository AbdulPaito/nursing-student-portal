const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Add current user ID to response so frontend can identify logged-in user
    res.json({
      success: true,
      users,
      currentUserId: req.user._id
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create new user (Super Admin can create any role, regular admin creates admin only)
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Only Super Admin can create Super Admin accounts
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Super Admin can create Super Admin accounts.'
      });
    }

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const emailTrimmed = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({
      email: { $regex: new RegExp('^' + emailTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name: String(name).trim(),
      email: emailTrimmed,
      password: String(password),
      role: role || 'admin',
      isFirstLogin: true,
      mustChangePassword: true,
      createdBy: req.user._id
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        mustChangePassword: user.mustChangePassword
      },
      temporaryPassword: password // Return temp password for admin to give to user
    });

  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Super Admin can change roles, regular admin can only update name/email)
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const userId = req.params.id;

    // Only Super Admin can change roles
    if (role && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Super Admin can change user roles.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = String(name).trim();
    if (email) {
      const emailTrimmed = String(email).trim().toLowerCase();
      // Check if email already exists for another user
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        email: { $regex: new RegExp('^' + emailTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
      }
      user.email = emailTrimmed;
    }
    if (role) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Super Admin only)
 * @access  Private (Super Admin only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Only Super Admin can delete any user
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Super Admin can delete user accounts.'
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Super Admin resets user password and sends notification
 * @access  Private (Super Admin only)
 */
router.post('/:id/reset-password', auth, async (req, res) => {
  try {
    const { newPassword, sendEmail } = req.body;
    const userId = req.params.id;

    // Only Super Admin can reset passwords
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Super Admin can reset passwords.'
      });
    }

    // Prevent super admin from resetting their own password via this endpoint
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reset your own password. Use "Change Password" instead.'
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide new password'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Reset password and force change on next login
    user.password = String(newPassword);
    user.mustChangePassword = true;
    await user.save();

    // Try to send email notification (optional)
    let emailSent = false;
    if (sendEmail) {
      try {
        const emailService = require('../utils/emailService');
        await emailService.sendPasswordResetNotification(
          user.email, 
          newPassword, 
          user.name
        );
        emailSent = true;
      } catch (emailError) {
        console.warn('Failed to send password reset email:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      temporaryPassword: newPassword, // Return for admin to give to user
      emailSent: emailSent,
      warning: 'User must be notified of their new temporary password'
    });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/users/generate-password
 * @desc    Generate strong random password for admin
 * @access  Private
 */
router.post('/generate-password', auth, async (req, res) => {
  try {
    // Generate strong random password: 12 characters
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%^&*';
    
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    // Fill remaining characters
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    res.json({
      success: true,
      password
    });

  } catch (err) {
    console.error('Generate password error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
