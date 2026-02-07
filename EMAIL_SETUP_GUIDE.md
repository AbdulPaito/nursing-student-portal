# 📧 Email Configuration Guide for Forgot Password Feature

## Overview
The Forgot Password feature uses **Gmail** to send 6-digit PIN codes to users for password recovery.

---

## 🔧 Setup Instructions

### Step 1: Enable 2-Step Verification on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** (left sidebar)
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the prompts to enable it

### Step 2: Generate App Password

1. Still in **Security**, scroll to "2-Step Verification"
2. At the bottom, click **App passwords**
3. Select app: **Mail**
4. Select device: **Other (Custom name)**
5. Enter name: `MSU Nursing Portal`
6. Click **Generate**
7. **Copy the 16-character password** (you won't see it again!)

### Step 3: Update Your `.env` File

Add these lines to your `.env` file:

```env
# Email Configuration (for Forgot Password PIN)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM_NAME=MSU Nursing Portal
```

**Example:**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=admin@msu.edu.ph
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM_NAME=MSU Nursing Portal
```

---

## ✅ Testing the Email Service

### Option 1: Test via Server Console

Start your server and check the console:
```bash
npm start
```

You should see:
```
✅ Email service is ready
```

### Option 2: Test Forgot Password Flow

1. Go to: `http://localhost:3000/admin/forgot-password.html`
2. Enter a valid admin email
3. Check if PIN is sent to email
4. Verify the email looks professional

---

## 📧 Email Template Preview

Users will receive this email:

**Subject:** Password Reset PIN - MSU Nursing Portal

```
🔐 Password Reset Request

Hello [User Name],

We received a request to reset your password for your MSU Nursing Portal account.

Your password reset PIN is:

┌─────────┐
│ 123456 │
└─────────┘

⚠️ Important:
• This PIN will expire in 15 minutes
• Do not share this PIN with anyone
• If you didn't request this, please ignore this email

Enter this PIN on the password reset page to create a new password.

---
MSU Nursing Student Portal
This is an automated email, please do not reply.

© 2025 Mindanao State University
```

---

## 🔒 Security Features

✅ **PIN Hashing** - PINs are hashed before storage (bcrypt)
✅ **15-Minute Expiration** - PINs automatically expire
✅ **One-Time Use** - PINs are deleted after successful use
✅ **Rate Limiting** - Prevents spam/abuse (recommended to add)
✅ **Email Enumeration Protection** - Always returns success message

---

## 🚨 Troubleshooting

### Error: "Failed to send email"

**Possible causes:**

1. **Incorrect App Password**
   - Double-check the 16-character password
   - Remove any spaces if copy-pasted
   - Regenerate if needed

2. **2-Step Verification Not Enabled**
   - App Passwords only work with 2-Step Verification
   - Enable it first

3. **Less Secure Apps Setting**
   - This is deprecated by Google
   - Always use App Passwords instead

4. **Gmail Sending Limits**
   - Free Gmail: 500 emails/day
   - Google Workspace: 2,000 emails/day

5. **Network/Firewall Issues**
   - Check if port 587 (SMTP) is blocked
   - Try from different network

### Error: "Email service configuration error"

Check your `.env` file:
- Ensure no typos in EMAIL_USER
- Verify EMAIL_PASSWORD is correct
- Restart the server after changes

---

## 🎯 Alternative Email Services (Optional)

If you want to use other email services:

### SendGrid
```env
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Mailgun
```env
EMAIL_SERVICE=mailgun
EMAIL_USER=your-mailgun-smtp-user
EMAIL_PASSWORD=your-mailgun-smtp-password
```

### Custom SMTP
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=admin@yourdomain.com
EMAIL_PASSWORD=your-password
EMAIL_SECURE=false
```

**Note:** For custom SMTP, you'll need to modify `utils/emailService.js`

---

## 📊 Monitoring

### Check Email Logs

The server logs all email operations:

```
✅ Password reset email sent: 1a2b3c4d5e6f
❌ Email send error: Authentication failed
```

### Database Check

Check if PINs are being stored:

```javascript
// In MongoDB
db.users.findOne({ email: "admin@example.com" }, { 
  resetPasswordPIN: 1, 
  resetPasswordPINExpires: 1 
})
```

---

## 🔐 Production Recommendations

1. **Use Domain Email** - Instead of Gmail, use your organization's email
2. **Enable Rate Limiting** - Prevent abuse
3. **Add CAPTCHA** - On forgot password form
4. **Monitor Failed Attempts** - Log and alert on suspicious activity
5. **Use Email Queue** - For better reliability (e.g., Bull, Bee-Queue)

---

## 📞 Support

If you encounter issues:

1. Check server console for detailed error messages
2. Verify `.env` configuration
3. Test email credentials manually
4. Check Gmail account for suspicious activity alerts

---

**Last Updated:** February 2025
**Feature Version:** 1.0.0
