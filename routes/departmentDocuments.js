const express = require('express');
const router = express.Router();
const DepartmentDocument = require('../models/DepartmentDocument');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const https = require('https');
const http = require('http');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt'];
    const fileExt = file.originalname.split('.').pop().toLowerCase();

    if (allowedExtensions.includes(fileExt)) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Images, and Text files are allowed.'));
    }
  }
});

/**
 * @route   POST /api/department-documents
 * @desc    Create new department document
 * @access  Private (Admin only)
 */
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can upload documents'
      });
    }

    const { title, category, description, contentType, textContent, dateIssued, isPublished, isPinned } = req.body;

    // Validate required fields
    if (!title || !category || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, category, and content type'
      });
    }

    let documentData = {
      title,
      category,
      description,
      contentType,
      dateIssued: dateIssued || Date.now(),
      isPublished: isPublished === 'true' || isPublished === true,
      isPinned: isPinned === 'true' || isPinned === true,
      uploadedBy: req.user._id
    };

    // Handle file upload
    if (contentType === 'file') {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please upload a file'
        });
      }

      // Determine resource type based on file extension
      const fileExt = req.file.originalname.split('.').pop().toLowerCase();
      let resourceType = 'raw';
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const videoExts = ['mp4', 'mov', 'avi', 'webm'];

      if (imageExts.includes(fileExt)) {
        resourceType = 'image';
      } else if (videoExts.includes(fileExt)) {
        resourceType = 'video';
      }

      // Upload to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'department-documents',
          resource_type: resourceType
        },
        async (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({
              success: false,
              error: 'Error uploading file'
            });
          }

          documentData.fileUrl = result.secure_url;
          documentData.fileName = req.file.originalname;
          documentData.fileType = fileExt;
          documentData.fileSize = req.file.size;
          documentData.cloudinaryPublicId = result.public_id;

          const document = new DepartmentDocument(documentData);
          await document.save();

          res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            document
          });
        }
      );

      uploadStream.end(req.file.buffer);
    } else {
      // Handle text content
      if (!textContent) {
        return res.status(400).json({
          success: false,
          error: 'Please provide text content'
        });
      }

      documentData.textContent = textContent;

      const document = new DepartmentDocument(documentData);
      await document.save();

      res.status(201).json({
        success: true,
        message: 'Document created successfully',
        document
      });
    }
  } catch (err) {
    console.error('Create document error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/department-documents
 * @desc    Get all department documents (filtered by published status for non-admins)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, published } = req.query;

    let query = {};

    // Non-admins can only see published documents
    // If Authorization header is present, show all docs (admin view)
    // If no Authorization header or published=true, only show published docs
    if (!req.headers.authorization) {
      query.isPublished = true;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const documents = await DepartmentDocument.find(query)
      .populate('uploadedBy', 'name email role')
      .sort({ isPinned: -1, dateIssued: -1 })
      .lean();

    res.json({
      success: true,
      documents
    });
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/department-documents/:id
 * @desc    Get single department document
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const document = await DepartmentDocument.findById(req.params.id)
      .populate('uploadedBy', 'name email role')
      .populate('comments.userId', 'name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Increment view count
    document.viewCount += 1;
    await document.save();

    res.json({
      success: true,
      document
    });
  } catch (err) {
    console.error('Get document error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error: ' + err.message,
      errorDetails: {
        name: err.name,
        message: err.message,
        code: err.code,
        type: err.constructor.name
      }
    });
  }
});

/**
 * @route   PUT /api/department-documents/:id
 * @desc    Update department document
 * @access  Private (Admin only)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can update documents'
      });
    }

    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const { title, category, description, textContent, dateIssued, isPublished, isPinned } = req.body;

    if (title) document.title = title;
    if (category) document.category = category;
    if (description !== undefined) document.description = description;
    if (textContent !== undefined && document.contentType === 'text') document.textContent = textContent;
    if (dateIssued) document.dateIssued = dateIssued;
    if (isPublished !== undefined) document.isPublished = isPublished;
    if (isPinned !== undefined) document.isPinned = isPinned;

    await document.save();

    res.json({
      success: true,
      message: 'Document updated successfully',
      document
    });
  } catch (err) {
    console.error('❌ Update document error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
      success: false,
      error: 'Server error: ' + err.message
    });
  }
});

/**
 * @route   DELETE /api/department-documents/:id
 * @desc    Delete department document
 * @access  Private (Admin only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can delete documents'
      });
    }

    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Delete from Cloudinary if it's a file
    if (document.contentType === 'file' && document.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(document.cloudinaryPublicId);
    }

    await DepartmentDocument.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   PATCH /api/department-documents/:id/publish
 * @desc    Toggle publish status
 * @access  Private (Admin only)
 */
router.patch('/:id/publish', auth, async (req, res) => {
  try {
    console.log('🔄 Toggle publish for document:', req.params.id);
    
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can publish/unpublish documents'
      });
    }

    // Validate ID format
    if (!req.params.id || req.params.id.length !== 24) {
      console.log('❌ Invalid document ID format:', req.params.id);
      return res.status(400).json({
        success: false,
        error: 'Invalid document ID format'
      });
    }

    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      console.log('❌ Document not found:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    document.isPublished = !document.isPublished;
    await document.save();
    
    console.log('✅ Document publish status updated:', document.isPublished);

    res.json({
      success: true,
      message: `Document ${document.isPublished ? 'published' : 'hidden'} successfully`,
      document
    });
  } catch (err) {
    console.error('❌ Toggle publish error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
      success: false,
      error: 'Server error: ' + err.message
    });
  }
});

/**
 * @route   PATCH /api/department-documents/:id/active
 * @desc    Toggle active status
 * @access  Private (Admin only)
 */
router.patch('/:id/active', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can activate/deactivate documents'
      });
    }

    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    document.isActive = !document.isActive;
    await document.save();

    res.json({
      success: true,
      message: `Document ${document.isActive ? 'activated' : 'deactivated'} successfully`,
      document
    });
  } catch (err) {
    console.error('Toggle active error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   PATCH /api/department-documents/:id/download
 * @desc    Track document download
 * @access  Public
 */
router.patch('/:id/download', async (req, res) => {
  try {
    const { userName, userId } = req.body;

    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    document.downloadCount += 1;
    document.downloadedBy.push({
      userId: userId || 'anonymous',
      userName: userName || 'Anonymous',
      downloadedAt: new Date()
    });

    await document.save();

    res.json({
      success: true,
      message: 'Download tracked'
    });
  } catch (err) {
    console.error('Track download error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/department-documents/:id/comments
 * @desc    Add comment to document
 * @access  Public
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { userName, userEmail, userRole, comment } = req.body;

    if (!userName || !userEmail || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and comment'
      });
    }

    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    document.comments.push({
      userName,
      userEmail,
      userRole: userRole || 'student',
      comment,
      createdAt: new Date()
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: document.comments[document.comments.length - 1]
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/department-documents/:id/comments
 * @desc    Get all comments for a document
 * @access  Public
 */
router.get('/:id/comments', async (req, res) => {
  try {
    const document = await DepartmentDocument.findById(req.params.id).select('comments');

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      comments: document.comments.sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   DELETE /api/department-documents/:id/comments/:commentId
 * @desc    Delete comment (Admin only or comment owner)
 * @access  Public/Private
 */
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const commentIndex = document.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    document.comments.splice(commentIndex, 1);
    await document.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/department-documents/:id/comments/:commentId/like
 * @desc    Like or unlike a comment
 * @access  Public
 */
router.post('/:id/comments/:commentId/like', async (req, res) => {
  try {
    const { userEmail } = req.body;

    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const comment = document.comments.find(
      c => c._id.toString() === req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user already liked this comment
    const alreadyLikedIndex = comment.likedBy.findIndex(
      l => l.email === userEmail
    );

    if (alreadyLikedIndex !== -1) {
      // Unlike
      comment.likedBy.splice(alreadyLikedIndex, 1);
      comment.likes = Math.max(0, (comment.likes || 1) - 1);
    } else {
      // Like
      comment.likedBy.push({ email: userEmail });
      comment.likes = (comment.likes || 0) + 1;
    }

    await document.save();

    res.json({
      success: true,
      likes: comment.likes,
      liked: alreadyLikedIndex === -1
    });
  } catch (err) {
    console.error('Like comment error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/department-documents/:id/comments/:commentId/reply
 * @desc    Reply to a comment
 * @access  Public
 */
router.post('/:id/comments/:commentId/reply', async (req, res) => {
  try {
    const { userName, userEmail, userRole, reply } = req.body;

    if (!userName || !userEmail || !reply) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and reply'
      });
    }

    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const comment = document.comments.find(
      c => c._id.toString() === req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    comment.replies.push({
      userName,
      userEmail,
      userRole: userRole || 'student',
      comment: reply
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply: comment.replies[comment.replies.length - 1]
    });
  } catch (err) {
    console.error('Reply comment error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/department-documents/:id/view
 * @desc    Track document view
 * @access  Public
 */
router.post('/:id/view', async (req, res) => {
  try {
    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    document.viewCount = (document.viewCount || 0) + 1;
    await document.save();

    res.json({
      success: true,
      viewCount: document.viewCount
    });
  } catch (err) {
    console.error('Track view error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/department-documents/:id/file/view
 * @desc    View file inline (for opening in new tab)
 * @access  Public
 */
router.get('/:id/file/view', async (req, res) => {
  try {
    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    if (document.contentType !== 'file') {
      return res.status(400).json({
        success: false,
        error: 'This document has no file to view'
      });
    }

    // Determine content type based on file extension
    const contentTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };

    const contentType = contentTypes[document.fileType] || 'application/octet-stream';

    // Set inline disposition for viewing in browser
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.setHeader('Content-Type', contentType);

    // Redirect to Cloudinary URL for inline viewing
    res.redirect(document.fileUrl);
  } catch (err) {
    console.error('File view error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/department-documents/:id/file
 * @desc    Download file with proper headers
 * @access  Public
 */
router.get('/:id/file', async (req, res) => {
  try {
    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    if (document.contentType !== 'file') {
      return res.status(400).json({
        success: false,
        error: 'This document has no file to download'
      });
    }

    // Track download
    document.downloadCount = (document.downloadCount || 0) + 1;
    await document.save();

    // Determine content type based on file extension
    const contentTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };

    const contentType = contentTypes[document.fileType] || 'application/octet-stream';

    // Set proper headers before fetching
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Type', contentType);

    // For Cloudinary raw files, use the original URL with fl_attachment
    let fileUrl = document.fileUrl;

    if (fileUrl.includes('cloudinary.com')) {
      // Add flags=attachment to force download
      fileUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
    }

    // Fetch the file and pipe it to response
    const protocol = fileUrl.startsWith('https') ? https : http;

    protocol.get(fileUrl, (fileRes) => {
      // Pipe the file response directly to the client
      fileRes.pipe(res);
    }).on('error', (err) => {
      console.error('Error fetching file from Cloudinary:', err);
      res.status(500).json({
        success: false,
        error: 'Error downloading file'
      });
    });
  } catch (err) {
    console.error('File download error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/department-documents/:id/download
 * @desc    Track document download and return file URL
 * @access  Public
 */
router.post('/:id/download', async (req, res) => {
  try {
    const document = await DepartmentDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    if (document.contentType !== 'file') {
      return res.status(400).json({
        success: false,
        error: 'This document has no file to download'
      });
    }

    document.downloadCount = (document.downloadCount || 0) + 1;
    await document.save();

    res.json({
      success: true,
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      downloadCount: document.downloadCount
    });
  } catch (err) {
    console.error('Track download error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
