require('dotenv').config({ override: true });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const {
  MONGODB_URI,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME,
} = process.env;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function seedAdmin() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    throw new Error(
      'ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME environment variables must be set'
    );
  }

  await connectDB();

  const adminEmailLower = ADMIN_EMAIL.toLowerCase();
  const emailRegex = new RegExp(`^${escapeRegex(adminEmailLower)}$`, 'i');

  const existingAdmin = await User.findOne({ email: emailRegex });

  if (existingAdmin) {
    existingAdmin.name = ADMIN_NAME;
    existingAdmin.email = ADMIN_EMAIL;
    existingAdmin.role = 'admin';
    existingAdmin.password = ADMIN_PASSWORD;

    await existingAdmin.save();
    console.log('Admin updated');
  } else {
    const admin = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: 'admin',
      password: ADMIN_PASSWORD,
    });

    await admin.save();
    console.log('Admin created');
  }
}

seedAdmin()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed error:', error && error.message ? error.message : error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });
