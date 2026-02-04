# Quick Start - Music Upload with Cloudinary

## 🚀 For Netlify + Render Deployment

### Step 1: Install Dependencies (5 minutes)

```bash
cd "Documents/Nursing Website"
npm install
```

This installs:
- `cloudinary` - Cloud storage SDK
- `multer-storage-cloudinary` - File upload adapter

---

### Step 2: Setup Cloudinary Account (3 minutes)

1. **Sign up**: https://cloudinary.com/users/register/free
2. **Get credentials** from Dashboard:
   - Cloud Name: `dxxxxxxxxx`
   - API Key: `123456789012345`
   - API Secret: `abc...xyz` (click 👁️ to reveal)

---

### Step 3: Configure Render (2 minutes)

In your Render dashboard:

1. Go to your **Backend service**
2. Click **Environment** tab
3. Add these 3 variables:

```
CLOUDINARY_CLOUD_NAME = dxxxxxxxxx
CLOUDINARY_API_KEY = 123456789012345
CLOUDINARY_API_SECRET = your-secret-here
```

4. Click **Save** → Render will redeploy automatically

---

### Step 4: Deploy Code (2 minutes)

```bash
git add .
git commit -m "Add Cloudinary for music uploads"
git push origin main
```

Render auto-deploys when it detects changes.

---

### Step 5: Test Upload (1 minute)

1. Go to your Netlify site: `https://your-site.netlify.app/admin`
2. Login as admin
3. Click **"Background Music"**
4. Click **"Upload Music"**
5. Upload an MP3 file

**Success indicators:**
- ✅ "Music uploaded successfully!" message
- ✅ File appears in list with play button
- ✅ File shows in Cloudinary dashboard
- ✅ Can play music

---

## How It Works

```
User uploads MP3
    ↓
Render backend receives file
    ↓
Multer → Cloudinary (uploads to cloud)
    ↓
Cloudinary returns URL
    ↓
URL saved to MongoDB
    ↓
Music player loads from Cloudinary CDN
```

---

## File Locations

| What | Where |
|------|-------|
| Frontend (HTML/CSS/JS) | Netlify |
| Backend API | Render |
| Database (metadata) | MongoDB Atlas |
| Music Files | **Cloudinary** ☁️ |

---

## Troubleshooting

### "Upload failed"

**Check 1**: Cloudinary credentials in Render
- Go to Render → Environment
- Verify all 3 variables exist
- No typos, no extra spaces

**Check 2**: Render logs
- Go to Render → Logs
- Look for error messages

**Check 3**: File format
- Only MP3, WAV, OGG, M4A, AAC allowed
- Max 10MB file size

### "Invalid credentials"

**Solution**: 
1. Double-check Cloudinary API Secret
2. Click 👁️ icon to reveal full secret
3. Copy entire value to Render
4. Save and redeploy

### Upload works locally but fails on Render

**Solution**:
1. Make sure environment variables are in Render (not just local .env)
2. Redeploy after adding variables
3. Check Render logs for specific error

---

## What Gets Uploaded

When you upload a music file:

**To Cloudinary**:
- File: `music-1234567890.mp3`
- URL: `https://res.cloudinary.com/your-cloud/video/upload/nursing-portal/music/music-1234567890.mp3`

**To MongoDB**:
```json
{
  "title": "Relaxing Music",
  "fileName": "music-1234567890",
  "filePath": "https://res.cloudinary.com/.../music-1234567890.mp3",
  "fileSize": 5242880,
  "location": "both",
  "isActive": true,
  "cloudinaryId": "nursing-portal/music/music-1234567890"
}
```

---

## Free Tier Limits

**Cloudinary Free**:
- 25 GB storage
- 25 GB bandwidth/month
- ~250 music files (avg 100MB each)

**Good for**: Small to medium sites

**Upgrade**: $89/month for 150GB if needed

---

## Verification

### ✅ Backend running:
```
https://your-api.onrender.com/api/health
→ Should return {"success": true}
```

### ✅ Cloudinary working:
```
Go to https://console.cloudinary.com/
→ Media Library → nursing-portal/music/
→ Should see uploaded files
```

### ✅ Frontend working:
```
https://your-site.netlify.app/admin
→ Upload music
→ Plays successfully
```

---

## Need More Help?

Read the full guides:
- `CLOUDINARY_SETUP.md` - Detailed setup
- `DEPLOYMENT_GUIDE.md` - Complete deployment
- `MUSIC_UPLOAD_SETUP.md` - Local setup

---

**Total Setup Time: ~15 minutes** ⏱️

**You're ready to upload music! 🎵**
