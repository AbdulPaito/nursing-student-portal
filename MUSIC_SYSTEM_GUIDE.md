# Background Music System - Documentation

## Overview
The Nursing Student Portal now includes a complete background music management system that allows administrators to upload and manage music files that play automatically on the login page and student portal.

## Features

### Admin Features
- ✅ Upload music files (MP3, WAV, OGG, M4A, AAC)
- ✅ Set music location (Login Page, Student Portal, or Both)
- ✅ Activate/deactivate music files
- ✅ Edit music details
- ✅ Delete music files
- ✅ View all uploaded music with controls

### Student/User Features
- ✅ Automatic music playback on page load
- ✅ Floating music player (bottom-right corner)
- ✅ Play/Pause controls
- ✅ Volume slider
- ✅ Mute/Unmute button
- ✅ Progress bar with seek functionality
- ✅ Minimize/Maximize player
- ✅ Music loops automatically

## Installation & Setup

### 1. Install Required Dependencies

```bash
npm install multer
```

The `multer` package is required for handling file uploads.

### 2. Files Created

#### Backend Files:
- `models/Music.js` - MongoDB model for music data
- `routes/music.js` - API endpoints for music management

#### Frontend Files:
- `public/admin/music.html` - Admin music management page
- `public/js/music-player.js` - Floating music player component

#### Modified Files:
- `server.js` - Added music routes and static file serving
- `public/index.html` - Integrated music player
- `public/admin/login.html` - Integrated music player
- `public/admin/index.html` - Added music management link

### 3. Create Upload Directory

The system automatically creates the upload directory, but you can create it manually:

```bash
mkdir -p public/uploads/music
```

## Usage Guide

### For Administrators

#### Accessing Music Management
1. Log in to the admin portal
2. Click **"Background Music"** in the sidebar navigation
3. You'll see the music management page

#### Uploading Music
1. Click **"Upload Music"** button
2. Fill in the form:
   - **Music Title**: Name of the music
   - **Location**: Where the music should play
     - Login Page Only
     - Student Portal Only
     - Both Pages
   - **Music File**: Choose audio file (max 10MB)
3. Click **"Upload"**

#### Managing Music
- **Play**: Click the audio player controls to preview
- **Activate/Deactivate**: Toggle music active status
- **Edit**: Change title or location
- **Delete**: Remove music file permanently

### For Students/Users

The music player appears automatically when active music is available:

#### Player Controls
- **Play/Pause**: Large circular button in center
- **Volume**: Slider at the bottom
- **Mute**: Toggle mute on/off
- **Progress Bar**: Click to seek to specific time
- **Minimize**: Click X to minimize to small icon
- **Maximize**: Click the floating icon to show full player

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

## Database Schema

### Music Model
```javascript
{
  title: String,           // Music title
  fileName: String,        // Stored filename
  filePath: String,        // URL path to file
  fileSize: Number,        // File size in bytes
  duration: Number,        // Duration in seconds
  location: String,        // 'login', 'portal', or 'both'
  isActive: Boolean,       // Active status
  uploadedBy: ObjectId,    // Admin who uploaded
  uploadedAt: Date,        // Upload timestamp
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-generated
}
```

## File Size & Format Limits

### Supported Formats
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.m4a)
- AAC (.aac)

### File Size Limit
- Maximum: 10MB per file

## Security Features

- ✅ Admin-only access for upload/edit/delete
- ✅ File type validation
- ✅ File size validation
- ✅ Authentication required for all admin endpoints
- ✅ Public access only for active music retrieval

## Troubleshooting

### Music Not Playing
1. Check if music is marked as "Active"
2. Verify music location matches the page
3. Check browser console for errors
4. Ensure file path is correct in database

### Upload Fails
1. Check file size (must be under 10MB)
2. Verify file format is supported
3. Ensure admin is logged in
4. Check server upload directory permissions

### Player Not Appearing
1. Verify active music exists for that location
2. Check browser console for JavaScript errors
3. Ensure `music-player.js` is loaded correctly
4. Check `window.musicPlayerLocation` is set

## Advanced Configuration

### Changing Upload Limits

Edit `routes/music.js`:

```javascript
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Change to 20MB
  fileFilter: fileFilter
});
```

### Adding More Audio Formats

Edit `routes/music.js`:

```javascript
const allowedTypes = /mp3|wav|ogg|m4a|aac|flac|wma/;
```

### Customizing Player Appearance

Edit `public/js/music-player.js` - modify the `playerHTML` section with your custom styling.

## Technical Notes

### Auto-Play Restrictions
Modern browsers may block auto-play with sound. The player attempts to play after a 1-second delay, but users may need to interact with the page first.

### Looping
Music is set to loop by default:
```javascript
this.audio.loop = true;
```

### Volume Persistence
Volume settings are not persisted. Consider adding localStorage support for user preferences.

## Future Enhancements

Potential improvements:
- [ ] Playlist support
- [ ] Fade in/out effects
- [ ] Volume persistence
- [ ] Multiple language support
- [ ] Music scheduling (time-based)
- [ ] Analytics (play counts)

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Verify server logs
4. Contact system administrator

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Author**: Nursing Portal Development Team
