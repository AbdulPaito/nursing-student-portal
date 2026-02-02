require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

async function seedAdmin() {
  try {
    const adminName = process.env.ADMIN_NAME || 'Admin';
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
    if (!adminEmail) throw new Error('ADMIN_EMAIL not set');
    if (!adminPassword) throw new Error('ADMIN_PASSWORD not set');

    await connectDB();
    console.log('Connected to MongoDB');

    const emailTrimmed = String(adminEmail).trim();
    const emailRegex = new RegExp('^' + emailTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');

    const existing = await User.findOne({ email: { $regex: emailRegex } });

    if (existing) {
      existing.name = adminName;
      existing.email = emailTrimmed;
      existing.role = 'admin';
      existing.password = String(adminPassword);
      await existing.save();
      console.log(`Admin user updated: ${existing.email}`);
    } else {
      const user = new User({
        name: adminName,
        email: emailTrimmed,
        password: String(adminPassword),
        role: 'admin'
      });
      await user.save();
      console.log(`Admin user created: ${user.email}`);
    }
  } catch (err) {
    console.error('Seed error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
