# Nursing Student Portal - Setup & Deployment Guide

## 🔐 Admin Authentication Setup

### Step 1: Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# MongoDB Atlas Connection String
# Get this from MongoDB Atlas dashboard > Database > Connect > Drivers > Node.js
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/nursing_portal?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
# Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_super_secret_random_string_here_64_chars_or_more

# Admin Account Details
ADMIN_EMAIL=admin@nursing.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Admin User

# Server Port (Render will override this)
PORT=3000

# CORS Origins (add your Netlify URL here)
CORS_ORIGINS=http://localhost:3000,http://localhost:5500,https://your-site.netlify.app
```

### Step 2: Create Admin Account

#### Option A: Using the Seed Script (Recommended)

```bash
npm run seed:admin
```

This will create or update the admin user with the credentials from `.env`.

#### Option B: Using the API Endpoint

Start the server first:
```bash
npm start
```

Then create an admin using curl or Postman:

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@nursing.com",
    "password": "admin123"
  }'
```

**Using Postman:**
- URL: `POST http://localhost:3000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "name": "Admin User",
  "email": "admin@nursing.com",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@nursing.com",
    "role": "admin"
  }
}
```

### Step 3: Test Login

**Login Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nursing.com",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@nursing.com",
    "role": "admin"
  }
}
```

## 🚀 Render Deployment

### 1. Prepare Your Code

Ensure you have committed all changes:
```bash
git add .
git commit -m "Fix admin authentication with bcrypt and JWT"
git push origin main
```

### 2. Create New Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub/GitLab repository
4. Configure the service:

**Settings:**
- **Name**: `nursing-portal-api`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### 3. Add Environment Variables on Render

Go to Environment section and add:

```
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/nursing_portal?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_random_string
ADMIN_EMAIL=admin@nursing.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Admin User
CORS_ORIGINS=https://your-netlify-site.netlify.app,https://your-site.netlify.app
```

### 4. Deploy

Click "Create Web Service" and wait for deployment.

### 5. Run Seed Script on Render

After deployment, open Render Shell:
```bash
cd /opt/render/project/src
npm run seed:admin
```

## 🌐 Netlify Frontend Deployment

### 1. Update CORS Origins

Add your Netlify domain to `CORS_ORIGINS` in Render environment variables.

### 2. Update Frontend API URL

In your frontend code, update the API base URL to point to your Render backend:

```javascript
// public/js/admin.js or similar
const API_BASE_URL = 'https://nursing-portal-api.onrender.com';
```

## 📡 API Endpoints Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST   | `/api/auth/register` | Create admin account | No |
| POST   | `/api/auth/login` | Login admin | No |
| GET    | `/api/auth/me` | Get current user | Yes |
| POST   | `/api/auth/change-password` | Change password | Yes |

### Events

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | `/api/events` | List all events | No |
| GET    | `/api/events/upcoming` | List upcoming events | No |
| POST   | `/api/events` | Create event | Yes |
| PUT    | `/api/events/:id` | Update event | Yes |
| DELETE | `/api/events/:id` | Delete event | Yes |

### Daily Subjects

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | `/api/daily-subjects` | List all subjects | No |
| GET    | `/api/daily-subjects/day/:day` | Get subjects by day | No |
| POST   | `/api/daily-subjects` | Add subject | Yes |
| PUT    | `/api/daily-subjects/:id` | Update subject | Yes |
| DELETE | `/api/daily-subjects/:id` | Delete subject | Yes |

### Announcements

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | `/api/announcements` | List announcements | No |
| POST   | `/api/announcements` | Create announcement | Yes |
| PUT    | `/api/announcements/:id` | Update announcement | Yes |
| DELETE | `/api/announcements/:id` | Delete announcement | Yes |

## 🔒 Security Features

1. **Password Hashing**: All passwords are hashed with bcrypt (10 salt rounds)
2. **JWT Tokens**: 7-day expiration, secure signing
3. **CORS Protection**: Configured to allow only specified origins
4. **Input Validation**: Email format, password length checks
5. **Case-Insensitive Email**: Login works regardless of email case
6. **Role-Based Access**: Admin-only endpoints protected

## 🔧 Troubleshooting

### "Invalid email or password" Error

1. Verify admin was created successfully:
   ```bash
   npm run seed:admin
   ```

2. Check if password was hashed:
   ```bash
   # In MongoDB Atlas, check the users collection
   # Password field should NOT be plain text
   ```

3. Test with curl:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@nursing.com","password":"your_password"}'
   ```

### CORS Errors

Add your frontend URL to `CORS_ORIGINS` in environment variables:
```env
CORS_ORIGINS=http://localhost:3000,https://your-site.netlify.app
```

### Database Connection Errors

1. Verify MongoDB URI is correct
2. Check if IP is whitelisted in MongoDB Atlas
3. Ensure password doesn't contain special characters that need URL encoding

### JWT Errors

Ensure `JWT_SECRET` is set and at least 32 characters long.

## 📝 File Structure

```
nursing-website/
├── config/
│   └── db.js                 # MongoDB connection
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── models/
│   ├── User.js               # User model with bcrypt
│   ├── Event.js              # Event model
│   ├── DailySubject.js       # Daily subjects model
│   └── Announcement.js       # Announcement model
├── routes/
│   ├── auth.js               # Authentication routes
│   ├── events.js             # Event routes
│   ├── dailySubjects.js      # Daily subjects routes
│   └── announcements.js      # Announcement routes
├── scripts/
│   └── seedAdmin.js          # Admin creation script
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment template
├── server.js                 # Main server file
├── package.json              # Dependencies
└── SETUP.md                  # This file
```

## 🆘 Need Help?

1. Check server logs: `npm start` shows detailed logs
2. Test endpoints: Use `/api/health` to check DB status
3. Verify environment: Ensure all `.env` variables are set
4. Check MongoDB Atlas: Verify cluster is running and accessible

## 📦 Dependencies

All required packages are in `package.json`:
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT authentication
- `cors`: Cross-origin requests
- `dotenv`: Environment variables
