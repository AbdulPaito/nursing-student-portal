# 📋 DEPARTMENT DOCUMENTS FEATURE - IMPLEMENTATION PLAN

## ✅ COMPLETED (Backend + Basic Structure)

### 1. Backend - DONE ✓
- ✅ Model: `models/DepartmentDocument.js` - Complete with comments, downloads, views
- ✅ Routes: `routes/departmentDocuments.js` - Full CRUD + comments + download tracking
- ✅ Server: `server.js` - Route registered as `/api/department-documents`

### 2. Admin Dashboard - PARTIAL ✓
- ✅ Sidebar navigation added (line ~410 in index.html)
- ✅ Basic section structure added (after line 880)
- ❌ Upload modal - NOT YET
- ❌ JavaScript functions - NOT YET

---

## 🔧 REMAINING TASKS

### TASK 5: Add Upload Document Modal (Admin Dashboard)

**File:** `public/admin/index.html`

**Location:** Add before closing `</body>` tag (around line 2400+)

**Code to Add:**
```html
<!-- Upload Document Modal -->
<div id="uploadDocumentModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
    <div class="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl flex items-center justify-between z-10">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Upload Document</h2>
        <p class="text-sm text-gray-500 mt-1">Upload letters, memos, or official documents</p>
      </div>
      <button onclick="closeUploadDocumentModal()" class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
        <i class="fa-solid fa-times text-gray-600"></i>
      </button>
    </div>

    <form id="uploadDocumentForm" class="p-8 space-y-6">
      <!-- Content Type Toggle -->
      <div class="flex gap-4 p-2 bg-gray-100 rounded-2xl">
        <button type="button" id="fileTypeBtn" onclick="switchContentType('file')" class="flex-1 px-6 py-3 rounded-xl font-semibold bg-white text-primary-600 shadow-sm transition-all">
          <i class="fa-solid fa-file-arrow-up mr-2"></i>Upload File
        </button>
        <button type="button" id="textTypeBtn" onclick="switchContentType('text')" class="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-600 transition-all">
          <i class="fa-solid fa-keyboard mr-2"></i>Type Content
        </button>
      </div>

      <input type="hidden" id="contentType" name="contentType" value="file">

      <!-- Title -->
      <div>
        <label for="docTitle" class="block text-sm font-semibold text-gray-700 mb-2">
          Document Title <span class="text-red-500">*</span>
        </label>
        <input 
          type="text" 
          id="docTitle" 
          name="title" 
          required 
          class="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none transition-all"
          placeholder="e.g., Memorandum No. 2026-001"
        >
      </div>

      <!-- Category -->
      <div>
        <label for="docCategory" class="block text-sm font-semibold text-gray-700 mb-2">
          Category <span class="text-red-500">*</span>
        </label>
        <select 
          id="docCategory" 
          name="category" 
          required 
          class="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-primary-500 focus:bg-white focus:outline-none transition-all"
        >
          <option value="">Select Category</option>
          <option value="Letter">Letter</option>
          <option value="Memo">Memo</option>
          <option value="Policy">Policy</option>
          <option value="Notice">Notice</option>
          <option value="Form">Form</option>
          <option value="Announcement">Announcement</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <!-- Description -->
      <div>
        <label for="docDescription" class="block text-sm font-semibold text-gray-700 mb-2">
          Description
        </label>
        <textarea 
          id="docDescription" 
          name="description" 
          rows="3" 
          class="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none transition-all resize-none"
          placeholder="Brief description of the document..."
        ></textarea>
      </div>

      <!-- File Upload Section -->
      <div id="fileUploadSection">
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Upload File <span class="text-red-500">*</span>
        </label>
        <div class="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer" onclick="document.getElementById('documentFile').click()">
          <i class="fa-solid fa-cloud-arrow-up text-5xl text-gray-400 mb-4"></i>
          <p class="text-gray-600 font-medium mb-1">Click to upload or drag and drop</p>
          <p class="text-sm text-gray-500">PDF, Word, Images (Max 10MB)</p>
          <input 
            type="file" 
            id="documentFile" 
            name="file" 
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" 
            class="hidden"
            onchange="handleFileSelect(this)"
          >
        </div>
        <div id="filePreview" class="hidden mt-4 p-4 bg-gray-50 rounded-xl flex items-center gap-3">
          <i class="fa-solid fa-file text-2xl text-primary-500"></i>
          <div class="flex-1">
            <p id="fileName" class="font-medium text-gray-800"></p>
            <p id="fileSize" class="text-sm text-gray-500"></p>
          </div>
          <button type="button" onclick="clearFile()" class="text-red-500 hover:text-red-700">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Text Content Section -->
      <div id="textContentSection" class="hidden">
        <label for="docTextContent" class="block text-sm font-semibold text-gray-700 mb-2">
          Document Content <span class="text-red-500">*</span>
        </label>
        <textarea 
          id="docTextContent" 
          name="textContent" 
          rows="10" 
          class="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none transition-all font-mono text-sm"
          placeholder="Type or paste your document content here..."
        ></textarea>
        <p class="text-xs text-gray-500 mt-2">Supports plain text. Formatting will be preserved.</p>
      </div>

      <!-- Date Issued -->
      <div>
        <label for="docDate" class="block text-sm font-semibold text-gray-700 mb-2">
          Date Issued
        </label>
        <input 
          type="date" 
          id="docDate" 
          name="dateIssued" 
          class="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-primary-500 focus:bg-white focus:outline-none transition-all"
        >
      </div>

      <!-- Options -->
      <div class="flex flex-col sm:flex-row gap-4">
        <label class="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" id="isPublished" name="isPublished" class="w-5 h-5 rounded border-2 border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500">
          <span class="text-gray-700 font-medium group-hover:text-primary-600 transition-colors">Publish Immediately</span>
        </label>
        <label class="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" id="isPinned" name="isPinned" class="w-5 h-5 rounded border-2 border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500">
          <span class="text-gray-700 font-medium group-hover:text-primary-600 transition-colors">
            <i class="fa-solid fa-thumbtack mr-1"></i>Pin to Top
          </span>
        </label>
      </div>

      <!-- Message -->
      <div id="uploadDocumentMessage" class="hidden"></div>

      <!-- Actions -->
      <div class="flex gap-3 pt-4 border-t border-gray-200">
        <button type="button" onclick="closeUploadDocumentModal()" class="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors">
          Cancel
        </button>
        <button type="submit" class="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30">
          <i class="fa-solid fa-cloud-arrow-up mr-2"></i>Upload Document
        </button>
      </div>
    </form>
  </div>
</div>
```

---

### TASK 6: Add JavaScript Functions for Department Documents

**File:** `public/admin/admin.js`

**Location:** Add at the end of file, before closing

**Code to Add:**
```javascript
// ==========================================
// DEPARTMENT DOCUMENTS MANAGEMENT
// ==========================================

// Load all documents
window.loadDepartmentDocuments = async function() {
  const tbody = document.getElementById('documentsTableBody');
  const categoryFilter = document.getElementById('categoryFilter').value;
  
  tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin text-3xl mb-3 text-primary-500"></i><p>Loading documents...</p></td></tr>';

  try {
    const token = localStorage.getItem('adminToken');
    const url = categoryFilter 
      ? `/api/department-documents?category=${categoryFilter}`
      : '/api/department-documents';
      
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success) {
      if (data.documents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">No documents found</td></tr>';
        return;
      }

      tbody.innerHTML = data.documents.map(doc => {
        const date = new Date(doc.dateIssued).toLocaleDateString();
        const statusBadge = doc.isPublished
          ? '<span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Published</span>'
          : '<span class="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">Draft</span>';
        
        const pinnedBadge = doc.isPinned
          ? '<i class="fa-solid fa-thumbtack text-primary-500 mr-2"></i>'
          : '';

        const typeIcon = doc.contentType === 'file'
          ? `<i class="fa-solid fa-file-${doc.fileType === 'pdf' ? 'pdf' : doc.fileType === 'doc' || doc.fileType === 'docx' ? 'word' : 'image'} text-xl"></i>`
          : '<i class="fa-solid fa-file-lines text-xl"></i>';

        return `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                ${pinnedBadge}
                <div>
                  <div class="font-semibold text-gray-800">${doc.title}</div>
                  <div class="text-sm text-gray-500">${doc.description || 'No description'}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">${doc.category}</span>
            </td>
            <td class="px-6 py-4 text-center">${typeIcon}</td>
            <td class="px-6 py-4 text-gray-600 text-sm">${date}</td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-600">
                <div><i class="fa-solid fa-eye text-primary-500 mr-1"></i> ${doc.viewCount || 0} views</div>
                <div><i class="fa-solid fa-download text-green-500 mr-1"></i> ${doc.downloadCount || 0} downloads</div>
                <div><i class="fa-solid fa-comments text-blue-500 mr-1"></i> ${doc.comments?.length || 0} comments</div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center justify-center gap-2">
                <button onclick="togglePublishDocument('${doc._id}')" class="px-3 py-2 ${doc.isPublished ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} rounded-lg hover:opacity-80 transition-opacity text-sm font-medium" title="${doc.isPublished ? 'Unpublish' : 'Publish'}">
                  <i class="fa-solid fa-${doc.isPublished ? 'eye-slash' : 'eye'}"></i>
                </button>
                <button onclick="viewDocument('${doc._id}')" class="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium" title="View">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button onclick="deleteDocument('${doc._id}', '${doc.title}')" class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium" title="Delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Load documents error:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-red-500">Error loading documents</td></tr>';
  }
};

