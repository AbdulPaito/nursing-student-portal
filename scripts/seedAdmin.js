require('dotenv').config({ override: true });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
  // Validate environment variables
  if (!MONGODB_URI) {
    throw new Error('❌ MONGODB_URI environment variable is not set');
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    throw new Error(
      '❌ ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME environment variables must be set'
    );
  }

  console.log('🔌 Connecting to MongoDB...');
  await connectDB();
  console.log('✅ Connected to MongoDB');

  const adminEmailLower = ADMIN_EMAIL.toLowerCase().trim();
  const emailRegex = new RegExp(`^${escapeRegex(adminEmailLower)}$`, 'i');

  console.log(`🔍 Checking for existing admin: ${ADMIN_EMAIL}`);
  
  const existingAdmin = await User.findOne({ email: emailRegex });

  if (existingAdmin) {
    console.log('👤 Admin user found, updating...');
    
    // Update admin details
    existingAdmin.name = ADMIN_NAME;
    existingAdmin.email = ADMIN_EMAIL;
    existingAdmin.role = 'admin';
    
    // Only update password if it's different
    const isSamePassword = await bcrypt.compare(ADMIN_PASSWORD, existingAdmin.password);
    if (!isSamePassword) {
      console.log('🔑 Password changed, hashing new password...');
      existingAdmin.password = ADMIN_PASSWORD;
    }

    await existingAdmin.save();
    console.log('✅ Admin updated successfully');
    console.log(`   Name: ${existingAdmin.name}`);
    console.log(`   Email: ${existingAdmin.email}`);
    console.log(`   Role: ${existingAdmin.role}`);
    console.log(`   ID: ${existingAdmin._id}`);
  } else {
    console.log('👤 Creating new admin user...');
    
    const admin = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: 'admin',
      password: ADMIN_PASSWORD,
    });

    await admin.save();
    console.log('✅ Admin created successfully');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}`);
  }

  // Verify password was hashed correctly
  const verifyUser = await User.findOne({ email: emailRegex });
  const isPasswordHashed = await bcrypt.compare(ADMIN_PASSWORD, verifyUser.password);
  
  if (isPasswordHashed) {
    console.log('✅ Password verification: PASSWORD IS HASHED CORRECTLY');
  } else {
    console.error('❌ Password verification: FAILED - Password may not be hashed');
  }
}

seedAdmin()
  .then(async () => {
    console.log('\n🎉 Admin seeding completed successfully!');
    console.log('\nYou can now log in with:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\n❌ Seed error:', error && error.message ? error.message : error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });
