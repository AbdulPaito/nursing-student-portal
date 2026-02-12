(function () {
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
      let gradientClass = 'from-blue-500 to-blue-600';

      if (doc.contentType === 'file') {
        if (doc.fileType === 'pdf') {
          fileIcon = 'fa-file-pdf';
          iconColor = 'text-red-500';
          gradientClass = 'from-red-500 to-red-600';
        } else if (doc.fileType === 'doc' || doc.fileType === 'docx') {
          fileIcon = 'fa-file-word';
          iconColor = 'text-blue-600';
          gradientClass = 'from-blue-600 to-blue-700';
        } else if (doc.fileType === 'jpg' || doc.fileType === 'jpeg' || doc.fileType === 'png') {
          fileIcon = 'fa-file-image';
          iconColor = 'text-green-500';
          gradientClass = 'from-green-500 to-green-600';
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

          <!-- File Icon/Thumbnail with gradient -->
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-all shadow-lg">
            <i class="fa-solid ${fileIcon} text-3xl text-white"></i>
          </div>

          <!-- Category Badge -->
          <div class="mb-3">
            <span class="px-3 py-1 rounded-full bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 text-xs font-semibold">
              ${doc.category}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
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
                <i class="fa-solid fa-eye text-blue-500"></i>
                <span>${doc.viewCount || 0}</span>
              </div>
              <div class="flex items-center gap-1">
                <i class="fa-solid fa-download text-green-500"></i>
                <span>${doc.downloadCount || 0}</span>
              </div>
              <div class="flex items-center gap-1">
                <i class="fa-solid fa-comments text-purple-500"></i>
                <span>${doc.comments?.length || 0}</span>
              </div>
            </div>
          </div>

          <!-- Download Button -->
          <div class="mt-4">
            <button onclick="downloadDocument('${doc._id}')" class="w-full px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 group-hover:shadow-xl flex items-center justify-center gap-2">
              <i class="fa-solid fa-download"></i>Download PDF
            </button>
          </div>

        </div>
      `;
    }).join('');
  }

  // View document - Open modal with full details (Modern Healthcare Design)
  window.viewDocument = async function (docId) {
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

    // Determine icon based on file type
    let fileIcon = 'fa-file-lines';
    let iconColor = 'text-blue-500';
    let iconBgColor = 'from-blue-500 to-blue-600';
    let badgeColor = 'bg-blue-100 text-blue-700';

    if (doc.contentType === 'file') {
      if (doc.fileType === 'pdf') {
        fileIcon = 'fa-file-pdf';
        iconColor = 'text-red-500';
        iconBgColor = 'from-red-500 to-red-600';
        badgeColor = 'bg-red-100 text-red-700';
      } else if (doc.fileType === 'doc' || doc.fileType === 'docx') {
        fileIcon = 'fa-file-word';
        iconColor = 'text-blue-600';
        iconBgColor = 'from-blue-600 to-blue-700';
        badgeColor = 'bg-blue-100 text-blue-700';
      } else if (doc.fileType === 'jpg' || doc.fileType === 'jpeg' || doc.fileType === 'png') {
        fileIcon = 'fa-file-image';
        iconColor = 'text-green-500';
        iconBgColor = 'from-green-500 to-green-600';
        badgeColor = 'bg-green-100 text-green-700';
      }
    }

    // Category badge colors - healthcare themed
    const categoryColors = {
      'Certificate': 'bg-emerald-100 text-emerald-700',
      'Memo': 'bg-amber-100 text-amber-700',
      'Clinical Form': 'bg-cyan-100 text-cyan-700',
      'Policy': 'bg-purple-100 text-purple-700',
      'Notice': 'bg-pink-100 text-pink-700',
      'Form': 'bg-indigo-100 text-indigo-700',
      'Letter': 'bg-orange-100 text-orange-700'
    };
    const categoryBadge = categoryColors[doc.category] || badgeColor;

    // Get file size if applicable
    let fileSizeDisplay = '';
    if (doc.fileSize) {
      const sizeInKB = Math.round(doc.fileSize / 1024);
      fileSizeDisplay = sizeInKB > 1024
        ? `${(sizeInKB / 1024).toFixed(1)} MB`
        : `${sizeInKB} KB`;
    }

    // Build content HTML based on type
    let contentHtml = '';
    if (doc.contentType === 'file') {
      if (doc.fileType === 'pdf') {
        contentHtml = `
          <!-- PDF Action Card -->
          <div class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 mb-6">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${iconBgColor} flex items-center justify-center shadow-lg shadow-red-500/20">
                <i class="fa-solid ${fileIcon} text-2xl text-white"></i>
              </div>
              <div>
                <h4 class="text-lg font-bold text-slate-800">${doc.title}</h4>
                <p class="text-sm text-slate-500">PDF Document</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div class="flex items-center gap-2 text-slate-600">
                <i class="fa-solid fa-file-arrow-down text-slate-400"></i>
                <span>${fileSizeDisplay || 'N/A'}</span>
              </div>
              <div class="flex items-center gap-2 text-slate-600">
                <i class="fa-solid fa-calendar text-slate-400"></i>
                <span>${date}</span>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3">
              <button onclick="downloadDocument('${doc._id}')" class="flex-1 px-6 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2">
                <i class="fa-solid fa-download"></i>Download PDF
              </button>
            </div>
            
            <div class="mt-4 p-3 bg-blue-50 rounded-xl flex items-start gap-3">
              <i class="fa-solid fa-shield-halved text-blue-500 mt-0.5"></i>
              <div class="text-sm text-blue-700">
                <p class="font-medium">Verified Document</p>
                <p class="text-blue-600">This document has been verified by the nursing administration.</p>
              </div>
            </div>
          </div>
        `;
      } else if (doc.fileType === 'jpg' || doc.fileType === 'jpeg' || doc.fileType === 'png') {
        contentHtml = `
          <div class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 mb-6">
            <div class="relative mb-4">
              <div class="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-2xl blur-lg opacity-20"></div>
              <img src="/api/department-documents/${doc._id}/file" alt="${doc.title}" class="relative w-full rounded-xl shadow-lg border border-slate-200">
            </div>
            <button onclick="downloadDocument('${doc._id}')" class="w-full px-6 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2">
              <i class="fa-solid fa-download"></i>Download Image
            </button>
          </div>
        `;
      } else {
        contentHtml = `
          <div class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 mb-6">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${iconBgColor} flex items-center justify-center shadow-lg">
                <i class="fa-solid ${fileIcon} text-2xl text-white"></i>
              </div>
              <div>
                <h4 class="text-lg font-bold text-slate-800">${doc.title}</h4>
                <p class="text-sm text-slate-500 capitalize">${doc.fileType} Document</p>
              </div>
            </div>
            <button onclick="downloadDocument('${doc._id}')" class="w-full px-6 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2">
              <i class="fa-solid fa-download"></i>Download File
            </button>
          </div>
        `;
      }
    } else {
      contentHtml = `
        <div class="prose max-w-none mb-6 p-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-sm">
          ${doc.textContent.replace(/\n/g, '<br>')}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <!-- Header with gradient background - Healthcare themed -->
        <div class="sticky top-0 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 px-8 py-6 rounded-t-3xl flex items-start justify-between z-10">
          <div class="flex items-start gap-4">
            <!-- Document Icon/Thumbnail -->
            <div class="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0">
              <i class="fa-solid ${fileIcon} text-2xl ${iconColor}"></i>
            </div>
            <div class="text-white">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="px-3 py-1 rounded-full ${categoryBadge} text-xs font-semibold backdrop-blur-sm">
                  ${doc.category}
                </span>
                ${doc.isPinned ? '<span class="px-2 py-1 bg-yellow-400/20 text-yellow-200 text-xs rounded-full"><i class="fa-solid fa-thumbtack mr-1"></i>Pinned</span>' : ''}
              </div>
              <h2 class="text-xl font-bold mb-2 text-white leading-tight">${doc.title}</h2>
              
              <!-- Meta information row -->
              <div class="flex flex-wrap gap-4 text-sm text-white/90">
                <div class="flex items-center gap-1.5">
                  <i class="fa-regular fa-calendar-check"></i>
                  <span>${date}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <i class="fa-solid fa-eye"></i>
                  <span>${doc.viewCount || 0} views</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <i class="fa-solid fa-file-arrow-down"></i>
                  <span>${doc.downloadCount || 0} downloads</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <i class="fa-regular fa-comments"></i>
                  <span>${doc.comments?.length || 0} comments</span>
                </div>
              </div>
            </div>
          </div>
          <button onclick="closeDocumentModal()" class="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all ml-4 group flex-shrink-0">
            <i class="fa-solid fa-times text-white text-lg group-hover:scale-110 transition-transform"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          ${doc.description ? `
            <div class="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-l-4 border-teal-500">
              <div class="flex items-start gap-3">
                <i class="fa-solid fa-circle-info text-teal-500 mt-0.5"></i>
                <div>
                  <p class="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">Description</p>
                  <p class="text-slate-700 leading-relaxed">${doc.description}</p>
                </div>
              </div>
            </div>
          ` : ''}

          ${contentHtml}

          <!-- Comments Section - Modern Healthcare UI -->
          <div class="mt-8">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <i class="fa-regular fa-comments text-white"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-slate-800">Comments & Feedback</h3>
                <p class="text-sm text-slate-500">${doc.comments?.length || 0} discussion${doc.comments?.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <!-- Add Comment Form -->
            <div class="mb-8 p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
              <form id="commentForm" onsubmit="submitComment(event, '${docId}')">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div class="relative">
                    <i class="fa-regular fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" id="commentName" required placeholder="Your Full Name" class="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all placeholder:text-slate-400">
                  </div>
                  <div class="relative">
                    <i class="fa-regular fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="email" id="commentEmail" required placeholder="your.email@example.com" class="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all placeholder:text-slate-400">
                  </div>
                </div>
                <div class="relative mb-4">
                  <i class="fa-regular fa-pen-to-square absolute left-4 top-4 text-slate-400"></i>
                  <textarea id="commentText" required rows="3" placeholder="Share your thoughts, questions, or feedback about this document..." class="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none resize-none transition-all placeholder:text-slate-400"></textarea>
                </div>
                <div class="flex items-center justify-between">
                  <p class="text-xs text-slate-500"><i class="fa-solid fa-shield-halved mr-1"></i>Your information is kept private</p>
                  <button type="submit" class="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/25 flex items-center gap-2">
                    <i class="fa-regular fa-paper-plane"></i>Post Comment
                  </button>
                </div>
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
  window.closeDocumentModal = function () {
    const modal = document.getElementById('documentViewerModal');
    modal.classList.add('hidden');
  };

  // Download document
  window.downloadDocument = async function (docId) {
    try {
      // Use the new /file route which handles download tracking and proper headers
      const a = document.createElement('a');
      a.href = `/api/department-documents/${docId}/file`;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  };



  // Load comments for a document
  window.loadComments = async function (docId) {
    const commentsList = document.getElementById('commentsList');

    if (!commentsList) return;

    try {
      const response = await fetch(`/api/department-documents/${docId}/comments`);
      const data = await response.json();

      if (data.success) {
        const comments = data.comments || [];
        const userEmail = document.getElementById('commentEmail')?.value;

        if (comments.length === 0) {
          commentsList.innerHTML = `
            <div class="text-center py-8">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <i class="fa-regular fa-comments text-2xl text-slate-400"></i>
              </div>
              <p class="text-slate-500">No comments yet</p>
              <p class="text-sm text-slate-400">Be the first to share your feedback!</p>
            </div>
          `;
        } else {
          commentsList.innerHTML = comments.map(comment => `
            <div class="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all" id="comment-${comment._id}">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                    ${comment.userName ? comment.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'NA'}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-800">${comment.userName}</p>
                    <p class="text-xs text-slate-500">${new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                ${comment.userRole === 'admin' ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">Admin</span>' : ''}
              </div>
              <p class="text-slate-600 mb-3 pl-13">${comment.comment}</p>
              
              <!-- Like and Reply Actions -->
              <div class="flex items-center gap-4 border-t border-slate-100 pt-3">
                <button onclick="likeComment('${docId}', '${comment._id}')" class="flex items-center gap-1.5 text-sm ${comment.likedBy && comment.likedBy.some(l => l.email === userEmail) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'} transition-colors">
                  <i class="fa-solid fa-heart ${comment.likedBy && comment.likedBy.some(l => l.email === userEmail) ? '' : 'fa-regular'}"></i>
                  <span>${comment.likes || 0}</span>
                </button>
                <button onclick="toggleReplyForm('${comment._id}')" class="flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-500 transition-colors">
                  <i class="fa-solid fa-reply"></i>
                  <span>Reply</span>
                </button>
              </div>
              
              <!-- Reply Form (hidden by default) -->
              <div id="replyForm-${comment._id}" class="hidden mt-4 pl-4 border-l-2 border-slate-200">
                <form onsubmit="submitReply(event, '${docId}', '${comment._id}')">
                  <input type="hidden" id="replyName-${comment._id}" value="${document.getElementById('commentName')?.value || ''}">
                  <input type="hidden" id="replyEmail-${comment._Id}" value="${userEmail || ''}">
                  <div class="relative mb-2">
                    <i class="fa-solid fa-pen absolute left-3 top-3 text-slate-400"></i>
                    <textarea id="replyText-${comment._id}" required rows="2" placeholder="Write your reply..." class="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-teal-500 focus:outline-none resize-none text-sm"></textarea>
                  </div>
                  <button type="submit" class="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-semibold rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all">
                    <i class="fa-solid fa-paper-plane mr-1"></i>Reply
                  </button>
                </form>
              </div>
              
              <!-- Replies -->
              ${comment.replies && comment.replies.length > 0 ? `
                <div class="mt-4 space-y-3 pl-4 border-l-2 border-slate-100">
                  ${comment.replies.map((reply, idx) => `
                    <div class="p-3 bg-slate-50 rounded-lg" id="reply-${comment._id}-${idx}">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                            ${reply.userName ? reply.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'NA'}
                          </div>
                          <p class="font-medium text-slate-700 text-sm">${reply.userName}</p>
                          ${reply.userRole === 'admin' ? '<span class="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Admin</span>' : ''}
                        </div>
                        <span class="text-xs text-slate-400">${new Date(reply.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p class="text-slate-600 text-sm pl-10">${reply.comment}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Load comments error:', error);
      commentsList.innerHTML = `
        <div class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <i class="fa-solid fa-exclamation-triangle text-2xl text-red-500"></i>
          </div>
          <p class="text-red-500">Failed to load comments</p>
        </div>
      `;
    }
  };

  // Like comment
  window.likeComment = async function (docId, commentId) {
    const userEmail = document.getElementById('commentEmail')?.value;

    if (!userEmail) {
      alert('Please enter your email to like comments');
      return;
    }

    try {
      const response = await fetch(`/api/department-documents/${docId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail })
      });

      const data = await response.json();

      if (data.success) {
        loadComments(docId);
      }
    } catch (error) {
      console.error('Like comment error:', error);
    }
  };

  // Toggle reply form
  window.toggleReplyForm = function (commentId) {
    const form = document.getElementById(`replyForm-${commentId}`);
    form.classList.toggle('hidden');
  };

  // Submit reply
  window.submitReply = async function (event, docId, commentId) {
    event.preventDefault();

    const userName = document.getElementById(`replyName-${commentId}`).value || document.getElementById('commentName')?.value;
    const userEmail = document.getElementById(`replyEmail-${commentId}`).value || document.getElementById('commentEmail')?.value;
    const reply = document.getElementById(`replyText-${commentId}`).value;

    if (!userName || !userEmail) {
      alert('Please fill in your name and email in the comment form first');
      return;
    }

    try {
      const response = await fetch(`/api/department-documents/${docId}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          userEmail,
          userRole: 'student',
          reply
        })
      });

      const data = await response.json();

      if (data.success) {
        loadComments(docId);
      } else {
        alert('Failed to post reply: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Submit reply error:', error);
      alert('Error posting reply. Please try again.');
    }
  };

  // Submit comment
  window.submitComment = async function (event, docId) {
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
        successMsg.className = 'p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 mb-4 flex items-center gap-2';
        successMsg.innerHTML = '<i class="fa-solid fa-check-circle"></i>Comment posted successfully!';
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
  document.getElementById('searchInput').addEventListener('input', function (e) {
    const searchTerm = e.target.value.toLowerCase();

    filteredDocuments = allDocuments.filter(doc => {
      return doc.title.toLowerCase().includes(searchTerm) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm)) ||
        doc.category.toLowerCase().includes(searchTerm);
    });

    applyFilters();
  });

  // Category filter
  document.getElementById('categoryFilter').addEventListener('change', function (e) {
    applyFilters();
  });

  // Sort filter
  document.getElementById('sortFilter').addEventListener('change', function (e) {
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
  document.addEventListener('DOMContentLoaded', function () {
    loadDocuments();
  });

})();