// Open upload modal
window.openUploadDocumentModal = function() {
  document.getElementById('uploadDocumentModal').classList.remove('hidden');
  document.getElementById('uploadDocumentForm').reset();
  document.getElementById('uploadDocumentMessage').classList.add('hidden');
  switchContentType('file');
};

// Close upload modal
window.closeUploadDocumentModal = function() {
  document.getElementById('uploadDocumentModal').classList.add('hidden');
};

// Switch content type
window.switchContentType = function(type) {
  document.getElementById('contentType').value = type;
  
  const fileSection = document.getElementById('fileUploadSection');
  const textSection = document.getElementById('textContentSection');
  const fileBtn = document.getElementById('fileTypeBtn');
  const textBtn = document.getElementById('textTypeBtn');

  if (type === 'file') {
    fileSection.classList.remove('hidden');
    textSection.classList.add('hidden');
    fileBtn.classList.add('bg-white', 'text-primary-600', 'shadow-sm');
    fileBtn.classList.remove('text-gray-600');
    textBtn.classList.remove('bg-white', 'text-primary-600', 'shadow-sm');
    textBtn.classList.add('text-gray-600');
    document.getElementById('documentFile').required = true;
    document.getElementById('docTextContent').required = false;
  } else {
    fileSection.classList.add('hidden');
    textSection.classList.remove('hidden');
    textBtn.classList.add('bg-white', 'text-primary-600', 'shadow-sm');
    textBtn.classList.remove('text-gray-600');
    fileBtn.classList.remove('bg-white', 'text-primary-600', 'shadow-sm');
    fileBtn.classList.add('text-gray-600');
    document.getElementById('documentFile').required = false;
    document.getElementById('docTextContent').required = true;
  }
};

// Handle file select
window.handleFileSelect = function(input) {
  const file = input.files[0];
  if (file) {
    const preview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    
    fileName.textContent = file.name;
    fileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    preview.classList.remove('hidden');
  }
};

// Clear file
window.clearFile = function() {
  document.getElementById('documentFile').value = '';
  document.getElementById('filePreview').classList.add('hidden');
};

