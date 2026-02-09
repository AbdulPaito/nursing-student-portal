(function() {
  'use strict';

  let allDocuments = [];
  let filteredDocuments = [];

  // Load documents
  async function loadDocuments() {
    const container = document.getElementById('documentsContainer');
    
    try {
      const response = await fetch('/api/department-documents?published=true');
      const data = await response.json();

      if (data.success) {
        // Filter only published AND active documents
        allDocuments = data.documents.filter(doc => doc.isPublished && doc.isActive !== false);
        filteredDocuments = [...allDocuments];
        
        renderDocuments();
      } else {
        showError('Failed to load documents');
      }
    } catch (error) {
      console.error('Load documents error:', error);
      showError('Error loading documents. Please try again.');
    }
  }

  // Render documents as cards
  function renderDocuments() {
    const container = document.getElementById('documentsContainer');

    if (filteredDocuments.length === 0) {
      container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-20">
          <i class="fa-solid fa-folder-open text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-600 text-lg">No documents found</p>
          <p class="text-gray-500 text-sm">Try adjusting your filters</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredDocuments.map((doc, index) => {
      const date = new Date(doc.dateIssued).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const isPinned = doc.isPinned;
      
      let fileIcon = 'fa-file-lines';
      let iconColor = 'text-blue-500';
      
      if (doc.contentType === 'file') {
        if (doc.fileType === 'pdf') {
          fileIcon = 'fa-file-pdf';
          iconColor = 'text-red-500';
        } else if (doc.fileType === 'doc' || doc.fileType === 'docx') {
          fileIcon = 'fa-file-word';
          iconColor = 'text-blue-600';
        } else if (doc.fileType === 'jpg' || doc.fileType === 'jpeg' || doc.fileType === 'png') {
          fileIcon = 'fa-file-image';
          iconColor = 'text-green-500';
        }
      }

      return `
        <div class="glass rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in cursor-pointer group" 
             style="animation-delay: ${index * 0.05}s"
             onclick="viewDocument('${doc._id}')">
          
          ${isPinned ? `
            <div class="flex items-center gap-2 mb-3">
              <i class="fa-solid fa-thumbtack text-red-500"></i>
              <span class="text-xs font-semibold text-red-600 uppercase tracking-wide">Pinned</span>
            </div>
          ` : ''}

          <!-- File Icon -->
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <i class="fa-solid ${fileIcon} text-3xl ${iconColor}"></i>
          </div>

          <!-- Category Badge -->
          <div class="mb-3">
            <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              ${doc.category}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            ${doc.title}
          </h3>

          <!-- Description -->
          ${doc.description ? `
            <p class="text-sm text-gray-600 mb-4 line-clamp-2">
              ${doc.description}
            </p>
          ` : ''}

          <!-- Meta Info -->
          <div class="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
            <div class="flex items-center gap-1">
              <i class="fa-regular fa-calendar"></i>
              <span>${date}</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1">
                <i class="fa-solid fa-eye"></i>
                <span>${doc.viewCount || 0}</span>
              </div>
              <div class="flex items-center gap-1">
                <i class="fa-solid fa-download"></i>
                <span>${doc.downloadCount || 0}</span>
              </div>
              <div class="flex items-center gap-1">
                <i class="fa-solid fa-comments"></i>
                <span>${doc.comments?.length || 0}</span>
              </div>
            </div>
          </div>

          <!-- View Button -->
          <div class="mt-4">
            <button class="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 group-hover:shadow-xl">
              <i class="fa-solid fa-eye mr-2"></i>View Document
            </button>
          </div>

        </div>
      `;
    }).join('');
  }

  // View document - Open modal with full details
  window.viewDocument = async function(docId) {
    const modal = document.getElementById('documentViewerModal');
    const doc = allDocuments.find(d => d._id === docId);
    
    if (!doc) {
      alert('Document not found');
      return;
    }

    // Track view
    try {
      await fetch(`/api/department-documents/${docId}/view`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to track view:', error);
    }

    const date = new Date(doc.dateIssued).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let contentHtml = '';
    
    if (doc.contentType === 'file') {
      if (doc.fileType === 'pdf') {
        contentHtml = `
          <div class="bg-gray-900 rounded-2xl p-4 mb-6">
            <iframe src="/api/department-documents/${doc._id}/file" class="w-full h-[600px] rounded-xl" frameborder="0"></iframe>
          </div>
          <div class="flex gap-3">
            <a href="/api/department-documents/${doc._id}/file" target="_blank" class="flex-1 px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all text-center">
              <i class="fa-solid fa-external-link mr-2"></i>Open in New Tab
            </a>
            <button onclick="downloadDocument('${doc._id}')" class="flex-1 px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all">
              <i class="fa-solid fa-download mr-2"></i>Download PDF
            </button>
          </div>
        `;
      } else if (doc.fileType === 'jpg' || doc.fileType === 'jpeg' || doc.fileType === 'png') {
        contentHtml = `
          <div class="mb-6">
            <img src="/api/department-documents/${doc._id}/file" alt="${doc.title}" class="w-full rounded-2xl shadow-lg">
          </div>
          <button onclick="downloadDocument('${doc._id}')" class="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all">
            <i class="fa-solid fa-download mr-2"></i>Download Image
          </button>
        `;
      } else {
        contentHtml = `
          <div class="p-8 bg-gray-50 rounded-2xl text-center mb-6">
            <i class="fa-solid fa-file text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-600 mb-4">This file type cannot be previewed</p>
            <button onclick="downloadDocument('${doc._id}')" class="px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all">
              <i class="fa-solid fa-download mr-2"></i>Download File
            </button>
          </div>
        `;
      }
    } else {
      contentHtml = `
        <div class="prose max-w-none mb-6 p-6 bg-white rounded-2xl border-2 border-gray-200">
          ${doc.textContent.replace(/\n/g, '<br>')}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl flex items-start justify-between z-10">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                ${doc.category}
              </span>
              ${doc.isPinned ? '<i class="fa-solid fa-thumbtack text-red-500"></i>' : ''}
            </div>
            <h2 class="text-3xl font-bold text-gray-800 mb-2">${doc.title}</h2>
            <div class="flex flex-wrap gap-4 text-sm text-gray-600">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-calendar"></i>
                <span>${date}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-eye"></i>
                <span>${doc.views || 0} views</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-download"></i>
                <span>${doc.downloads || 0} downloads</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-comment"></i>
                <span>${doc.comments?.length || 0} comments</span>
              </div>
            </div>
          </div>
          <button onclick="closeDocumentModal()" class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors ml-4">
            <i class="fa-solid fa-times text-gray-600"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="p-8">
          ${doc.description ? `
            <div class="mb-6 p-4 bg-blue-50 rounded-2xl border-l-4 border-blue-500">
              <p class="text-gray-700">${doc.description}</p>
            </div>
          ` : ''}

          ${contentHtml}

          <!-- Comments Section -->
          <div class="mt-12">
            <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <i class="fa-solid fa-comments text-blue-500"></i>
              Comments
            </h3>

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
            <div id="commentsList" class="space-y-4">
              <!-- Comments will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    loadComments(docId);
  };

  // Close document modal
  window.closeDocumentModal = function() {
    const modal = document.getElementById('documentViewerModal');
    modal.classList.add('hidden');
  };

  // Download document
  window.downloadDocument = async function(docId) {
    try {
      const response = await fetch(`/api/department-documents/${docId}/download`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        const a = document.createElement('a');
        a.href = `/api/department-documents/${docId}/file`;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  };

  // Load comments for a document
  window.loadComments = async function(docId) {
    const commentsList = document.getElementById('commentsList');
    
    if (!commentsList) return;

    try {
      const response = await fetch(`/api/department-documents/${docId}/comments`);
      const data = await response.json();

      if (data.success) {
        const comments = data.comments || [];

        if (comments.length === 0) {
          commentsList.innerHTML = `
            <p class="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
          `;
        } else {
          commentsList.innerHTML = comments.map(comment => `
            <div class="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <p class="font-semibold text-gray-800">${comment.userName}</p>
                  <p class="text-sm text-gray-500">${new Date(comment.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <p class="text-gray-700">${comment.comment}</p>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Load comments error:', error);
      commentsList.innerHTML = `
        <p class="text-red-500 text-center py-4">Failed to load comments</p>
      `;
    }
  };

  // Submit comment
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
        
        // Show success message
        const commentsList = document.getElementById('commentsList');
        const successMsg = document.createElement('div');
        successMsg.className = 'p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 mb-4';
        successMsg.innerHTML = '<i class="fa-solid fa-check-circle mr-2"></i>Comment posted successfully!';
        commentsList.parentNode.insertBefore(successMsg, commentsList);
        
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        alert('Failed to post comment: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Submit comment error:', error);
      alert('Error posting comment. Please try again.');
    }
  };

  // Search functionality
  document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    filteredDocuments = allDocuments.filter(doc => {
      return doc.title.toLowerCase().includes(searchTerm) ||
             (doc.description && doc.description.toLowerCase().includes(searchTerm)) ||
             doc.category.toLowerCase().includes(searchTerm);
    });

    applyFilters();
  });

  // Category filter
  document.getElementById('categoryFilter').addEventListener('change', function(e) {
    applyFilters();
  });

  // Sort filter
  document.getElementById('sortFilter').addEventListener('change', function(e) {
    applyFilters();
  });

  // Apply all filters
  function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const sortBy = document.getElementById('sortFilter').value;

    // Filter
    filteredDocuments = allDocuments.filter(doc => {
      const matchesSearch = !searchTerm || 
        doc.title.toLowerCase().includes(searchTerm) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm)) ||
        doc.category.toLowerCase().includes(searchTerm);
      
      const matchesCategory = !category || doc.category === category;

      return matchesSearch && matchesCategory;
    });

    // Sort
    if (sortBy === 'newest') {
      filteredDocuments.sort((a, b) => new Date(b.dateIssued) - new Date(a.dateIssued));
    } else if (sortBy === 'oldest') {
      filteredDocuments.sort((a, b) => new Date(a.dateIssued) - new Date(b.dateIssued));
    } else if (sortBy === 'title') {
      filteredDocuments.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Always show pinned first
    filteredDocuments.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    renderDocuments();
  }

  // Show error
  function showError(message) {
    const container = document.getElementById('documentsContainer');
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-20">
        <i class="fa-solid fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <p class="text-gray-600 text-lg">${message}</p>
      </div>
    `;
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    loadDocuments();
  });

})();
