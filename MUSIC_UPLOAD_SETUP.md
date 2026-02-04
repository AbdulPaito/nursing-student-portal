# Music Upload Setup Guide

## Issue
Music upload not working - files need to be saved to MongoDB Atlas.

## Solution

### 1. Install Required Package

Run this command in the project directory:

```bash
npm install
```

This will install the newly added `multer` package for file uploads.

### 2. Verify MongoDB Connection

Make sure your `.env` file has the correct MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nursing-portal?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
PORT=3000
```

### 3. Create Upload Directory

The system will automatically create the directory, but you can manually create it:

```bash
mkdir -p public/uploads/music
```

### 4. Start the Server

```bash
npm start
```

## How It Works

### File Storage
- **Physical Files**: Stored in `public/uploads/music/` folder
- **Metadata**: Saved to MongoDB Atlas (Music collection)

### MongoDB Music Schema
```javascript
{
  title: String,           // Music title
  fileName: String,        // Stored filename (music-123456789.mp3)
  filePath: String,        // URL path (/uploads/music/music-123456789.mp3)
  fileSize: Number,        // File size in bytes
  duration: Number,        // Duration in seconds
  location: String,        // 'login', 'portal', or 'both'
  isActive: Boolean,       // Active status
  uploadedBy: ObjectId,    // Admin who uploaded (reference to User)
  uploadedAt: Date,        // Upload timestamp
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-generated
}
```

### Upload Flow
1. Admin selects music file in dashboard
2. File uploaded to `/api/music/upload` endpoint
3. Multer saves physical file to `public/uploads/music/`
4. Metadata saved to MongoDB Atlas
5. File served via `/uploads/music/filename.mp3` URL

## API Endpoints

### Upload Music
```
POST /api/music/upload
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

Body:
- title: string (required)
- location: 'login' | 'portal' | 'both' (required)
- music: file (required)
```

### Get All Music (Admin)
```
GET /api/music
Authorization: Bearer {admin_token}
```

### Get Active Music (Public)
```
GET /api/music/active/:location
Location: 'login' | 'portal'
```

### Toggle Music Status
```
PUT /api/music/:id/toggle
Authorization: Bearer {admin_token}
```

### Update Music
```
PUT /api/music/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

Body:
{
  "title": "New Title",
  "location": "both"
}
```

### Delete Music
```
DELETE /api/music/:id
Authorization: Bearer {admin_token}
```

## Troubleshooting

### Upload Not Working

**Check 1: Is multer installed?**
```bash
npm list multer
```
If not found, run:
```bash
npm install
```

**Check 2: Is MongoDB connected?**
Check server logs for:
```
✅ MongoDB connected
```

**Check 3: Is uploads directory writable?**
```bash
ls -la public/uploads/
```

**Check 4: Check server logs**
Look for error messages when uploading

**Check 5: Check browser console**
Look for network errors or failed requests

### Common Errors

**Error: "Cannot find module 'multer'"**
```bash
npm install
```

**Error: "ENOENT: no such file or directory"**
Directory will be auto-created. If not, create manually:
```bash
mkdir -p public/uploads/music
```

**Error: "Unauthorized" or 401**
Make sure you're logged in as admin and token is valid

**Error: "File too large"**
Current limit is 10MB. To increase, edit `routes/music.js`:
```javascript
limits: { fileSize: 20 * 1024 * 1024 } // 20MB
```

**Error: "Invalid file type"**
Only these formats are allowed: MP3, WAV, OGG, M4A, AAC

## Testing the Upload

### 1. Via Admin Dashboard
1. Log in to admin portal
2. Go to "Background Music"
3. Click "Upload Music"
4. Fill in:
   - Title: "Test Music"
   - Location: "Both Pages"
   - File: Select an MP3 file
5. Click "Upload"
6. Should see success message and file appears in list

### 2. Via API (cURL)
```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'

# Copy the token from response

# Upload music
curl -X POST http://localhost:3000/api/music/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Test Music" \
  -F "location=both" \
  -F "music=@/path/to/your/music.mp3"
```

### 3. Verify in MongoDB Atlas
1. Go to MongoDB Atlas dashboard
2. Browse Collections
3. Find "musics" collection
4. Should see uploaded music metadata

## File Size Limits

- **Default**: 10MB per file
- **Express Body Limit**: 10MB (already configured in server.js)
- **Multer Limit**: 10MB (configured in routes/music.js)

To change limits, edit both:
1. `server.js` - Line 56-57
2. `routes/music.js` - Line 39

## Security Features

✅ **Admin Only**: Only authenticated admins can upload/delete
✅ **File Type Validation**: Only audio files accepted
✅ **File Size Validation**: 10MB limit prevents abuse
✅ **Unique Filenames**: Prevents filename collisions
✅ **Error Handling**: Failed uploads don't leave orphaned files

## Success Indicators

When working correctly, you should see:

1. **Server logs:**
```
POST /api/music/upload
File uploaded: music-1234567890.mp3
Music saved to database
```

2. **Browser console:**
```
Music uploaded successfully!
```

3. **MongoDB Atlas:**
New document in "musics" collection

4. **File system:**
New file in `public/uploads/music/`

5. **Admin dashboard:**
Music appears in grid with play button

---

**Status**: ✅ Ready for Testing
**Next Step**: Run `npm install` then start the server