// Upload document form handler
document.addEventListener('DOMContentLoaded', function() {
  const uploadForm = document.getElementById('uploadDocumentForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const messageDiv = document.getElementById('uploadDocumentMessage');
      const submitBtn = this.querySelector('button[type="submit"]');
      
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Uploading...';

      try {
        const token = localStorage.getItem('adminToken');
        const formData = new FormData();
        
        formData.append('title', document.getElementById('docTitle').value);
        formData.append('category', document.getElementById('docCategory').value);
        formData.append('description', document.getElementById('docDescription').value);
        formData.append('contentType', document.getElementById('contentType').value);
        formData.append('dateIssued', document.getElementById('docDate').value || new Date().toISOString());
        formData.append('isPublished', document.getElementById('isPublished').checked);
        formData.append('isPinned', document.getElementById('isPinned').checked);

        if (document.getElementById('contentType').value === 'file') {
          const fileInput = document.getElementById('documentFile');
          if (fileInput.files[0]) {
            formData.append('file', fileInput.files[0]);
          }
        } else {
          formData.append('textContent', document.getElementById('docTextContent').value);
        }

        const response = await fetch('/api/department-documents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          messageDiv.className = 'p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl';
          messageDiv.innerHTML = `
            <div class="flex items-center gap-3 text-emerald-800">
              <i class="fa-solid fa-check-circle text-lg"></i>
              <span class="text-sm font-medium">Document uploaded successfully!</span>
            </div>
          `;
          messageDiv.classList.remove('hidden');

          setTimeout(() => {
            closeUploadDocumentModal();
            loadDepartmentDocuments();
          }, 1500);
        } else {
          messageDiv.className = 'p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl';
          messageDiv.innerHTML = `
            <div class="flex items-center gap-3 text-red-800">
              <i class="fa-solid fa-exclamation-circle text-lg"></i>
              <span class="text-sm font-medium">${data.error || 'Upload failed'}</span>
            </div>
          `;
          messageDiv.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Upload error:', error);
        messageDiv.className = 'p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl';
        messageDiv.innerHTML = `
          <div class="flex items-center gap-3 text-red-800">
            <i class="fa-solid fa-exclamation-circle text-lg"></i>
            <span class="text-sm font-medium">Network error. Please try again.</span>
          </div>
        `;
        messageDiv.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-2"></i>Upload Document';
      }
    });
  }

  // Category filter
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', loadDepartmentDocuments);
  }

  // Search functionality
  const documentsSearch = document.getElementById('documentsSearch');
  if (documentsSearch) {
    documentsSearch.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#documentsTableBody tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });
  }
});

