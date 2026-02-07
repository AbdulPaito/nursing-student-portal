require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function makeSuperAdmin() {
  try {
    console.log('\n🔐 Super Admin Setup Tool\n');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Email to promote to Super Admin
    const email = 'admin@nursing.com';
    
    console.log(`Looking for user: ${email}`);
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      console.log('\n💡 Tip: Change the email in make-superadmin.js to your actual admin email\n');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`\nFound user: ${user.name}`);
    console.log(`Current role: ${user.role}`);
    
    if (user.role === 'superadmin') {
      console.log('\n✅ This user is already a Super Admin!');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Update to superadmin
    user.role = 'superadmin';
    await user.save();
    
    console.log('\n🎉 SUCCESS! User upgraded to Super Admin!');
    console.log('\n📋 User Details:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('\n👑 This user now has full Super Admin access!');
    console.log('\n⚡ Next steps:');
    console.log('   1. Logout from admin dashboard');
    console.log('   2. Login again');
    console.log('   3. Go to User Management');
    console.log('   4. Try resetting a password!\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

makeSuperAdmin();
