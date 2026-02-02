require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedAdmin() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const count = await User.countDocuments({ role: 'admin' });
    console.log(`Admin seed skipped. Admin accounts are managed manually in MongoDB Atlas. Current admin count: ${count}`);
  } catch (err) {
    console.error('Seed error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