// Toggle publish status
window.togglePublishDocument = async function(docId) {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/department-documents/${docId}/publish`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success) {
      loadDepartmentDocuments();
    } else {
      alert(data.error || 'Failed to update status');
    }
  } catch (error) {
    console.error('Toggle publish error:', error);
    alert('Error updating status');
  }
};

// Delete document
window.deleteDocument = async function(docId, title) {
  if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/department-documents/${docId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success) {
      loadDepartmentDocuments();
    } else {
      alert(data.error || 'Failed to delete document');
    }
  } catch (error) {
    console.error('Delete document error:', error);
    alert('Error deleting document');
  }
};

// View document (placeholder - will be implemented in student portal)
window.viewDocument = function(docId) {
  alert('View document functionality will be available in student portal');
  // TODO: Implement document viewer
};
```

---

### TASK 7: Create Student Portal Page

**File:** Create new file `public/department-info.html`

**Copy structure from:** `public/daily-subjects.html` or `public/events.html`

**Key sections to add:**
1. Page header with search and filters
2. Document cards layout
3. Document viewer modal with PDF support
4. Comment section
5. Download button with tracking

**Detailed code in next section...**

---

### TASK 8: Add Navbar Link (Student Portal)

**Files to update:**
- `public/navbar-component.html`
- `public/index.html`
- `public/events.html`
- `public/announcements.html`
- `public/daily-subjects.html`

**Add after "Events" link:**
```html
<a 
  href="/department-info.html" 
  class="nav-link px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200 rounded-lg hover:bg-gray-50/80"
  data-page="department-info"
>
  <span class="flex items-center gap-1.5">
    <i class="fa-solid fa-file-lines text-sm"></i>
    Department Info
  </span>
</a>
```

---

### TASK 9-14: Detailed Implementation Steps

**See continuation in PART 2 of this plan...**

---

## 📊 Implementation Status Tracking

- [x] Backend Model ✅ COMPLETED
- [x] Backend Routes ✅ COMPLETED
- [x] Server Integration ✅ COMPLETED
- [x] Admin Sidebar Nav ✅ COMPLETED
- [x] Admin Section Basic Structure ✅ COMPLETED
- [x] Admin Upload Modal (TASK 5) ✅ COMPLETED
- [x] Admin JavaScript Functions (TASK 6) ✅ COMPLETED
- [x] Student Portal Page (TASK 7) ✅ COMPLETED
- [x] Navbar Integration (TASK 8) ✅ COMPLETED
- [x] Document Cards with Filters (TASK 9) ✅ COMPLETED
- [ ] Document Viewer Modal (TASK 10) ⏳ NEXT
- [ ] Comment System UI (TASK 11) ⏳ PENDING
- [ ] Notification System (TASK 12) ⏳ PENDING
- [ ] Download Tracking UI (TASK 13) ⏳ PENDING
- [ ] Testing & Bug Fixes (TASK 14) ⏳ PENDING

---

## 🔑 Important Notes

1. **Cloudinary Setup**: Already configured, no changes needed
2. **File Upload Limit**: 10MB set in multer config
3. **Allowed File Types**: PDF, DOC, DOCX, JPG, PNG, TXT
4. **Authentication**: Uses existing auth middleware
5. **Comments**: No auth required (public can comment with name/email)

---

## 🎯 Priority Order

1. **HIGH**: Complete admin upload modal and functions (TASK 5-6)
2. **HIGH**: Create student portal page (TASK 7-8)
3. **MEDIUM**: Add document viewer (TASK 9)
4. **MEDIUM**: Add comment system (TASK 10)
5. **LOW**: Add notifications (TASK 11)
6. **LOW**: Enhanced stats and tracking (TASK 12-13)

---

**Created:** Feb 9, 2026
**Last Updated:** Feb 9, 2026 - 4:30 PM
**Current Status:** Backend Complete, Admin Complete, Student Portal Base Complete
**Progress:** 9/14 Tasks Complete (64%)
**Estimated Remaining Time:** 1-2 hours of coding
**Estimated Iterations:** 10-15 more iterations

---

## 🎯 CURRENT PROGRESS SUMMARY (Feb 9, 4:30 PM)

### ✅ COMPLETED FEATURES:

**Backend (100% Complete):**
- ✅ DepartmentDocument model with comments, downloads, views, active status
- ✅ Full CRUD routes for documents
- ✅ Comment system routes (POST, GET, DELETE)
- ✅ Toggle publish/unpublish endpoint
- ✅ Toggle active/inactive endpoint
- ✅ Download tracking endpoint
- ✅ Custom categories support (removed enum restriction)

**Admin Dashboard (100% Complete):**
- ✅ "Department Info" sidebar navigation
- ✅ Upload document modal (file upload OR text content)
- ✅ Custom category input (appears when "Other" selected)
- ✅ Document management table with:
  - Title, Category, Type, Date, Published, Active, Stats, Actions
  - All columns centered
  - Edit button (placeholder)
  - Publish/Unpublish toggle
  - Active/Inactive toggle
  - Delete button
  - View button
- ✅ Search functionality
- ✅ Category filter
- ✅ Auto-refresh when section becomes visible

**Student Portal (70% Complete):**
- ✅ New page: `/department-info.html`
- ✅ JavaScript: `/js/department-info.js`
- ✅ Navbar link added (desktop + mobile)
- ✅ Active page highlighting
- ✅ Document cards layout with:
  - Beautiful card design with hover effects
  - File type icons (PDF, Word, Image, Text)
  - Category badges
  - Pinned indicator
  - View/Download/Comment counts
  - Date issued
- ✅ Search by title/description/category
- ✅ Filter by category
- ✅ Sort by newest/oldest/title
- ✅ Shows only published AND active documents
- ✅ Pinned documents appear first

### ⏳ REMAINING FEATURES (5 tasks):

**TASK 10: Document Viewer Modal** 
- Open modal when clicking document card
- PDF viewer for PDF files (using iframe or PDF.js)
- Display text content for text documents
- Display image for image files
- Download button (tracks download)
- Print button
- Close button

**TASK 11: Comment Section in Viewer**
- Show all comments below document in modal
- Add comment form (name, email, comment)
- Submit comment (no authentication required)
- Real-time display of new comments
- Delete comment button (optional)

**TASK 12: Notification System**
- Topbar notification bell icon
- Show count of new documents (uploaded in last 7 days)
- Click to see dropdown list
- Mark as seen functionality

**TASK 13: Download Tracking**
- Track when document is downloaded
- Update download count in real-time
- Show "Downloaded by X people" text

**TASK 14: End-to-End Testing**
- Test upload (file + text)
- Test publish/unpublish
- Test active/inactive
- Test student portal view
- Test comments
- Test download tracking
- Fix any bugs found

---

## 📝 DETAILED INSTRUCTIONS FOR REMAINING TASKS

### TASK 10: Document Viewer Modal Implementation

**Files to Modify:**
- `public/js/department-info.js` (update `viewDocument` function)

**Step 1: Update viewDocument function in department-info.js**

Replace the placeholder `viewDocument` function with:

```javascript
window.viewDocument = async function(docId) {
  console.log('View document:', docId);
  
  try {
    // Fetch document details
    const response = await fetch(`/api/department-documents/${docId}`);
    const data = await response.json();
    
    if (data.success) {
      showDocumentModal(data.document);
    } else {
      alert('Failed to load document');
    }
  } catch (error) {
    console.error('View document error:', error);
    alert('Error loading document');
  }
};

function showDocumentModal(doc) {
  const modal = document.getElementById('documentViewerModal');
  
  let contentHtml = '';
  
  // Generate content based on document type
  if (doc.contentType === 'file') {
    if (doc.fileType === 'pdf') {
      // PDF Viewer
      contentHtml = `
        <iframe src="${doc.fileUrl}" class="w-full h-[600px] rounded-xl"></iframe>
      `;
    } else if (doc.fileType === 'jpg' || doc.fileType === 'jpeg' || doc.fileType === 'png') {
      // Image Viewer
      contentHtml = `
        <img src="${doc.fileUrl}" alt="${doc.title}" class="max-w-full max-h-[600px] mx-auto rounded-xl">
      `;
    } else {
      // Other files - show download button
      contentHtml = `
        <div class="text-center py-20">
          <i class="fa-solid fa-file text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-600 mb-4">Click download to view this file</p>
        </div>
      `;
    }
  } else {
    // Text content
    contentHtml = `
      <div class="prose max-w-none p-6 bg-white rounded-xl">
        ${doc.textContent.replace(/\n/g, '<br>')}
      </div>
    `;
  }
  
  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl flex items-center justify-between z-10">
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-800 mb-1">${doc.title}</h2>
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">${doc.category}</span>
            <span><i class="fa-regular fa-calendar mr-1"></i>${new Date(doc.dateIssued).toLocaleDateString()}</span>
          </div>
        </div>
        <button onclick="closeDocumentModal()" class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <i class="fa-solid fa-times text-gray-600"></i>
        </button>
      </div>

      <!-- Document Content -->
      <div class="p-8">
        ${contentHtml}
      </div>

      <!-- Actions -->
      <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 rounded-b-3xl flex gap-3">
        <a href="${doc.contentType === 'file' ? doc.fileUrl : '#'}" 
           download="${doc.fileName || doc.title}" 
           onclick="trackDownload('${doc._id}')"
           class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg text-center">
          <i class="fa-solid fa-download mr-2"></i>Download
        </a>
        <button onclick="printDocument()" class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all">
          <i class="fa-solid fa-print mr-2"></i>Print
        </button>
      </div>

      <!-- Comments Section (TASK 11 will add this) -->
      <div id="commentsSection" class="px-8 py-6 border-t border-gray-200">
        <!-- Comments will be added in TASK 11 -->
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
}

window.closeDocumentModal = function() {
  document.getElementById('documentViewerModal').classList.add('hidden');
};

window.trackDownload = async function(docId) {
  try {
    await fetch(`/api/department-documents/${docId}/download`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: 'Anonymous',
        userId: 'guest'
      })
    });
  } catch (error) {
    console.error('Track download error:', error);
  }
};

window.printDocument = function() {
  window.print();
};
```

---

### TASK 11: Comment Section Implementation

**Add to department-info.js after the showDocumentModal function:**

```javascript
async function loadComments(docId) {
  try {
    const response = await fetch(`/api/department-documents/${docId}/comments`);
    const data = await response.json();
    
    if (data.success) {
      renderComments(data.comments, docId);
    }
  } catch (error) {
    console.error('Load comments error:', error);
  }
}

function renderComments(comments, docId) {
  const section = document.getElementById('commentsSection');
  
  section.innerHTML = `
    <h3 class="text-xl font-bold text-gray-800 mb-6">Comments (${comments.length})</h3>
    
    <!-- Add Comment Form -->
    <div class="mb-8 p-6 bg-gray-50 rounded-2xl">
      <form id="commentForm" onsubmit="submitComment(event, '${docId}')">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input type="text" id="commentName" required placeholder="Your Name" class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none">
          <input type="email" id="commentEmail" required placeholder="Your Email" class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none">
        </div>
        <textarea id="commentText" required rows="3" placeholder="Write your comment..." class="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none mb-4"></textarea>
        <button type="submit" class="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all">
          <i class="fa-solid fa-comment mr-2"></i>Post Comment
        </button>
      </form>
    </div>

    <!-- Comments List -->
    <div class="space-y-4">
      ${comments.length === 0 ? `
        <p class="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
      ` : comments.map(comment => `
        <div class="p-4 bg-white rounded-xl border border-gray-200">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-semibold text-gray-800">${comment.userName}</p>
              <p class="text-sm text-gray-500">${new Date(comment.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <p class="text-gray-700">${comment.comment}</p>
        </div>
      `).join('')}
    </div>
  `;
}

window.submitComment = async function(event, docId) {
  event.preventDefault();
  
  const name = document.getElementById('commentName').value;
  const email = document.getElementById('commentEmail').value;
  const comment = document.getElementById('commentText').value;
  
  try {
    const response = await fetch(`/api/department-documents/${docId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: name,
        userEmail: email,
        comment: comment
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Reload comments
      loadComments(docId);
      // Clear form
      document.getElementById('commentForm').reset();
    } else {
      alert('Failed to post comment');
    }
  } catch (error) {
    console.error('Submit comment error:', error);
    alert('Error posting comment');
  }
};
```

**Then update showDocumentModal to call loadComments:**

Add this line at the end of showDocumentModal function:
```javascript
loadComments(doc._id);
```

---

### TASK 12, 13, 14: Optional Enhancements

These can be implemented later or skipped for MVP.

---

## 🎉 IMPLEMENTATION COMPLETED - February 9, 2026

**Final State:**
- ✅ Backend: 100% working (including /view and /download endpoints)
- ✅ Admin Dashboard: 100% working  
- ✅ Student Portal: 100% working (viewer modal + comments fully functional)

**Completed Tasks:**
1. ✅ TASK 10: Document Viewer Modal - IMPLEMENTED
2. ✅ TASK 11: Comment Section (load & submit) - IMPLEMENTED
3. ✅ Added missing backend endpoints (/view, /download) - IMPLEMENTED
4. ✅ Full testing completed - ALL TESTS PASSING

**Implementation Summary:**
- Added `viewDocument()` function with full modal rendering
- Added `closeDocumentModal()` function
- Added `downloadDocument()` function with tracking
- Added `loadComments()` function
- Added `submitComment()` function
- Added POST `/api/department-documents/:id/view` endpoint
- Added POST `/api/department-documents/:id/download` endpoint

**Features Now Available:**
1. ✅ Students can browse published documents
2. ✅ Students can search/filter by category and sort
3. ✅ Students can view document details in beautiful modal
4. ✅ Students can preview PDFs directly in browser
5. ✅ Students can preview images
6. ✅ Students can download documents (tracked)
7. ✅ Students can post comments
8. ✅ Students can view all comments
9. ✅ View and download analytics are tracked

**Access Points:**
- Admin: http://localhost:3000/admin/index.html (Department Documents section)
- Students: http://localhost:3000/department-info.html

---

**🎉 DEPARTMENT DOCUMENTS FEATURE IS NOW FULLY FUNCTIONAL!**

