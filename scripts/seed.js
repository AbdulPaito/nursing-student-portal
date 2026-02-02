/**
 * Seed script: creates an initial admin user and sample data.
 * Run once after setting MONGODB_URI and JWT_SECRET in .env
 * Usage: node scripts/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const DailySubject = require('../models/DailySubject');
const Announcement = require('../models/Announcement');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nursing-portal';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'admin@nursing.edu' });
  if (existing) {
    console.log('Admin user already exists. Skipping user seed.');
  } else {
    await User.create({
      name: 'Admin User',
      email: 'admin@nursing.edu',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Created admin user: admin@nursing.edu / admin123');
  }

  if ((await Event.countDocuments()) === 0) {
    await Event.insertMany([
      { title: 'Orientation Day', description: 'Welcome and program overview', date: '2026-02-10', time: '09:00', location: 'Main Hall', items: ['ID Badge', 'Notebook', 'Pen'] },
      { title: 'Lab Safety Training', description: 'Mandatory lab safety', date: '2026-02-15', time: '14:00', location: 'Lab 3', items: ['Lab coat', 'Closed-toe shoes'] }
    ]);
    console.log('Created sample events.');
  }

  if ((await DailySubject.countDocuments()) === 0) {
    await DailySubject.insertMany([
      { dayOfWeek: 'Monday', subjects: [{ name: 'Anatomy & Physiology', type: 'Theory', itemsNeeded: ['Textbook', 'Notebook', 'Laptop'] }, { name: 'Clinical Skills Lab', type: 'Lab', itemsNeeded: ['Uniform', 'Stethoscope', 'Watch'] }] },
      { dayOfWeek: 'Tuesday', subjects: [{ name: 'Nursing Fundamentals', type: 'Theory', itemsNeeded: ['Textbook', 'Notebook'] }, { name: 'Seminar: Patient Care', type: 'Seminar', itemsNeeded: ['Case studies printout'] }] }
    ]);
    console.log('Created sample daily subjects.');
  }

  if ((await Announcement.countDocuments()) === 0) {
    await Announcement.insertMany([
      { title: 'Welcome Back', message: 'Spring semester begins next week. Check your schedule and required items.', date: '2026-02-01', time: '09:00' },
      { title: 'Lab Schedule Update', message: 'Lab 3 will be closed on Feb 14 for maintenance.', date: '2026-02-02', time: '10:00' }
    ]);
    console.log('Created sample announcements.');
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
