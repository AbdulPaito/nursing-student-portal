(function() {
  'use strict';
  // API Configuration - Set your Render backend URL here
  var API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '' // Local development - use relative URLs
    : 'https://nursing-student-portal.onrender.com'; // Production - Render backend URL
  
  console.log('🔗 API URL configured:', API || 'Relative URLs (same domain)');
  
  function getToken() { return localStorage.getItem('adminToken'); }
  function headers() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }; }

  function requireAuth() {
    if (!getToken()) { window.location.replace('/admin/login'); return false; }
    return true;
  }
  if (!requireAuth()) throw new Error('redirect');
  window.addEventListener('pageshow', function(e) {
    if (e.persisted && !getToken()) window.location.replace('/admin/login');
  });

  // Toast
  function toast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var id = 'toast-' + Date.now();
    var bg = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';
    container.insertAdjacentHTML('beforeend',
      '<div class="toast align-items-center text-white ' + bg + ' border-0 show" role="alert" id="' + id + '">' +
        '<div class="d-flex"><div class="toast-body">' + escapeHtml(message) + '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>' +
      '</div>');
    var el = document.getElementById(id);
    setTimeout(function() { if (el && el.parentNode) el.remove(); }, 4000);
  }

  // Confirm delete
  var confirmDeleteResolve;
  var confirmModal = document.getElementById('confirmDeleteModal');
  var confirmMessage = document.getElementById('confirmDeleteMessage');
  var confirmBtn = document.getElementById('confirmDeleteBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
      var resolve = confirmDeleteResolve;
      confirmDeleteResolve = null;
      if (resolve) resolve(true);
      bootstrap.Modal.getInstance(confirmModal).hide();
    });
  }
  function confirmDelete(msg) {
    if (!confirmModal) return Promise.resolve(confirm(msg || 'Delete this item?'));
    confirmMessage.textContent = msg || 'Are you sure you want to delete this item?';
    return new Promise(function(resolve) {
      confirmDeleteResolve = resolve;
      var m = new bootstrap.Modal(confirmModal);
      m.show();
      confirmModal.addEventListener('hidden.bs.modal', function once() {
        confirmModal.removeEventListener('hidden.bs.modal', once);
        if (confirmDeleteResolve) { confirmDeleteResolve(false); confirmDeleteResolve = null; }
      });
    });
  }

  // Sidebar toggle (mobile)
  var sidebar = document.getElementById('sidebar');
  var sidebarToggle = document.getElementById('sidebarToggle');
  var sidebarBackdrop = document.getElementById('sidebarBackdrop');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('show');
      if (sidebarBackdrop) sidebarBackdrop.classList.toggle('show', sidebar.classList.contains('show'));
    });
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', function() {
      sidebar.classList.remove('show');
      sidebarBackdrop.classList.remove('show');
    });
  }

  // Section switching + active highlight
  function showSection(sectionName) {
    console.log('📄 Switching to section:', sectionName);
    document.querySelectorAll('.admin-section').forEach(function(s) { s.classList.add('hidden'); });
    var target = document.getElementById('section-' + sectionName);
    if (target) {
      target.classList.remove('hidden');
      console.log('✅ Section visible:', sectionName);
      
      // Load data when section is shown
      if (sectionName === 'music') {
        console.log('🎵 Music section loaded, fetching files...');
        loadMusicFiles();
      }
    } else {
      console.error('❌ Section not found:', 'section-' + sectionName);
    }
  }

  document.querySelectorAll('.admin-sidebar .nav-link[data-section]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href') === '#') e.preventDefault();
      var section = this.getAttribute('data-section');
      
      // Show the selected section (this calls loadMusicFiles if music section)
      showSection(section);
      
      // Update active link styling
      document.querySelectorAll('.admin-sidebar .nav-link').forEach(function(n) { n.classList.remove('active'); });
      this.classList.add('active');
      
      // Close mobile sidebar
      if (sidebar && window.innerWidth < 992) { 
        sidebar.classList.remove('show'); 
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('show'); 
      }
    });
  });
  document.getElementById('logoutLink').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  });

  function escapeHtml(s) {
    if (s == null) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // API helper (redirect to login on 401)
  function apiFetch(url, options) {
    options = options || {};
    options.headers = options.headers || headers();
    return fetch(API + url, options).then(function(r) {
      if (r.status === 401) { localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); window.location.href = '/admin/login'; return { ok: false, data: null }; }
      return r.json().then(function(data) { return { ok: r.ok, status: r.status, data: data }; });
    });
  }

  // Dashboard
  var recentActivityList = document.getElementById('recentActivityList');
  async function loadDashboard() {
    try {
      var eventsRes = await apiFetch('/api/events');
      var subjectsRes = await apiFetch('/api/daily-subjects');
      var announcementsRes = await apiFetch('/api/announcements');
      var events = Array.isArray(eventsRes.data) ? eventsRes.data : (eventsRes.data && eventsRes.data.data ? eventsRes.data.data : []);
      var dailySubjects = Array.isArray(subjectsRes.data) ? subjectsRes.data : (subjectsRes.data && subjectsRes.data.data ? subjectsRes.data.data : []);
      var announcements = Array.isArray(announcementsRes.data) ? announcementsRes.data : (announcementsRes.data && announcementsRes.data.data ? announcementsRes.data.data : []);

      document.getElementById('statEvents').textContent = events.length;
      document.getElementById('statSubjects').textContent = dailySubjects.length;
      document.getElementById('statAnnouncements').textContent = announcements.length;

      var today = new Date().toISOString().split('T')[0];
      var upcoming = events.filter(function(e) { return e.date >= today; }).sort(function(a, b) { return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''); });
      var nextEl = document.getElementById('statNextEventName');
      var dateEl = document.getElementById('statNextEventDate');
      if (nextEl) nextEl.textContent = upcoming.length ? upcoming[0].title : '—';
      if (dateEl) dateEl.textContent = upcoming.length ? upcoming[0].date : 'Next Event';

      var activity = [];
      events.slice(0, 5).forEach(function(e) { activity.push({ type: 'event', text: e.title, date: e.date }); });
      dailySubjects.forEach(function(d) {
        (d.subjects || []).slice(0, 2).forEach(function(s) { activity.push({ type: 'subject', text: d.dayOfWeek + ': ' + s.name, date: d.dayOfWeek }); });
      });
      activity = activity.slice(0, 10);
      if (recentActivityList) {
        recentActivityList.innerHTML = activity.length
          ? activity.map(function(a) { return '<li class="list-group-item border-0 py-2"><span class="badge bg-secondary me-2">' + a.type + '</span>' + escapeHtml(a.text) + '</li>'; }).join('')
          : '<li class="list-group-item border-0 text-muted">No recent activity. Add events or subjects.</li>';
      }
      renderAnalyticsChart(events, dailySubjects, announcements);
    } catch (err) { console.error(err); if (recentActivityList) recentActivityList.innerHTML = '<li class="list-group-item border-0 text-muted">Could not load activity.</li>'; }
  }
  var analyticsChartInstance = null;
  function renderAnalyticsChart(events, dailySubjects, announcements) {
    var canvas = document.getElementById('analyticsChart');
    if (!canvas || typeof Chart === 'undefined') return;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    function buildMonthlyCounts(list) {
      var counts = new Array(12).fill(0);
      (list || []).forEach(function(item) {
        if (!item.date) return;
        var m = parseInt(item.date.substring(5, 7), 10) - 1;
        if (m >= 0 && m < 12) counts[m]++;
      });
      return counts;
    }

    var eventsPerMonth = buildMonthlyCounts(events);
    var announcementsPerMonth = buildMonthlyCounts(announcements);
    if (analyticsChartInstance) analyticsChartInstance.destroy();
    analyticsChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Events',
            data: eventsPerMonth,
            backgroundColor: 'rgba(30, 144, 255, 0.75)',
            borderColor: '#1E90FF',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Announcements',
            data: announcementsPerMonth,
            backgroundColor: 'rgba(34, 139, 34, 0.7)',
            borderColor: '#228B22',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                var v = ctx.parsed.y || 0;
                return ctx.dataset.label + ': ' + v + ' item' + (v === 1 ? '' : 's');
              }
            }
          }
        }
      }
    });
  }

  // Events CRUD
  var eventsList = [];
  var eventsTableBody = document.getElementById('eventsTableBody');
  var eventsTableWrap = document.getElementById('eventsTableWrap');
  var eventsLoading = document.getElementById('eventsLoading');
  function setEventsLoading(on) {
    if (eventsLoading) eventsLoading.classList.toggle('d-none', !on);
    if (eventsTableWrap) eventsTableWrap.classList.toggle('d-none', on);
  }
  async function loadEvents() {
    setEventsLoading(true);
    try {
      var res = await apiFetch('/api/events');
      var raw = res.data;
      eventsList = Array.isArray(raw) ? raw : (raw && raw.data ? raw.data : []);
      renderEvents(eventsList);
    } catch (err) {
      if (eventsTableBody) eventsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Failed to load.</td></tr>';
      toast('Failed to load events', 'error');
    }
    setEventsLoading(false);
  }
  function renderEvents(list) {
    var q = (document.getElementById('eventsSearch') && document.getElementById('eventsSearch').value || '').toLowerCase();
    var filtered = q ? list.filter(function(e) { return (e.title || '').toLowerCase().includes(q); }) : list;
    if (!eventsTableBody) return;
    eventsTableBody.innerHTML = filtered.length ? filtered.map(function(e) {
      return '<tr><td>' + escapeHtml(e.title) + '</td><td>' + escapeHtml(e.date) + '</td><td>' + escapeHtml(e.time) + '</td><td>' + escapeHtml(e.location || '') + '</td><td>' + (e.items && e.items.length ? e.items.map(escapeHtml).join(', ') : '—') + '</td><td><button class="btn btn-sm btn-edit me-1" onclick="window.editEvent(\'' + escapeHtml(e._id) + '\')">Edit</button><button class="btn btn-sm btn-delete" onclick="window.deleteEvent(\'' + escapeHtml(e._id) + '\')">Delete</button></td></tr>';
    }).join('') : '<tr><td colspan="6" class="text-center text-muted">No events.</td></tr>';
  }
  if (document.getElementById('eventsSearch')) document.getElementById('eventsSearch').addEventListener('input', function() { renderEvents(eventsList); });

  window.openEventForm = function() {
    document.getElementById('eventModalTitle').textContent = 'Add Event';
    document.getElementById('eventId').value = '';
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDescription').value = '';
    if (document.getElementById('eventCategory')) document.getElementById('eventCategory').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '09:00';
    document.getElementById('eventLocation').value = '';
    document.getElementById('eventItems').value = '';
  };
  window.editEvent = function(id) {
    var e = eventsList.find(function(x) { return x._id === id; });
    if (!e) return;
    document.getElementById('eventModalTitle').textContent = 'Edit Event';
    document.getElementById('eventId').value = e._id;
    document.getElementById('eventTitle').value = e.title || '';
    document.getElementById('eventDescription').value = e.description || '';
    if (document.getElementById('eventCategory')) document.getElementById('eventCategory').value = e.category || '';
    document.getElementById('eventDate').value = e.date || '';
    document.getElementById('eventTime').value = e.time || '09:00';
    document.getElementById('eventLocation').value = e.location || '';
    document.getElementById('eventItems').value = (e.items && e.items.length) ? e.items.join('\n') : '';
    new bootstrap.Modal(document.getElementById('eventModal')).show();
  };

  var eventSaveBtn = document.getElementById('eventSaveBtn');
  eventSaveBtn.addEventListener('click', async function() {
    var id = document.getElementById('eventId').value;
    var body = {
      title: document.getElementById('eventTitle').value.trim(),
      description: document.getElementById('eventDescription').value.trim(),
      category: (document.getElementById('eventCategory') && document.getElementById('eventCategory').value) || '',
      date: document.getElementById('eventDate').value,
      time: document.getElementById('eventTime').value,
      location: document.getElementById('eventLocation').value.trim(),
      items: (document.getElementById('eventItems').value || '').split('\n').map(function(s) { return s.trim(); }).filter(Boolean)
    };
    eventSaveBtn.disabled = true;
    eventSaveBtn.textContent = 'Saving...';
    try {
      var res = await apiFetch('/api/events' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(res.data.error || 'Save failed');
      bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
      toast(res.data.message || 'Saved.');
      loadEvents();
      loadDashboard();
    } catch (err) {
      toast(err.message || 'Failed to save.', 'error');
    }
    eventSaveBtn.disabled = false;
    eventSaveBtn.textContent = 'Save';
  });

  window.deleteEvent = async function(id) {
    var ok = await confirmDelete('Delete this event?');
    if (!ok) return;
    try {
      var res = await apiFetch('/api/events/' + id, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error(res.data.error || 'Delete failed');
      toast(res.data.message || 'Deleted.');
      loadEvents();
      loadDashboard();
    } catch (err) { toast(err.message || 'Failed to delete.', 'error'); }
  };

  // Daily Subjects CRUD
  var dailySubjectsFlat = [];
  var subjectsTableBody = document.getElementById('dailySubjectsTableBody');
  var subjectsTableWrap = document.getElementById('subjectsTableWrap');
  var subjectsLoading = document.getElementById('subjectsLoading');
  // ========================================
  // COURSES/SUBJECTS MANAGEMENT
  // ========================================
  
  var coursesData = [];
  
  function setSubjectsLoading(on) {
    var loadingDiv = document.getElementById('subjectsLoading');
    var tableWrap = document.getElementById('subjectsTableWrap');
    if (loadingDiv) loadingDiv.classList.toggle('hidden', !on);
    if (tableWrap) tableWrap.classList.toggle('hidden', on);
  }
  
  async function loadCourses() {
    setSubjectsLoading(true);
    try {
      var res = await fetch(API + '/api/courses');
      var json = await res.json();
      if (json.success) {
        coursesData = json.data || [];
        renderCourses();
      } else {
        throw new Error(json.error || 'Failed to load courses');
      }
    } catch (err) {
      var tbody = document.getElementById('dailySubjectsTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center"><div class="text-rose-600 font-medium">Failed to load courses</div></td></tr>';
      toast('Failed to load courses', 'error');
    }
    setSubjectsLoading(false);
  }
  
  function renderCourses() {
    var tbody = document.getElementById('dailySubjectsTableBody');
    if (!tbody) return;
    
    if (!coursesData.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center"><div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4"><i class="fa-solid fa-book-open text-2xl text-gray-400"></i></div><p class="text-gray-500 font-medium">No courses added yet</p></td></tr>';
      return;
    }
    
    tbody.innerHTML = coursesData.map(function(course) {
      var statusBadge = course.status === 'Active' 
        ? '<span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Active</span>'
        : '<span class="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">Inactive</span>';
      
      return '<tr class="hover:bg-gray-50 transition-colors">' +
        '<td class="px-6 py-4"><span class="font-mono font-semibold text-primary-600">' + escapeHtml(course.code) + '</span></td>' +
        '<td class="px-6 py-4"><span class="font-medium text-gray-800">' + escapeHtml(course.name) + '</span></td>' +
        '<td class="px-6 py-4 text-center"><span class="font-semibold text-gray-700">' + escapeHtml(course.unit.toString()) + '</span></td>' +
        '<td class="px-6 py-4">' + escapeHtml(course.yearLevel) + '</td>' +
        '<td class="px-6 py-4">' + escapeHtml(course.semester) + '</td>' +
        '<td class="px-6 py-4">' + statusBadge + '</td>' +
        '<td class="px-6 py-4"><div class="flex gap-2">' +
        '<button onclick="editCourse(\'' + course._id + '\')" class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"><i class="fa-solid fa-pen text-xs"></i> Edit</button>' +
        '<button onclick="deleteCourse(\'' + course._id + '\')" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"><i class="fa-solid fa-trash text-xs"></i> Delete</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
  }

  // Open course form modal
  window.openSubjectForm = function() {
    console.log('Opening course modal...');
    var modal = document.getElementById('courseModal');
    console.log('Modal element:', modal);
    
    document.getElementById('courseModalTitle').textContent = 'Add Course or Subject';
    document.getElementById('courseId').value = '';
    document.getElementById('courseCode').value = '';
    document.getElementById('courseName').value = '';
    document.getElementById('courseUnit').value = '';
    document.getElementById('courseYearLevel').value = '';
    document.getElementById('courseSemester').value = '';
    document.getElementById('courseStatus').value = 'Active';
    
    modal.classList.remove('hidden');
    modal.style.display = 'block';
    console.log('Modal should be visible now');
  };
  
  // Close course modal
  window.closeCourseModal = function() {
    var modal = document.getElementById('courseModal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  };
  
  // Save course (create or update)
  window.saveCourse = async function() {
    var courseId = document.getElementById('courseId').value;
    var code = document.getElementById('courseCode').value.trim();
    var name = document.getElementById('courseName').value.trim();
    var unit = parseFloat(document.getElementById('courseUnit').value);
    var yearLevel = document.getElementById('courseYearLevel').value;
    var semester = document.getElementById('courseSemester').value;
    var status = document.getElementById('courseStatus').value;
    
    // Validate
    if (!code || !name || !unit || !yearLevel || !semester) {
      toast('Please fill in all required fields', 'error');
      return;
    }
    
    var saveBtn = document.getElementById('courseSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
      var url = courseId ? API + '/api/courses/' + courseId : API + '/api/courses';
      var method = courseId ? 'PUT' : 'POST';
      
      var res = await fetch(url, {
        method: method,
        headers: headers(),
        body: JSON.stringify({
          code: code,
          name: name,
          unit: unit,
          yearLevel: yearLevel,
          semester: semester,
          status: status
        })
      });
      
      var json = await res.json();
      if (json.success) {
        toast(courseId ? 'Course updated successfully!' : 'Course created successfully!', 'success');
        closeCourseModal();
        loadCourses();
      } else {
        throw new Error(json.error || 'Failed to save course');
      }
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
    
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Course';
  };
  
  // Edit course
  window.editCourse = async function(courseId) {
    var course = coursesData.find(function(c) { return c._id === courseId; });
    if (!course) return;
    
    document.getElementById('courseModalTitle').textContent = 'Edit Course or Subject';
    document.getElementById('courseId').value = course._id;
    document.getElementById('courseCode').value = course.code;
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseUnit').value = course.unit;
    document.getElementById('courseYearLevel').value = course.yearLevel;
    document.getElementById('courseSemester').value = course.semester;
    document.getElementById('courseStatus').value = course.status;
    var modal = document.getElementById('courseModal');
    modal.classList.remove('hidden');
    modal.style.display = 'block';
  };
  
  // Delete course
  window.deleteCourse = async function(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      var res = await fetch(API + '/api/courses/' + courseId, {
        method: 'DELETE',
        headers: headers()
      });
      
      var json = await res.json();
      if (json.success) {
        toast('Course deleted successfully!', 'success');
        loadCourses();
      } else {
        throw new Error(json.error || 'Failed to delete course');
      }
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
  };

  // Announcements CRUD
  var announcementsList = [];
  var announcementsTableBody = document.getElementById('announcementsTableBody');
  var announcementsTableWrap = document.getElementById('announcementsTableWrap');
  var announcementsLoading = document.getElementById('announcementsLoading');
  function setAnnouncementsLoading(on) {
    if (announcementsLoading) announcementsLoading.classList.toggle('d-none', !on);
    if (announcementsTableWrap) announcementsTableWrap.classList.toggle('d-none', on);
  }
  async function loadAnnouncements() {
    setAnnouncementsLoading(true);
    try {
      var res = await apiFetch('/api/announcements');
      var raw = res.data;
      announcementsList = Array.isArray(raw) ? raw : (raw && raw.data ? raw.data : []);
      if (announcementsTableBody) {
        announcementsTableBody.innerHTML = announcementsList.length ? announcementsList.map(function(a) {
          var msg = (a.message || '').substring(0, 60) + ((a.message || '').length > 60 ? '…' : '');
          var active = a.active !== false;
          var dt = a.date + (a.time ? ' ' + a.time : '');
          return '<tr><td>' + escapeHtml(a.title) + '</td><td>' + escapeHtml(msg) + '</td><td>' + escapeHtml(dt) + '</td><td><span class="badge ' + (active ? 'bg-success' : 'bg-secondary') + '">' + (active ? 'Active' : 'Inactive') + '</span></td><td><button class="btn btn-sm btn-edit me-1" onclick="window.editAnnouncement(\'' + escapeHtml(a._id) + '\')">Edit</button><button class="btn btn-sm btn-delete" onclick="window.deleteAnnouncement(\'' + escapeHtml(a._id) + '\')">Delete</button></td></tr>';
        }).join('') : '<tr><td colspan="5" class="text-center text-muted">No announcements.</td></tr>';
      }
    } catch (err) {
      if (announcementsTableBody) announcementsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Failed to load.</td></tr>';
      toast('Failed to load announcements', 'error');
    }
    setAnnouncementsLoading(false);
  }

  window.openAnnouncementForm = function() {
    document.getElementById('announcementModalTitle').textContent = 'Add Announcement';
    document.getElementById('announcementId').value = '';
    document.getElementById('announcementTitle').value = '';
    document.getElementById('announcementMessage').value = '';
    document.getElementById('announcementDate').value = new Date().toISOString().split('T')[0];
    var timeEl = document.getElementById('announcementTime');
    if (timeEl) timeEl.value = '09:00';
    document.getElementById('announcementActive').checked = true;
  };
  window.editAnnouncement = function(id) {
    var a = announcementsList.find(function(x) { return x._id === id; });
    if (!a) return;
    document.getElementById('announcementModalTitle').textContent = 'Edit Announcement';
    document.getElementById('announcementId').value = a._id;
    document.getElementById('announcementTitle').value = a.title || '';
    document.getElementById('announcementMessage').value = a.message || '';
    document.getElementById('announcementDate').value = a.date || '';
    var timeEl = document.getElementById('announcementTime');
    if (timeEl) timeEl.value = (a.time || '09:00').substring(0, 5);
    document.getElementById('announcementActive').checked = a.active !== false;
    new bootstrap.Modal(document.getElementById('announcementModal')).show();
  };

  var announcementSaveBtn = document.getElementById('announcementSaveBtn');
  announcementSaveBtn.addEventListener('click', async function() {
    var id = document.getElementById('announcementId').value;
    var timeEl = document.getElementById('announcementTime');
    var body = {
      title: document.getElementById('announcementTitle').value.trim(),
      message: document.getElementById('announcementMessage').value.trim(),
      date: document.getElementById('announcementDate').value,
      time: timeEl ? timeEl.value || '09:00' : '09:00',
      active: document.getElementById('announcementActive').checked
    };
    announcementSaveBtn.disabled = true;
    announcementSaveBtn.textContent = 'Saving...';
    try {
      var res = await apiFetch('/api/announcements' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(res.data.error || 'Save failed');
      bootstrap.Modal.getInstance(document.getElementById('announcementModal')).hide();
      toast(res.data.message || 'Saved.');
      loadAnnouncements();
      loadDashboard();
    } catch (err) {
      toast(err.message || 'Failed to save.', 'error');
    }
    announcementSaveBtn.disabled = false;
    announcementSaveBtn.textContent = 'Save';
  });

  window.deleteAnnouncement = async function(id) {
    var ok = await confirmDelete('Delete this announcement?');
    if (!ok) return;
    try {
      var res = await apiFetch('/api/announcements/' + id, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error(res.data.error || 'Delete failed');
      toast(res.data.message || 'Deleted.');
      loadAnnouncements();
      loadDashboard();
    } catch (err) { toast(err.message || 'Failed to delete.', 'error'); }
  };

  loadDashboard();
  loadEvents();
  loadCourses();
  loadAnnouncements();

  // Music Management
  var musicList = [];
  var musicGrid = document.getElementById('musicGrid');
  var musicLoading = document.getElementById('musicLoading');
  var musicEmpty = document.getElementById('musicEmpty');

  async function loadMusicFiles() {
    console.log('🎵 Loading music files...');
    if (musicLoading) musicLoading.classList.remove('hidden');
    if (musicGrid) musicGrid.classList.add('hidden');
    if (musicEmpty) musicEmpty.classList.add('hidden');

    try {
      console.log('📡 Fetching from:', API + '/api/music');
      var res = await apiFetch('/api/music');
      console.log('✅ Music response:', res);
      var raw = res.data;
      musicList = Array.isArray(raw) ? raw : [];
      console.log('📊 Music count:', musicList.length);
      
      if (musicLoading) musicLoading.classList.add('hidden');
      
      if (musicList.length === 0) {
        if (musicEmpty) musicEmpty.classList.remove('hidden');
        console.log('📭 No music files found');
      } else {
        if (musicGrid) {
          musicGrid.classList.remove('hidden');
          displayMusicFiles(musicList);
          console.log('✅ Music files displayed');
        }
      }
    } catch (err) {
      console.error('❌ Failed to load music:', err);
      if (musicLoading) {
        musicLoading.innerHTML = '<div class="glass rounded-3xl shadow-xl p-12 text-center"><i class="fa-solid fa-exclamation-circle text-4xl text-red-500 mb-4"></i><p class="text-red-600">' + (err.message || 'Failed to load') + '</p></div>';
      }
    }
  }

  function displayMusicFiles(files) {
    if (!musicGrid) return;
    musicGrid.innerHTML = files.map(function(music) {
      var locationLabel = music.location === 'login' ? 'Login Page' : music.location === 'portal' ? 'Student Portal' : 'Both Pages';
      var statusClass = music.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
      var statusText = music.isActive ? 'Active' : 'Inactive';
      var fileSize = formatFileSize(music.fileSize);
      
      return '<div class="glass rounded-2xl border-2 border-gray-200 p-5 hover:border-primary-500 hover:shadow-lg transition-all card-hover">' +
        '<div class="flex items-start justify-between mb-4">' +
          '<div class="flex-1"><h3 class="font-bold text-gray-800 mb-1">' + escapeHtml(music.title) + '</h3>' +
          '<p class="text-xs text-gray-500">' + fileSize + '</p></div>' +
          '<span class="px-3 py-1 rounded-full text-xs font-semibold ' + statusClass + '">' + statusText + '</span>' +
        '</div>' +
        '<div class="mb-4"><span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700">' +
          '<i class="fa-solid fa-map-marker-alt"></i> ' + locationLabel +
        '</span></div>' +
        '<audio controls class="w-full mb-4" style="height: 40px;"><source src="' + music.filePath + '" type="audio/mpeg">Your browser does not support audio.</audio>' +
        '<div class="flex gap-2">' +
          '<button onclick="toggleMusicStatus(\'' + music._id + '\', ' + music.isActive + ')" class="flex-1 px-4 py-2 rounded-lg font-medium transition-all ' + (music.isActive ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200') + '">' +
            '<i class="fa-solid fa-' + (music.isActive ? 'pause' : 'play') + '"></i> ' + (music.isActive ? 'Deactivate' : 'Activate') +
          '</button>' +
          '<button onclick="openMusicEditModal(\'' + music._id + '\', \'' + escapeHtml(music.title) + '\', \'' + music.location + '\')" class="px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"><i class="fa-solid fa-edit"></i></button>' +
          '<button onclick="deleteMusic(\'' + music._id + '\')" class="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all"><i class="fa-solid fa-trash"></i></button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  window.openMusicUploadModal = function() {
    document.getElementById('musicUploadModal').classList.remove('hidden');
  };

  window.closeMusicUploadModal = function() {
    document.getElementById('musicUploadModal').classList.add('hidden');
    document.getElementById('musicUploadForm').reset();
    document.getElementById('musicFileNameDisplay').textContent = 'Choose audio file (MP3, WAV, OGG, M4A)';
  };

  window.updateMusicFileName = function() {
    var fileInput = document.getElementById('musicFile');
    var display = document.getElementById('musicFileNameDisplay');
    if (fileInput.files.length > 0) {
      display.textContent = fileInput.files[0].name;
    }
  };

  document.getElementById('musicUploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('🎵 Starting music upload...');
    
    var title = document.getElementById('musicTitle').value;
    var location = document.getElementById('musicLocation').value;
    var file = document.getElementById('musicFile').files[0];

    console.log('📋 Upload details:', { title, location, fileName: file?.name, fileSize: file?.size });

    if (!file) {
      toast('Please select a music file', 'error');
      console.error('❌ No file selected');
      return;
    }

    var formData = new FormData();
    formData.append('title', title);
    formData.append('location', location);
    formData.append('music', file);

    var uploadBtn = document.getElementById('musicUploadBtn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

    try {
      var uploadUrl = API + '/api/music/upload';
      console.log('📡 Uploading to:', uploadUrl);
      
      var response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + getToken() },
        body: formData
      });

      console.log('📥 Upload response status:', response.status);
      var data = await response.json();
      console.log('📥 Upload response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      console.log('✅ Music uploaded successfully!');
      toast('Music uploaded successfully!');
      closeMusicUploadModal();
      loadMusicFiles();
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast('Error: ' + error.message, 'error');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = 'Upload';
    }
  });

  window.toggleMusicStatus = async function(id, currentStatus) {
    try {
      var res = await apiFetch('/api/music/' + id + '/toggle', { method: 'PUT', headers: headers() });
      if (!res.ok) throw new Error(res.data.message || 'Failed to update status');
      toast(res.data.message || 'Status updated');
      loadMusicFiles();
    } catch (error) {
      toast('Error: ' + error.message, 'error');
    }
  };

  window.deleteMusic = async function(id) {
    var ok = await confirmDelete('Are you sure you want to delete this music file?');
    if (!ok) return;

    try {
      var res = await apiFetch('/api/music/' + id, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error(res.data.message || 'Delete failed');
      toast('Music deleted successfully!');
      loadMusicFiles();
    } catch (error) {
      toast('Error: ' + error.message, 'error');
    }
  };

  window.openMusicEditModal = function(id, title, location) {
    document.getElementById('editMusicId').value = id;
    document.getElementById('editMusicTitle').value = title;
    document.getElementById('editMusicLocation').value = location;
    document.getElementById('musicEditModal').classList.remove('hidden');
  };

  window.closeMusicEditModal = function() {
    document.getElementById('musicEditModal').classList.add('hidden');
  };

  document.getElementById('musicEditForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var id = document.getElementById('editMusicId').value;
    var title = document.getElementById('editMusicTitle').value;
    var location = document.getElementById('editMusicLocation').value;

    try {
      var res = await apiFetch('/api/music/' + id, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ title: title, location: location })
      });

      if (!res.ok) throw new Error(res.data.message || 'Update failed');
      toast('Music updated successfully!');
      closeMusicEditModal();
      loadMusicFiles();
    } catch (error) {
      toast('Error: ' + error.message, 'error');
    }
  });

  // ========================================
  // DEPARTMENT INFO FUNCTIONS
  // ========================================
  
  // Load department info
  window.loadDepartmentInfo = function() {
    fetch(API + '/api/department-info')
      .then(function(res) { return res.json(); })
      .then(function(json) {
        if (json.success && json.data) {
          var data = json.data;
          document.getElementById('displayTotalStudents').textContent = data.totalStudents || 0;
          document.getElementById('displayTotalFaculty').textContent = data.totalFaculty || 0;
          
          if (data.updatedAt) {
            var date = new Date(data.updatedAt);
            document.getElementById('lastUpdatedInfo').textContent = date.toLocaleString();
          }
        }
      })
      .catch(function(err) {
        console.error('Error loading department info:', err);
      });
  };

  // Open edit students modal
  window.openEditStudentsModal = function() {
    var currentValue = document.getElementById('displayTotalStudents').textContent;
    document.getElementById('inputTotalStudents').value = currentValue;
    document.getElementById('editStudentsModal').classList.remove('hidden');
    document.getElementById('inputTotalStudents').focus();
  };

  // Close edit students modal
  window.closeEditStudentsModal = function() {
    document.getElementById('editStudentsModal').classList.add('hidden');
  };

  // Open edit faculty modal
  window.openEditFacultyModal = function() {
    var currentValue = document.getElementById('displayTotalFaculty').textContent;
    document.getElementById('inputTotalFaculty').value = currentValue;
    document.getElementById('editFacultyModal').classList.remove('hidden');
    document.getElementById('inputTotalFaculty').focus();
  };

  // Close edit faculty modal
  window.closeEditFacultyModal = function() {
    document.getElementById('editFacultyModal').classList.add('hidden');
  };

  // Update students count
  window.updateStudentsCount = function(event) {
    event.preventDefault();
    var totalStudents = parseInt(document.getElementById('inputTotalStudents').value);
    
    if (isNaN(totalStudents) || totalStudents < 0) {
      toast('Please enter a valid number', 'error');
      return;
    }

    fetch(API + '/api/department-info', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ totalStudents: totalStudents })
    })
      .then(function(res) { return res.json(); })
      .then(function(json) {
        if (json.success) {
          toast('Students count updated successfully!', 'success');
          closeEditStudentsModal();
          loadDepartmentInfo();
        } else {
          toast('Error: ' + (json.error || 'Failed to update'), 'error');
        }
      })
      .catch(function(err) {
        console.error('Error updating students count:', err);
        toast('Error: ' + err.message, 'error');
      });
  };

  // Update faculty count
  window.updateFacultyCount = function(event) {
    event.preventDefault();
    var totalFaculty = parseInt(document.getElementById('inputTotalFaculty').value);
    
    if (isNaN(totalFaculty) || totalFaculty < 0) {
      toast('Please enter a valid number', 'error');
      return;
    }

    fetch(API + '/api/department-info', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ totalFaculty: totalFaculty })
    })
      .then(function(res) { return res.json(); })
      .then(function(json) {
        if (json.success) {
          toast('Faculty count updated successfully!', 'success');
          closeEditFacultyModal();
          loadDepartmentInfo();
        } else {
          toast('Error: ' + (json.error || 'Failed to update'), 'error');
        }
      })
      .catch(function(err) {
        console.error('Error updating faculty count:', err);
        toast('Error: ' + err.message, 'error');
      });
  };

  // Close modals when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target.id === 'editStudentsModal') {
      closeEditStudentsModal();
    }
    if (e.target.id === 'editFacultyModal') {
      closeEditFacultyModal();
    }
    if (e.target.id === 'courseModal') {
      closeCourseModal();
    }
  });

  // Initialize - show dashboard by default
  document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Admin dashboard initialized');
    // Dashboard section should be visible by default
    var dashboardSection = document.getElementById('section-dashboard');
    if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
      console.log('✅ Dashboard is default section');
    }
    
    // Load department info when department section is shown
    var departmentSection = document.getElementById('section-department-info');
    if (departmentSection) {
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.attributeName === 'class') {
            if (!departmentSection.classList.contains('hidden')) {
              loadDepartmentInfo();
            }
          }
        });
      });
      observer.observe(departmentSection, { attributes: true });
    }
  });
})();
