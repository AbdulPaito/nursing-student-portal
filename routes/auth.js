const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const emailService = require('../utils/emailService');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new admin user
 * @access  Public (should be protected in production)
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

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
    // Password will be automatically hashed by the pre-save hook in User model
    const user = new User({
      name: String(name).trim(),
      email: emailTrimmed,
      password: String(password),
      role: 'admin'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login admin user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Find user by email (case-insensitive)
    const emailTrimmed = String(email).trim().toLowerCase();
    const user = await User.findOne({
      email: { $regex: new RegExp('^' + emailTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Compare password using bcrypt
    const passwordMatch = await user.comparePassword(String(password));

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is admin or superadmin
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin only.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response with first login status
    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      isFirstLogin: user.isFirstLogin,
      mustChangePassword: user.mustChangePassword
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current admin user
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      admin: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change admin password
 * @access  Private
 */
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide current password and new password'
      });
    }

    // Enhanced password validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain uppercase, lowercase, and numbers'
      });
    }

    // Check if new password is same as current
    const user = await User.findById(req.user._id);
    const isSameAsOld = await user.comparePassword(String(newPassword));
    if (isSameAsOld) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(String(currentPassword));
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = String(newPassword);
    user.isFirstLogin = false;
    user.mustChangePassword = false;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset PIN via email
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your email address'
      });
    }

    // Find user by email
    const emailTrimmed = String(email).trim().toLowerCase();
    const user = await User.findOne({
      email: { $regex: new RegExp('^' + emailTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a PIN has been sent'
      });
    }

    // Generate 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash PIN before storing
    const hashedPIN = await bcrypt.hash(pin, 10);
    
    // Store PIN and expiration (15 minutes)
    user.resetPasswordPIN = hashedPIN;
    user.resetPasswordPINExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Send email with PIN
    try {
      await emailService.sendPasswordResetPIN(user.email, pin, user.name);
      
      res.json({
        success: true,
        message: 'A 6-digit PIN has been sent to your email',
        expiresIn: 15 // minutes
      });
    } catch (emailError) {
      // Revert the PIN storage if email fails
      user.resetPasswordPIN = undefined;
      user.resetPasswordPINExpires = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send email. Please check email configuration or try again later.'
      });
    }

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/auth/verify-pin
 * @desc    Verify password reset PIN
 * @access  Public
 */
router.post('/verify-pin', async (req, res) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and PIN'
      });
    }

    // Find user
    const emailTrimmed = String(email).trim().toLowerCase();
    const user = await User.findOne({
      email: { $regex: new RegExp('^' + emailTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
    });

    if (!user || !user.resetPasswordPIN || !user.resetPasswordPINExpires) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired PIN'
      });
    }

    // Check if PIN is expired
    if (user.resetPasswordPINExpires < new Date()) {
      user.resetPasswordPIN = undefined;
      user.resetPasswordPINExpires = undefined;
      await user.save();
      
      return res.status(400).json({
        success: false,
        error: 'PIN has expired. Please request a new one.'
      });
    }

    // Verify PIN
    const isPINValid = await bcrypt.compare(String(pin), user.resetPasswordPIN);
    
    if (!isPINValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid PIN. Please check and try again.'
      });
    }

    // Generate temporary token for password reset (valid for 10 minutes)
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({
      success: true,
      message: 'PIN verified successfully',
      resetToken
    });

  } catch (err) {
    console.error('Verify PIN error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using verified PIN token
 * @access  Public (with reset token)
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide reset token and new password'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain uppercase, lowercase, and numbers'
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      
      if (decoded.purpose !== 'password-reset') {
        throw new Error('Invalid token purpose');
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update password and clear PIN
    user.password = String(newPassword);
    user.resetPasswordPIN = undefined;
    user.resetPasswordPINExpires = undefined;
    user.mustChangePassword = false;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
