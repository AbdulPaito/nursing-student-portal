# 👑 Super Admin Role - Complete Guide

## 🎯 What's Been Implemented

### New Role System:
- ✅ **Admin** - Regular admin (default)
- ✅ **Super Admin** - Full control (can reset passwords)

---

## 🔐 Security Rules

### What Regular Admin CAN do:
✅ Change their own password (via "Change Password")
✅ View all users
✅ Create new regular admins
✅ Edit user details (name, email)
✅ Manage events, courses, announcements, etc.

### What Regular Admin CANNOT do:
❌ Reset other admin passwords
❌ Create Super Admin accounts
❌ Change user roles
❌ Delete Super Admin accounts

### What Super Admin CAN do:
✅ Everything regular admin can do
✅ **Reset any admin's password**
✅ Create Super Admin accounts
✅ Change user roles (admin ↔ superadmin)
✅ Delete any account

---

## 🚀 Quick Setup - Make Yourself Super Admin

### Option 1: Via Database (MongoDB)

1. **Open MongoDB Compass** or Atlas
2. **Connect to your database**
3. **Find your admin account:**
   ```javascript
   // In Users collection, find your email
   { email: "your-email@example.com" }
   ```
4. **Edit the document:**
   ```javascript
   {
     ...
     "role": "superadmin"  // Change from "admin" to "superadmin"
     ...
   }
   ```
5. **Save**
6. **Logout and login again**

### Option 2: Via Node.js Script (Easiest)

Create file: `Documents/Nursing Website/make-superadmin.js`

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function makeSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Change this to your email
    const email = 'admin@nursing.com';
    
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }
    
    user.role = 'superadmin';
    await user.save();
    
    console.log('✅ SUCCESS!', user.name, 'is now a Super Admin!');
    console.log('Role:', user.role);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeSuperAdmin();
```

**Run it:**
```bash
cd "Documents/Nursing Website"
node make-superadmin.js
```

---

## 🧪 How to Test

### Step 1: Make Yourself Super Admin
Use Option 1 or 2 above

### Step 2: Login
```
Logout → Login again
```

### Step 3: Go to User Management
```
Admin Dashboard → User Management
```

### Step 4: Try Reset Password
```
1. Find another admin in the list
2. Click "Reset Password"
3. Expected: ✅ Works! (because you're Super Admin)
```

### Step 5: Create Another Admin
```
1. Click "Add New User"
2. Fill in details
3. Role dropdown: Choose "Admin" or "Super Admin"
4. Save
```

### Step 6: Test Regular Admin (Optional)
```
1. Create a new regular admin account
2. Logout
3. Login as that regular admin
4. Go to User Management
5. Try to reset password → ❌ Error: "Access denied. Only Super Admin can reset passwords."
```

---

## 📋 What Changed in the Code

### Backend Changes:

#### 1. User Model (`models/User.js`)
```javascript
role: { 
  type: String, 
  enum: ['admin', 'superadmin'], 
  default: 'admin' 
}
```

#### 2. Reset Password Route (`routes/users.js`)
```javascript
// Only Super Admin can reset passwords
if (req.user.role !== 'superadmin') {
  return res.status(403).json({
    error: 'Access denied. Only Super Admin can reset passwords.'
  });
}
```

#### 3. Create User Route
```javascript
// Only Super Admin can create Super Admin accounts
if (role === 'superadmin' && req.user.role !== 'superadmin') {
  return res.status(403).json({
    error: 'Access denied. Only Super Admin can create Super Admin accounts.'
  });
}
```

#### 4. Update User Route
```javascript
// Only Super Admin can change roles
if (role && req.user.role !== 'superadmin') {
  return res.status(403).json({
    error: 'Access denied. Only Super Admin can change user roles.'
  });
}
```

#### 5. Delete User Route
```javascript
// Only Super Admin can delete other Super Admins
if (userToDelete.role === 'superadmin' && req.user.role !== 'superadmin') {
  return res.status(403).json({
    error: 'Access denied. Only Super Admin can delete Super Admin accounts.'
  });
}
```

---

## 🎨 Frontend Will Show:

### For Regular Admin:
- No "Reset Password" button (or disabled)
- Cannot select "Super Admin" when creating users
- Cannot change roles

### For Super Admin:
- ✅ "Reset Password" button visible
- ✅ Can select "Super Admin" role
- ✅ Can change user roles
- ✅ Full control

---

## ⚠️ Important Security Notes

### Best Practices:

1. **Keep Super Admin Accounts Minimal**
   - Only 1-2 Super Admins needed
   - Most users should be regular admins

2. **Super Admin Password**
   - Use a VERY strong password
   - Change it regularly
   - Never share it

3. **When Resetting Passwords**
   - Super Admin must notify the user
   - Send password securely (email, SMS, in-person)
   - User will be forced to change on login

4. **Audit Trail** (Future Enhancement)
   - Log all password resets
   - Who reset whose password
   - When it happened

---

## 🔄 Migration Path

### For Existing Admins:

**All existing admin accounts will remain as "admin" role.**

To make someone Super Admin:
1. Use MongoDB to change their role
2. Or use the Node.js script above
3. They logout/login
4. Now they're Super Admin!

**No data loss, no breaking changes!**

---

## 📊 User Management Table

| Name | Email | Role | Actions |
|------|-------|------|---------|
| John Doe | john@example.com | **Super Admin** 👑 | Edit \| Delete |
| Jane Smith | jane@example.com | Admin | Edit \| **Reset Password** \| Delete |

**Note:** Only Super Admins see "Reset Password" button for others!

---

## 🆘 Troubleshooting

### "Access denied. Only Super Admin can reset passwords"
**Solution:** Your account is not Super Admin. Ask a Super Admin to upgrade you, or use MongoDB to change your role.

### Reset Password button not showing
**Solution:** 
1. Check if you're Super Admin
2. Refresh browser (Ctrl + F5)
3. Clear localStorage and login again

### Cannot create Super Admin
**Solution:** Only Super Admins can create other Super Admins.

### Forgot Super Admin password
**Solution:** 
1. Use MongoDB to directly change the password hash
2. Or create a password reset script
3. Or use the seed script to create a new Super Admin

---

## 🎯 Summary

### Security Model:

```
Super Admin
  ├─ Can reset any password
  ├─ Can create Super Admins
  ├─ Can change roles
  └─ Full access

Regular Admin
  ├─ Can manage content
  ├─ Can create regular admins
  ├─ CANNOT reset passwords
  └─ Use "Change Password" for self
```

---

## 📞 Next Steps

1. ✅ Run the script to make yourself Super Admin
2. ✅ Login and test User Management
3. ✅ Try resetting a password
4. ✅ Create another admin/super admin
5. ✅ Document who are your Super Admins

---

**Last Updated:** February 2025  
**Version:** 2.0.0 (Role-Based Access Control)
