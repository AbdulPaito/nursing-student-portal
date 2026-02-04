# Cloudinary Setup for Music Upload (Netlify + Render Deployment)

## Why Cloudinary?

Since you're deploying to:
- **Netlify** (Frontend - Static files only, no file storage)
- **Render** (Backend API - Ephemeral file system)

You need a **cloud storage solution** for music files. Cloudinary is perfect because:
- ✅ Free tier available (25 GB storage, 25 GB bandwidth)
- ✅ Built for media files (images, videos, audio)
- ✅ Fast CDN delivery
- ✅ Easy to integrate
- ✅ Automatic file optimization

---

## Step 1: Create Cloudinary Account

1. Go to: https://cloudinary.com/users/register/free
2. Sign up for a **free account**
3. Verify your email
4. Log in to your dashboard

---

## Step 2: Get Your Credentials

After logging in:

1. Go to **Dashboard** (https://console.cloudinary.com/)
2. You'll see:
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz123` (Click "👁️" to reveal)

3. **Copy these credentials** - you'll need them next

---

## Step 3: Configure Render (Backend)

### Option A: Via Render Dashboard (Recommended)

1. Go to your Render dashboard: https://dashboard.render.com/
2. Select your **Backend API service**
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Add these **3 variables**:

```
CLOUDINARY_CLOUD_NAME = your-cloud-name
CLOUDINARY_API_KEY = 123456789012345
CLOUDINARY_API_SECRET = abcdefghijklmnopqrstuvwxyz123
```

6. Click **Save Changes**
7. Render will automatically redeploy

### Option B: Via Environment Variables File

If using a `.env` file locally, add:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123
```

**Note**: Never commit `.env` to Git!

---

## Step 4: Install Dependencies

On your local machine:

```bash
cd "Documents/Nursing Website"
npm install
```

This installs:
- `cloudinary` - Cloudinary SDK
- `multer-storage-cloudinary` - Multer storage adapter for Cloudinary

---

## Step 5: Deploy to Render

### If using Git deployment:

```bash
git add .
git commit -m "Add Cloudinary integration for music uploads"
git push origin main
```

Render will automatically:
1. Detect changes
2. Install new dependencies
3. Redeploy with Cloudinary support

### If using manual deployment:

1. Push code to your repository
2. Go to Render dashboard
3. Click **Manual Deploy** > **Deploy latest commit**

---

## Step 6: Test Upload

1. Go to your deployed site: `https://your-site.netlify.app`
2. Log in to admin dashboard
3. Click **"Background Music"**
4. Click **"Upload Music"**
5. Fill form and upload an MP3 file
6. Check Cloudinary dashboard to see uploaded file

---

## Verification Checklist

✅ **Cloudinary account created**
✅ **Credentials copied**
✅ **Environment variables added to Render**
✅ **Dependencies installed** (`npm install`)
✅ **Code deployed to Render**
✅ **Test upload successful**

---

## How It Works

### Upload Flow:
```
1. Admin uploads MP3 in dashboard
   ↓
2. File sent to Render backend API
   ↓
3. Multer receives file
   ↓
4. Cloudinary storage adapter uploads to cloud
   ↓
5. Cloudinary returns URL
   ↓
6. URL saved to MongoDB Atlas
   ↓
7. Music player loads from Cloudinary URL
```

### Storage Locations:
- **Music Files**: Cloudinary (cloud storage)
- **Metadata**: MongoDB Atlas (database)
- **Frontend**: Netlify (static site)
- **Backend**: Render (API server)

---

## Cloudinary Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Max file size**: 100 MB

**Good for**: ~250 music files (avg 100MB each)

---

## File Organization in Cloudinary

Files are stored in folder:
```
nursing-portal/
  └── music/
      ├── music-1234567890.mp3
      ├── music-1234567891.mp3
      └── music-1234567892.mp3
```

Each file gets:
- **Public ID**: `nursing-portal/music/music-1234567890`
- **URL**: `https://res.cloudinary.com/your-cloud-name/video/upload/nursing-portal/music/music-1234567890.mp3`

---

## Troubleshooting

### Upload fails with "Invalid credentials"

**Solution**: Check environment variables in Render:
- Variable names exactly: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- No extra spaces in values
- API Secret fully copied

### Upload works locally but fails on Render

**Solution**:
1. Check Render logs for errors
2. Verify environment variables are set
3. Redeploy after adding variables

### Files not appearing in Cloudinary

**Solution**:
1. Check Cloudinary dashboard > Media Library
2. Look for folder: `nursing-portal/music`
3. Filter by resource type: `video` (audio files are stored as video type)

### "Resource type invalid" error

**Solution**: Audio files use `resource_type: 'video'` in Cloudinary (this is correct)

---

## Monitoring Usage

### Check your Cloudinary usage:
1. Go to: https://console.cloudinary.com/
2. Click **Dashboard**
3. See: Storage used, Bandwidth used, Transformations

### When approaching limits:
- Delete old/unused music files
- Upgrade to paid plan ($89/month for 150GB)
- Use lower bitrate audio files

---

## Security Best Practices

✅ **Never commit credentials** - Use environment variables
✅ **Use signed uploads** - Already configured
✅ **Restrict upload access** - Admin only (already implemented)
✅ **Validate file types** - Already configured
✅ **Set file size limits** - 10MB max (already configured)

---

## API Endpoints After Setup

All endpoints work the same, but now files are stored in Cloudinary:

```
POST /api/music/upload        - Upload to Cloudinary
GET  /api/music               - List music (URLs from Cloudinary)
GET  /api/music/active/:loc   - Get active music (URL from Cloudinary)
DELETE /api/music/:id         - Delete from Cloudinary + DB
```

---

## Support

**Cloudinary Documentation**: https://cloudinary.com/documentation
**Cloudinary Support**: https://support.cloudinary.com/

---

## Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| Frontend | Netlify | Serves HTML/CSS/JS |
| Backend API | Render | Handles requests |
| Database | MongoDB Atlas | Stores metadata |
| Music Files | **Cloudinary** | Stores MP3 files |

**Your setup is now production-ready for Netlify + Render deployment! 🚀**
