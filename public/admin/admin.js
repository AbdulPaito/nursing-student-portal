(function () {
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
  window.addEventListener('pageshow', function (e) {
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
    setTimeout(function () { if (el && el.parentNode) el.remove(); }, 4000);
  }

  // Close modal function (global utility)
  window.closeModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  // Confirm delete (using custom modal, not Bootstrap)
  var confirmDeleteResolve;
  var confirmModal = document.getElementById('confirmDeleteModal');
  var confirmMessage = document.getElementById('confirmDeleteMessage');
  var confirmBtn = document.getElementById('confirmDeleteBtn');
  var confirmCancelBtn = document.getElementById('confirmDeleteCancelBtn');

  function showConfirmModal(msg) {
    if (!confirmModal) return Promise.resolve(confirm(msg || 'Delete this item?'));
    if (confirmMessage) confirmMessage.textContent = msg || 'Are you sure you want to delete this item?';
    confirmModal.classList.remove('hidden');
    return new Promise(function (resolve) {
      confirmDeleteResolve = resolve;
    });
  }

  function hideConfirmModal() {
    if (confirmModal) confirmModal.classList.add('hidden');
    confirmDeleteResolve = null;
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', function () {
      var resolve = confirmDeleteResolve;
      confirmDeleteResolve = null;
      if (resolve) resolve(true);
      hideConfirmModal();
    });
  }

  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', function () {
      var resolve = confirmDeleteResolve;
      confirmDeleteResolve = null;
      if (resolve) resolve(false);
      hideConfirmModal();
    });
  }

  if (confirmModal) {
    confirmModal.addEventListener('click', function (e) {
      if (e.target === confirmModal) {
        var resolve = confirmDeleteResolve;
        confirmDeleteResolve = null;
        if (resolve) resolve(false);
        hideConfirmModal();
      }
    });
  }

  function confirmDelete(msg) {
    return showConfirmModal(msg);
  }

  // Sidebar toggle (mobile)
  var sidebar = document.getElementById('sidebar');
  var sidebarToggle = document.getElementById('sidebarToggle');
  var sidebarBackdrop = document.getElementById('sidebarBackdrop');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('show');
      if (sidebarBackdrop) sidebarBackdrop.classList.toggle('show', sidebar.classList.contains('show'));
    });
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', function () {
      sidebar.classList.remove('show');
      sidebarBackdrop.classList.remove('show');
    });
  }

  // Section switching + active highlight
  function showSection(sectionName) {
    console.log('📄 Switching to section:', sectionName);
    document.querySelectorAll('.admin-section').forEach(function (s) { s.classList.add('hidden'); });
    var target = document.getElementById('section-' + sectionName);
    if (target) {
      target.classList.remove('hidden');
      console.log('✅ Section visible:', sectionName);
    } else {
      console.error('❌ Section not found:', 'section-' + sectionName);
    }
  }

  document.querySelectorAll('.admin-sidebar .nav-link[data-section]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (this.getAttribute('href') === '#') e.preventDefault();
      var section = this.getAttribute('data-section');

      // Show the selected section
      showSection(section);

      // Load section-specific data
      if (section === 'department') {
        console.log('📄 Department section loaded, fetching info and documents...');
        setTimeout(function () { loadDepartmentInfo(); }, 50);
        // Delay loadDepartmentDocuments to ensure DOM is ready
        setTimeout(function () { 
          console.log('⏰ Calling loadDepartmentDocuments after delay...');
          loadDepartmentDocuments(); 
        }, 100);
      }
      if (section === 'music') {
        console.log('🎵 Music section loaded, fetching files...');
        loadMusicFiles();
      }

      // Update active link styling
      document.querySelectorAll('.admin-sidebar .nav-link').forEach(function (n) { n.classList.remove('active'); });
      this.classList.add('active');

      // Close mobile sidebar
      if (sidebar && window.innerWidth < 992) {
        sidebar.classList.remove('show');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
      }
    });
  });
  document.getElementById('logoutLink').addEventListener('click', async function (e) {
    e.preventDefault();

    // Call logout endpoint to set user offline
    try {
      const token = localStorage.getItem('adminToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Stop heartbeat
    stopHeartbeat();

    // Clear local storage and redirect
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
    return fetch(API + url, options).then(function (r) {
      if (r.status === 401) { localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); window.location.href = '/admin/login'; return { ok: false, data: null }; }
      return r.json().then(function (data) { return { ok: r.ok, status: r.status, data: data }; });
    });
  }

  // Dashboard
  var recentActivityList = document.getElementById('recentActivityList');
  async function loadDashboard() {
    console.log('🏠 Loading dashboard...');
    try {
      var eventsRes = await apiFetch('/api/events');
      var subjectsRes = await apiFetch('/api/daily-subjects');
      var announcementsRes = await apiFetch('/api/announcements');
      console.log('📊 Dashboard API responses:', { eventsRes, subjectsRes, announcementsRes });
      var events = Array.isArray(eventsRes.data) ? eventsRes.data : (eventsRes.data && eventsRes.data.data ? eventsRes.data.data : []);
      var dailySubjects = Array.isArray(subjectsRes.data) ? subjectsRes.data : (subjectsRes.data && subjectsRes.data.data ? subjectsRes.data.data : []);
      var announcements = Array.isArray(announcementsRes.data) ? announcementsRes.data : (announcementsRes.data && announcementsRes.data.data ? announcementsRes.data.data : []);

      document.getElementById('statEvents').textContent = events.length;
      document.getElementById('statSubjects').textContent = dailySubjects.length;
      document.getElementById('statAnnouncements').textContent = announcements.length;

      var today = new Date().toISOString().split('T')[0];
      var upcoming = events.filter(function (e) { return e.date >= today; }).sort(function (a, b) { return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''); });
      var nextEl = document.getElementById('statNextEventName');
      var dateEl = document.getElementById('statNextEventDate');
      if (nextEl) nextEl.textContent = upcoming.length ? upcoming[0].title : '—';
      if (dateEl) dateEl.textContent = upcoming.length ? upcoming[0].date : 'Next Event';

      var activity = [];
      events.slice(0, 5).forEach(function (e) { activity.push({ type: 'event', text: e.title, date: e.date }); });
      dailySubjects.forEach(function (d) {
        (d.subjects || []).slice(0, 2).forEach(function (s) { activity.push({ type: 'subject', text: d.dayOfWeek + ': ' + s.name, date: d.dayOfWeek }); });
      });
      activity = activity.slice(0, 10);
      if (recentActivityList) {
        recentActivityList.innerHTML = activity.length
          ? activity.map(function (a) { return '<li class="list-group-item border-0 py-2"><span class="badge bg-secondary me-2">' + a.type + '</span>' + escapeHtml(a.text) + '</li>'; }).join('')
          : '<li class="list-group-item border-0 text-muted">No recent activity. Add events or subjects.</li>';
      }
      renderAnalyticsChart(events, dailySubjects, announcements);
    } catch (err) { console.error(err); if (recentActivityList) recentActivityList.innerHTML = '<li class="list-group-item border-0 text-muted">Could not load activity.</li>'; }
  }
  var analyticsChartInstance = null;
  function renderAnalyticsChart(events, dailySubjects, announcements) {
    var canvas = document.getElementById('analyticsChart');
    if (!canvas || typeof Chart === 'undefined') return;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function buildMonthlyCounts(list) {
      var counts = new Array(12).fill(0);
      (list || []).forEach(function (item) {
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
              label: function (ctx) {
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
    if (eventsLoading) eventsLoading.classList.toggle('hidden', !on);
    if (eventsTableWrap) eventsTableWrap.classList.toggle('hidden', on);
  }
  async function loadEvents() {
    setEventsLoading(true);
    try {
      var res = await apiFetch('/api/events');
      var raw = res.data;
      eventsList = Array.isArray(raw) ? raw : (raw && raw.data ? raw.data : []);
      renderEvents(eventsList);
    } catch (err) {
      if (eventsTableBody) eventsTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center"><div class="text-rose-600 font-medium">Failed to load events</div></td></tr>';
      toast('Failed to load events', 'error');
    }
    setEventsLoading(false);
  }
  function renderEvents(list) {
    var q = (document.getElementById('eventsSearch') && document.getElementById('eventsSearch').value || '').toLowerCase();
    var filtered = q ? list.filter(function (e) { return (e.title || '').toLowerCase().includes(q); }) : list;
    if (!eventsTableBody) return;

    if (!filtered.length) {
      eventsTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center"><div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-50 mb-4"><i class="fa-solid fa-calendar-xmark text-2xl text-violet-400"></i></div><p class="text-gray-500 font-medium">No events found</p><p class="text-sm text-gray-400 mt-1">Try adjusting your search</p></td></tr>';
      return;
    }

    eventsTableBody.innerHTML = filtered.map(function (e) {
      // Format items as badges like Grade Portal
      var itemsList = e.items && e.items.length 
        ? e.items.map(function(item) { 
            return '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-100"><i class="fa-solid fa-check text-[8px] mr-1"></i>' + escapeHtml(item) + '</span>'; 
          }).join('') 
        : '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 text-xs">-</span>';
      
      // Status badge based on date - Grade Portal style
      var today = new Date().toISOString().split('T')[0];
      var eventDate = e.date || e.startDate;
      var isToday = eventDate === today;
      var isPast = eventDate < today;
      var isUpcoming = eventDate > today;
      
      var statusBadge = isToday 
        ? '<span class="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium border border-amber-100"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>Today</span>'
        : isPast 
          ? '<span class="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 text-xs font-medium border border-gray-100">Past</span>'
          : '<span class="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-medium border border-violet-100">Upcoming</span>';
      
      // Category icon with colored background like Grade Portal avatars
      var category = (e.category || '').toLowerCase();
      var iconBg = 'bg-violet-500';
      var iconClass = 'fa-calendar';
      
      if (category.includes('exam')) { iconBg = 'bg-rose-500'; iconClass = 'fa-file-circle-check'; }
      else if (category.includes('orient')) { iconBg = 'bg-blue-500'; iconClass = 'fa-compass'; }
      else if (category.includes('train')) { iconBg = 'bg-amber-500'; iconClass = 'fa-dumbbell'; }
      else if (category.includes('work')) { iconBg = 'bg-emerald-500'; iconClass = 'fa-briefcase'; }
      else if (category.includes('seminar')) { iconBg = 'bg-indigo-500'; iconClass = 'fa-chalkboard-user'; }
      else if (category.includes('social')) { iconBg = 'bg-pink-500'; iconClass = 'fa-champagne-glasses'; }
      
      return '<tr class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">' +
        '<td class="px-6 py-4">' +
          '<div class="flex items-center gap-3">' +
            '<div class="w-10 h-10 rounded-xl ' + iconBg + ' flex items-center justify-center flex-shrink-0">' +
              '<i class="fa-solid ' + iconClass + ' text-white text-sm"></i>' +
            '</div>' +
            '<div class="min-w-0 flex-1">' +
              '<div class="font-semibold text-gray-800 text-sm truncate">' + escapeHtml(e.title) + '</div>' +
              '<div class="text-xs text-gray-500">' + (e.description ? escapeHtml(e.description.substring(0, 40)) + (e.description.length > 40 ? '...' : '') : 'No description') + '</div>' +
              '<div class="mt-1">' + statusBadge + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td class="px-6 py-4 text-sm text-gray-700">' + escapeHtml(e.time || '—') + '</td>' +
        '<td class="px-6 py-4 text-sm text-gray-700">' + escapeHtml(eventDate) + '</td>' +
        '<td class="px-6 py-4 text-sm text-gray-700">' + escapeHtml(e.location || '—') + '</td>' +
        '<td class="px-6 py-4">' +
          '<div class="flex flex-wrap gap-1">' + itemsList + '</div>' +
        '</td>' +
        '<td class="px-6 py-4">' +
          '<div class="flex items-center justify-center gap-2">' +
            '<button onclick="window.editEvent(\'' + escapeHtml(e._id) + '\')" class="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-lg text-xs font-medium transition-colors" title="Edit">' +
              '<i class="fa-solid fa-pen"></i> Edit' +
            '</button>' +
            '<button onclick="window.deleteEvent(\'' + escapeHtml(e._id) + '\')" class="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-medium transition-colors" title="Delete">' +
              '<i class="fa-solid fa-trash"></i> Delete' +
            '</button>' +
          '</div>' +
        '</td>' +
        '</tr>';
    }).join('');
  }
  if (document.getElementById('eventsSearch')) document.getElementById('eventsSearch').addEventListener('input', function () { renderEvents(eventsList); });

  window.openEventForm = function () {
    document.getElementById('eventModalTitle').textContent = 'Add Event';
    document.getElementById('eventId').value = '';
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDescription').value = '';
    if (document.getElementById('eventCategory')) document.getElementById('eventCategory').value = '';
    document.getElementById('eventStartDate').value = '';
    document.getElementById('eventEndDate').value = '';
    document.getElementById('eventTime').value = '09:00';
    document.getElementById('eventLocation').value = '';
    document.getElementById('eventItems').value = '';
    // Show modal
    var modal = document.getElementById('eventModal');
    if (modal) modal.classList.remove('hidden');
  };
  window.editEvent = function (id) {
    var e = eventsList.find(function (x) { return x._id === id; });
    if (!e) return;
    document.getElementById('eventModalTitle').textContent = 'Edit Event';
    document.getElementById('eventId').value = e._id;
    document.getElementById('eventTitle').value = e.title || '';
    document.getElementById('eventDescription').value = e.description || '';
    if (document.getElementById('eventCategory')) document.getElementById('eventCategory').value = e.category || '';
    document.getElementById('eventStartDate').value = e.startDate || e.date || '';
    document.getElementById('eventEndDate').value = e.endDate || '';
    document.getElementById('eventTime').value = e.time || '09:00';
    document.getElementById('eventLocation').value = e.location || '';
    document.getElementById('eventItems').value = (e.items && e.items.length) ? e.items.join('\n') : '';
    // Show modal
    var modal = document.getElementById('eventModal');
    if (modal) modal.classList.remove('hidden');
  };

  var eventSaveBtn = document.getElementById('eventSaveBtn');
  if (eventSaveBtn) {
    console.log('✅ Event save button found, attaching listener');
    eventSaveBtn.addEventListener('click', async function () {
      console.log('🎯 Event save button clicked!');
      var id = document.getElementById('eventId').value;
      var startDate = document.getElementById('eventStartDate').value;
      var endDate = document.getElementById('eventEndDate').value;
      var body = {
        title: document.getElementById('eventTitle').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        category: (document.getElementById('eventCategory') && document.getElementById('eventCategory').value) || '',
        date: startDate, // Use startDate as the primary date for backward compatibility
        startDate: startDate,
        endDate: endDate,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value.trim(),
        items: (document.getElementById('eventItems').value || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
      };
      console.log('📋 Event data to save:', body);
      eventSaveBtn.disabled = true;
      eventSaveBtn.textContent = 'Saving...';
      try {
        console.log('📡 Sending request to:', '/api/events' + (id ? '/' + id : ''));
        var res = await apiFetch('/api/events' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify(body) });
        console.log('📥 Response:', res);
        if (!res.ok) throw new Error(res.data.error || 'Save failed');
        // Hide modal
        var modal = document.getElementById('eventModal');
        if (modal) modal.classList.add('hidden');
        toast(res.data.message || 'Saved.');
        console.log('✅ Event saved successfully!');
        loadEvents();
        loadDashboard();
      } catch (err) {
        console.error('❌ Save error:', err);
        toast(err.message || 'Failed to save.', 'error');
      }
      eventSaveBtn.disabled = false;
      eventSaveBtn.textContent = 'Save Event';
    });
  } else {
    console.error('❌ eventSaveBtn not found - check if element ID exists in HTML');
  }

  window.deleteEvent = async function (id) {
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

  // Event Filter and Sort
  var eventFilterStatus = 'all';
  var eventSortOrder = 'date-asc';

  window.toggleEventFilter = function () {
    // Cycle through filter options: all -> today -> upcoming -> past -> all
    if (eventFilterStatus === 'all') eventFilterStatus = 'today';
    else if (eventFilterStatus === 'today') eventFilterStatus = 'upcoming';
    else if (eventFilterStatus === 'upcoming') eventFilterStatus = 'past';
    else eventFilterStatus = 'all';
    
    applyEventFilterAndSort();
    toast('Filter: ' + eventFilterStatus.charAt(0).toUpperCase() + eventFilterStatus.slice(1));
  };

  window.toggleEventSort = function () {
    // Cycle through sort options: date-asc -> date-desc -> title-asc -> title-desc -> date-asc
    if (eventSortOrder === 'date-asc') eventSortOrder = 'date-desc';
    else if (eventSortOrder === 'date-desc') eventSortOrder = 'title-asc';
    else if (eventSortOrder === 'title-asc') eventSortOrder = 'title-desc';
    else eventSortOrder = 'date-asc';
    
    applyEventFilterAndSort();
    var sortLabel = eventSortOrder.replace('-', ' ').replace('asc', '↑').replace('desc', '↓');
    toast('Sort: ' + sortLabel.charAt(0).toUpperCase() + sortLabel.slice(1));
  };

  function applyEventFilterAndSort() {
    var today = new Date().toISOString().split('T')[0];
    var filtered = eventsList.filter(function (e) {
      var eventDate = e.date || e.startDate;
      var isToday = eventDate === today;
      var isPast = eventDate < today;
      var isUpcoming = eventDate > today;
      
      if (eventFilterStatus === 'today') return isToday;
      if (eventFilterStatus === 'upcoming') return isUpcoming;
      if (eventFilterStatus === 'past') return isPast;
      return true;
    });
    
    // Sort
    filtered.sort(function (a, b) {
      var dateA = a.date || a.startDate;
      var dateB = b.date || b.startDate;
      var titleA = (a.title || '').toLowerCase();
      var titleB = (b.title || '').toLowerCase();
      
      if (eventSortOrder === 'date-asc') return dateA.localeCompare(dateB);
      if (eventSortOrder === 'date-desc') return dateB.localeCompare(dateA);
      if (eventSortOrder === 'title-asc') return titleA.localeCompare(titleB);
      if (eventSortOrder === 'title-desc') return titleB.localeCompare(titleA);
      return 0;
    });
    
    renderEvents(filtered);
  }

  // Override renderEvents to use the filter/sort when called without list
  var originalRenderEvents = renderEvents;
  renderEvents = function (list) {
    if (!list) {
      applyEventFilterAndSort();
      return;
    }
    originalRenderEvents(list);
  };
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
      tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-12 text-center"><div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4"><i class="fa-solid fa-book-open text-2xl text-gray-400"></i></div><p class="text-gray-500 font-medium">No courses added yet</p></td></tr>';
      return;
    }

    tbody.innerHTML = coursesData.map(function (course) {
      console.log('Rendering course:', course.code, 'subjectType:', course.subjectType);

      var statusBadge = course.status === 'Active'
        ? '<span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Active</span>'
        : '<span class="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">Inactive</span>';

      var subjectTypeDisplay = course.subjectType && course.subjectType !== ''
        ? '<span class="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">' + escapeHtml(course.subjectType) + '</span>'
        : '<span class="text-gray-400 text-sm">—</span>';

      return '<tr class="hover:bg-gray-50 transition-colors">' +
        '<td class="px-6 py-4"><span class="font-mono font-semibold text-primary-600">' + escapeHtml(course.code) + '</span></td>' +
        '<td class="px-6 py-4"><span class="font-medium text-gray-800">' + escapeHtml(course.name) + '</span></td>' +
        '<td class="px-6 py-4 text-center"><span class="font-semibold text-gray-700">' + escapeHtml(course.unit.toString()) + '</span></td>' +
        '<td class="px-6 py-4">' + subjectTypeDisplay + '</td>' +
        '<td class="px-6 py-4">' + escapeHtml(course.yearLevel) + '</td>' +
        '<td class="px-6 py-4">' + escapeHtml(course.semester) + '</td>' +
        '<td class="px-6 py-4">' + statusBadge + '</td>' +
        '<td class="px-6 py-4"><div class="flex gap-2">' +
        '<button onclick="editCourse(\'' + course._id + '\')" class="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"><i class="fa-solid fa-pen text-xs"></i> Edit</button>' +
        '<button onclick="deleteCourse(\'' + course._id + '\')" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"><i class="fa-solid fa-trash text-xs"></i> Delete</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
  }

  // Open course form modal
  window.openSubjectForm = function () {
    console.log('Opening course modal...');
    var modal = document.getElementById('courseModal');
    console.log('Modal element:', modal);

    document.getElementById('courseModalTitle').textContent = 'Add Course or Subject';
    document.getElementById('courseId').value = '';
    document.getElementById('courseCode').value = '';
    document.getElementById('courseName').value = '';
    document.getElementById('courseUnit').value = '';
    document.getElementById('courseSubjectType').value = '';
    document.getElementById('courseSubjectTypeCustom').value = '';
    document.getElementById('courseSubjectTypeCustom').classList.add('hidden');
    document.getElementById('courseYearLevel').value = '';
    document.getElementById('courseSemester').value = '';
    document.getElementById('courseStatus').value = 'Active';

    modal.classList.remove('hidden');
    modal.style.display = 'block';
    console.log('Modal should be visible now');
  };

  // Also add alias for openCourseModal
  window.openCourseModal = window.openSubjectForm;

  // Toggle custom subject type input
  window.toggleCustomSubjectType = function () {
    var selectElement = document.getElementById('courseSubjectType');
    var customInput = document.getElementById('courseSubjectTypeCustom');

    if (selectElement.value === 'Other') {
      customInput.classList.remove('hidden');
      customInput.focus();
    } else {
      customInput.classList.add('hidden');
      customInput.value = '';
    }
  };

  // Close course modal
  window.closeCourseModal = function () {
    var modal = document.getElementById('courseModal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  };

  // Save course (create or update)
  window.saveCourse = async function () {
    var courseId = document.getElementById('courseId').value;
    var code = document.getElementById('courseCode').value.trim();
    var name = document.getElementById('courseName').value.trim();
    var unit = parseFloat(document.getElementById('courseUnit').value);
    var subjectTypeSelect = document.getElementById('courseSubjectType').value;
    var subjectTypeCustom = document.getElementById('courseSubjectTypeCustom').value.trim();
    var subjectType = subjectTypeSelect === 'Other' ? subjectTypeCustom : subjectTypeSelect;
    var yearLevel = document.getElementById('courseYearLevel').value;
    var semester = document.getElementById('courseSemester').value;
    var status = document.getElementById('courseStatus').value;

    // Validate
    if (!code || !name || !unit || !yearLevel || !semester) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    // Validate custom type if Other is selected
    if (subjectTypeSelect === 'Other' && !subjectTypeCustom) {
      toast('Please enter a custom subject type', 'error');
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
          subjectType: subjectType,
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
  window.editCourse = async function (courseId) {
    var course = coursesData.find(function (c) { return c._id === courseId; });
    if (!course) return;

    document.getElementById('courseModalTitle').textContent = 'Edit Course or Subject';
    document.getElementById('courseId').value = course._id;
    document.getElementById('courseCode').value = course.code;
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseUnit').value = course.unit;

    // Handle subject type
    var subjectType = course.subjectType || '';
    var knownTypes = ['Lab', 'Lecture', 'Seminar'];
    var customInput = document.getElementById('courseSubjectTypeCustom');

    if (subjectType && knownTypes.indexOf(subjectType) === -1 && subjectType !== '') {
      // Custom type
      document.getElementById('courseSubjectType').value = 'Other';
      customInput.value = subjectType;
      customInput.classList.remove('hidden');
    } else {
      // Standard type or empty
      document.getElementById('courseSubjectType').value = subjectType;
      customInput.value = '';
      customInput.classList.add('hidden');
    }

    document.getElementById('courseYearLevel').value = course.yearLevel;
    document.getElementById('courseSemester').value = course.semester;
    document.getElementById('courseStatus').value = course.status;
    var modal = document.getElementById('courseModal');
    modal.classList.remove('hidden');
    modal.style.display = 'block';
  };

  // Delete course
  window.deleteCourse = async function (courseId) {
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
    if (announcementsLoading) announcementsLoading.classList.toggle('hidden', !on);
    if (announcementsTableWrap) announcementsTableWrap.classList.toggle('hidden', on);
  }
  async function loadAnnouncements() {
    setAnnouncementsLoading(true);
    try {
      var res = await apiFetch('/api/announcements');
      var raw = res.data;
      announcementsList = Array.isArray(raw) ? raw : (raw && raw.data ? raw.data : []);
      if (announcementsTableBody) {
        if (!announcementsList.length) {
          announcementsTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center"><div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4"><i class="fa-solid fa-bullhorn text-2xl text-gray-400"></i></div><p class="text-gray-500 font-medium">No announcements found</p></td></tr>';
        } else {
          announcementsTableBody.innerHTML = announcementsList.map(function (a) {
            var msg = (a.message || '').substring(0, 60) + ((a.message || '').length > 60 ? '…' : '');
            var active = a.active !== false;
            var statusBadge = active
              ? '<span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Active</span>'
              : '<span class="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">Inactive</span>';

            return '<tr class="hover:bg-gray-50 transition-colors">' +
              '<td class="px-6 py-4"><span class="font-semibold text-gray-800">' + escapeHtml(a.title) + '</span></td>' +
              '<td class="px-6 py-4"><span class="text-gray-600">' + escapeHtml(msg) + '</span></td>' +
              '<td class="px-6 py-4"><span class="font-medium text-gray-700">' + escapeHtml(a.date) + '</span></td>' +
              '<td class="px-6 py-4">' + statusBadge + '</td>' +
              '<td class="px-6 py-4"><div class="flex gap-2">' +
              '<button onclick="window.editAnnouncement(\'' + escapeHtml(a._id) + '\')" class="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"><i class="fa-solid fa-pen text-xs"></i> Edit</button>' +
              '<button onclick="window.deleteAnnouncement(\'' + escapeHtml(a._id) + '\')" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"><i class="fa-solid fa-trash text-xs"></i> Delete</button>' +
              '</div></td>' +
              '</tr>';
          }).join('');
        }
      }
    } catch (err) {
      if (announcementsTableBody) announcementsTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center"><div class="text-rose-600 font-medium">Failed to load announcements</div></td></tr>';
      toast('Failed to load announcements', 'error');
    }
    setAnnouncementsLoading(false);
  }

  window.openAnnouncementForm = function () {
    document.getElementById('announcementModalTitle').textContent = 'Add Announcement';
    document.getElementById('announcementId').value = '';
    document.getElementById('announcementTitle').value = '';
    document.getElementById('announcementMessage').value = '';
    document.getElementById('announcementDate').value = new Date().toISOString().split('T')[0];
    var timeEl = document.getElementById('announcementTime');
    if (timeEl) timeEl.value = '09:00';
    document.getElementById('announcementActive').checked = true;
    // Show modal
    var modal = document.getElementById('announcementModal');
    if (modal) modal.classList.remove('hidden');
  };
  window.editAnnouncement = function (id) {
    var a = announcementsList.find(function (x) { return x._id === id; });
    if (!a) return;
    document.getElementById('announcementModalTitle').textContent = 'Edit Announcement';
    document.getElementById('announcementId').value = a._id;
    document.getElementById('announcementTitle').value = a.title || '';
    document.getElementById('announcementMessage').value = a.message || '';
    document.getElementById('announcementDate').value = a.date || '';
    var timeEl = document.getElementById('announcementTime');
    if (timeEl) timeEl.value = (a.time || '09:00').substring(0, 5);
    document.getElementById('announcementActive').checked = a.active !== false;
    // Show modal
    var modal = document.getElementById('announcementModal');
    if (modal) modal.classList.remove('hidden');
  };

  var announcementSaveBtn = document.getElementById('announcementSaveBtn');
  if (announcementSaveBtn) {
    announcementSaveBtn.addEventListener('click', async function () {
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
        // Hide modal
        var modal = document.getElementById('announcementModal');
        if (modal) modal.classList.add('hidden');
        toast(res.data.message || 'Saved.');
        loadAnnouncements();
        loadDashboard();
      } catch (err) {
        toast(err.message || 'Failed to save.', 'error');
      }
      announcementSaveBtn.disabled = false;
      announcementSaveBtn.textContent = 'Save Announcement';
    });
  } else {
    console.error('❌ announcementSaveBtn not found - check if element ID exists in HTML');
  }

  window.deleteAnnouncement = async function (id) {
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
    musicGrid.innerHTML = files.map(function (music) {
      var locationLabel = music.location === 'login' ? 'Login Page' : music.location === 'portal' ? 'Student Portal' : 'Both Pages';
      var locationIcon = music.location === 'login' ? 'fa-right-to-bracket' : music.location === 'portal' ? 'fa-graduation-cap' : 'fa-globe';
      var statusClass = music.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200';
      var statusText = music.isActive ? 'Active' : 'Inactive';
      var statusIcon = music.isActive ? 'fa-circle-play' : 'fa-circle-pause';
      var fileSize = formatFileSize(music.fileSize);

      return '<div class="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-violet-300 transition-all card-hover group">' +
        '<!-- Header with Icon and Status -->' +
        '<div class="flex items-start justify-between mb-4">' +
          '<div class="flex items-center gap-3">' +
            '<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">' +
              '<i class="fa-solid fa-music text-white text-lg"></i>' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
              '<h3 class="font-bold text-gray-800 text-sm truncate">' + escapeHtml(music.title) + '</h3>' +
              '<p class="text-xs text-gray-500">' + fileSize + '</p>' +
            '</div>' +
          '</div>' +
          '<span class="px-2.5 py-1 rounded-full text-xs font-semibold border ' + statusClass + ' flex items-center gap-1">' +
            '<i class="fa-solid ' + statusIcon + '"></i>' + statusText +
          '</span>' +
        '</div>' +
        '<!-- Location Badge -->' +
        '<div class="mb-4">' +
          '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">' +
            '<i class="fa-solid ' + locationIcon + '"></i> ' + locationLabel +
          '</span>' +
        '</div>' +
        '<!-- Audio Player -->' +
        '<div class="mb-4 bg-gray-50 rounded-xl p-3">' +
          '<audio controls class="w-full" style="height: 36px;"><source src="' + music.filePath + '" type="audio/mpeg">Your browser does not support audio.</audio>' +
        '</div>' +
        '<!-- Action Buttons -->' +
        '<div class="flex gap-2">' +
          '<button onclick="toggleMusicStatus(\'' + music._id + '\', ' + music.isActive + ')" class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ' + (music.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200') + ' flex items-center justify-center gap-2">' +
            '<i class="fa-solid fa-' + (music.isActive ? 'pause' : 'play') + '"></i> ' + (music.isActive ? 'Deactivate' : 'Activate') +
          '</button>' +
          '<button onclick="openMusicEditModal(\'' + music._id + '\', \'' + escapeHtml(music.title) + '\', \'' + music.location + '\')" class="px-4 py-2.5 rounded-xl font-semibold text-sm bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-all" title="Edit">' +
            '<i class="fa-solid fa-pen"></i>' +
          '</button>' +
          '<button onclick="deleteMusic(\'' + music._id + '\')" class="px-4 py-2.5 rounded-xl font-semibold text-sm bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all" title="Delete">' +
            '<i class="fa-solid fa-trash"></i>' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  window.openMusicUploadModal = function () {
    document.getElementById('musicUploadModal').classList.remove('hidden');
  };

  window.closeMusicUploadModal = function () {
    document.getElementById('musicUploadModal').classList.add('hidden');
    document.getElementById('musicUploadForm').reset();
    document.getElementById('musicFileNameDisplay').textContent = 'Choose audio file (MP3, WAV, OGG, M4A)';
  };

  window.updateMusicFileName = function () {
    var fileInput = document.getElementById('musicFile');
    var display = document.getElementById('musicFileNameDisplay');
    if (fileInput.files.length > 0) {
      display.textContent = fileInput.files[0].name;
    }
  };

  var musicUploadForm = document.getElementById('musicUploadForm');
  if (musicUploadForm) {
    musicUploadForm.addEventListener('submit', async function (e) {
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
  } else {
    console.error('❌ musicUploadForm not found - check if element ID exists in HTML');
  }

  window.toggleMusicStatus = async function (id, currentStatus) {
    try {
      var res = await apiFetch('/api/music/' + id + '/toggle', { method: 'PUT', headers: headers() });
      if (!res.ok) throw new Error(res.data.message || 'Failed to update status');
      toast(res.data.message || 'Status updated');
      loadMusicFiles();
    } catch (error) {
      toast('Error: ' + error.message, 'error');
    }
  };

  window.deleteMusic = async function (id) {
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

  window.openMusicEditModal = function (id, title, location) {
    document.getElementById('editMusicId').value = id;
    document.getElementById('editMusicTitle').value = title;
    document.getElementById('editMusicLocation').value = location;
    document.getElementById('musicEditModal').classList.remove('hidden');
  };

  window.closeMusicEditModal = function () {
    document.getElementById('musicEditModal').classList.add('hidden');
  };

  var musicEditForm = document.getElementById('musicEditForm');
  if (musicEditForm) {
    musicEditForm.addEventListener('submit', async function (e) {
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
  } else {
    console.error('❌ musicEditForm not found - check if element ID exists in HTML');
  }

  // ========================================
  // DEPARTMENT INFO FUNCTIONS
  // ========================================

  // Load department info with enhanced statistics
  var departmentPieChart = null;
  var departmentBarChart = null;

  window.loadDepartmentInfo = function () {
    fetch(API + '/api/department-info')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        console.log('Department Info API response:', json);
        if (json.success && json.data) {
          var data = json.data;
          var students = data.totalStudents || 0;
          var faculty = data.totalFaculty || 0;
          var yearLevels = data.yearLevels || 4;
          var subjectsCount = data.subjectsCount || 20;

          // Update main counts - with null checks
          var displayTotalStudents = document.getElementById('displayTotalStudents');
          if (displayTotalStudents) displayTotalStudents.textContent = students;

          var displayTotalFaculty = document.getElementById('displayTotalFaculty');
          if (displayTotalFaculty) displayTotalFaculty.textContent = faculty;

          var displayYearLevels = document.getElementById('displayYearLevels');
          if (displayYearLevels) displayYearLevels.textContent = yearLevels;

          var displaySubjectsCount = document.getElementById('displaySubjectsCount');
          if (displaySubjectsCount) displaySubjectsCount.textContent = subjectsCount;

          // Calculate total members
          var totalMembers = students + faculty;
          var displayTotalMembers = document.getElementById('displayTotalMembers');
          if (displayTotalMembers) displayTotalMembers.textContent = totalMembers;

          // Update coordinator info - with null checks
          var coordName = data.programCoordinator && data.programCoordinator.name ? data.programCoordinator.name : '--';
          var coordEmail = data.programCoordinator && data.programCoordinator.email ? data.programCoordinator.email : '--';

          var displayCoordinatorName = document.getElementById('displayCoordinatorName');
          if (displayCoordinatorName) displayCoordinatorName.textContent = coordName;

          var displayCoordinatorEmail = document.getElementById('displayCoordinatorEmail');
          if (displayCoordinatorEmail) displayCoordinatorEmail.textContent = coordEmail;

          // Calculate ratio
          var ratio = faculty > 0 ? (students / faculty).toFixed(1) + ':1' : '—';
          var displayRatio = document.getElementById('displayRatio');
          if (displayRatio) displayRatio.textContent = ratio;

          // Update timestamp if element exists
          var lastUpdatedInfo = document.getElementById('lastUpdatedInfo');
          if (lastUpdatedInfo && data.updatedAt) {
            var date = new Date(data.updatedAt);
            lastUpdatedInfo.textContent = date.toLocaleString();
          }

          // Store current data for editing
          window.currentDepartmentInfo = data;
        }
      })
      .catch(function (err) {
        console.error('Error loading department info:', err);
      });
  };

  // Open edit department modal
  window.openEditDepartmentModal = function () {
    fetch(API + '/api/department-info')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json.success && json.data) {
          var data = json.data;
          window.currentDepartmentInfo = data;

          document.getElementById('editTotalStudents').value = data.totalStudents || 0;
          document.getElementById('editTotalFaculty').value = data.totalFaculty || 0;
          document.getElementById('editYearLevels').value = data.yearLevels || 4;
          document.getElementById('editSubjectsCount').value = data.subjectsCount || 20;

          if (data.programCoordinator) {
            document.getElementById('editCoordinatorName').value = data.programCoordinator.name || '';
            document.getElementById('editCoordinatorEmail').value = data.programCoordinator.email || '';
          } else {
            document.getElementById('editCoordinatorName').value = '';
            document.getElementById('editCoordinatorEmail').value = '';
          }

          document.getElementById('editDepartmentModal').classList.remove('hidden');
        }
      })
      .catch(function (err) {
        console.error('Error loading department info for edit:', err);
      });
  };

  // Close edit department modal
  window.closeEditDepartmentModal = function () {
    document.getElementById('editDepartmentModal').classList.add('hidden');
  };

  // Update department info
  window.updateDepartmentInfo = function (event) {
    event.preventDefault();

    var submitBtn = document.querySelector('#editDepartmentModal button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';

    var data = {
      totalStudents: parseInt(document.getElementById('editTotalStudents').value) || 0,
      totalFaculty: parseInt(document.getElementById('editTotalFaculty').value) || 0,
      yearLevels: parseInt(document.getElementById('editYearLevels').value) || 4,
      subjectsCount: parseInt(document.getElementById('editSubjectsCount').value) || 20,
      programCoordinator: {
        name: document.getElementById('editCoordinatorName').value,
        email: document.getElementById('editCoordinatorEmail').value
      }
    };

    fetch(API + '/api/department-info', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json.success) {
          toast('Department info updated successfully!', 'success');
          closeEditDepartmentModal();
          loadDepartmentInfo();
        } else {
          alert('Error: ' + (json.error || 'Failed to update'));
        }
      })
      .catch(function (err) {
        console.error('Error updating department info:', err);
        alert('Network error. Please try again.');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-save mr-2"></i>Save Changes';
      });
  };

  // Close modals when clicking outside
  document.addEventListener('click', function (e) {
    if (e.target.id === 'editDepartmentModal') {
      closeEditDepartmentModal();
    }
  });

  // Initialize - show dashboard by default
  document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Admin dashboard initialized');
    // Dashboard section should be visible by default
    var dashboardSection = document.getElementById('section-dashboard');
    if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
      console.log('✅ Dashboard is default section');
    }

    // Load department info when department section is shown
    var departmentSection = document.getElementById('section-department');
    if (departmentSection) {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.attributeName === 'class') {
            if (!departmentSection.classList.contains('hidden')) {
              // Load totals when section becomes visible
              setTimeout(function () {
                loadDepartmentInfo();
              }, 100);
            }
          }
        });
      });
      observer.observe(departmentSection, { attributes: true });
    }
  });

  // ==========================================
  // DEPARTMENT SECTION TABS
  // ==========================================

  // Switch between department totals and documents tabs
  window.switchDeptTab = function (tab) {
    const totalsSection = document.getElementById('deptTotalsSection');
    const docsSection = document.getElementById('deptDocsSection');
    const totalsTab = document.getElementById('deptTotalsTab');
    const docsTab = document.getElementById('deptDocsTab');

    if (tab === 'totals') {
      totalsSection.classList.remove('hidden');
      docsSection.classList.add('hidden');
      totalsTab.classList.add('bg-gradient-to-r', 'from-primary-600', 'to-primary-700', 'text-white', 'shadow-md');
      totalsTab.classList.remove('bg-white', 'text-gray-600');
      docsTab.classList.remove('bg-gradient-to-r', 'from-primary-600', 'to-primary-700', 'text-white', 'shadow-md');
      docsTab.classList.add('bg-white', 'text-gray-600');
      setTimeout(function () { loadDepartmentInfo(); }, 50);
    } else {
      totalsSection.classList.add('hidden');
      docsSection.classList.remove('hidden');
      docsTab.classList.add('bg-gradient-to-r', 'from-primary-600', 'to-primary-700', 'text-white', 'shadow-md');
      docsTab.classList.remove('bg-white', 'text-gray-600');
      totalsTab.classList.remove('bg-gradient-to-r', 'from-primary-600', 'to-primary-700', 'text-white', 'shadow-md');
      totalsTab.classList.add('bg-white', 'text-gray-600');
      loadDepartmentDocuments();
    }
  };

  // ==========================================
  // USER MANAGEMENT FUNCTIONS
  // ==========================================

  // Load users when section is shown
  document.addEventListener('DOMContentLoaded', function () {
    const usersSection = document.getElementById('section-users');
    if (usersSection) {
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.attributeName === 'class') {
            if (!usersSection.classList.contains('hidden')) {
              loadUsers();
            }
          }
        });
      });
      observer.observe(usersSection, { attributes: true });
    }
  });

  // Load department documents when section is shown
  document.addEventListener('DOMContentLoaded', function () {
    const departmentSection = document.getElementById('section-department');
    if (departmentSection) {
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.attributeName === 'class') {
            if (!departmentSection.classList.contains('hidden')) {
              // Default to totals tab when section is shown
              switchDeptTab('totals');
            }
          }
        });
      });
      observer.observe(departmentSection, { attributes: true });
    }
  });

  // Heartbeat to keep session alive and update online status
  let heartbeatInterval;
  function startHeartbeat() {
    // Send heartbeat every 30 seconds
    heartbeatInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (token) {
          await fetch('/api/auth/heartbeat', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 30000); // 30 seconds
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
  }

  // Start heartbeat on page load
  document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('adminToken');
    if (token) {
      startHeartbeat();
    }
  });

  // Auto-refresh user list every 30 seconds when on user management tab
  let userRefreshInterval;
  function startUserAutoRefresh() {
    userRefreshInterval = setInterval(() => {
      const usersSection = document.getElementById('section-users');
      if (usersSection && !usersSection.classList.contains('hidden')) {
        loadUsers();
      }
    }, 30000); // 30 seconds
  }

  // Start auto-refresh on page load
  document.addEventListener('DOMContentLoaded', function () {
    startUserAutoRefresh();
  });

  // Load all users
  window.loadUsers = async function () {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin text-3xl mb-3 text-primary-500"></i><p>Loading users...</p></td></tr>';

    try {
      const token = localStorage.getItem('adminToken');

      // Get current user info to check role
      const userInfoResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userInfo = await userInfoResponse.json();
      const currentUserRole = userInfo.admin ? userInfo.admin.role : 'admin';
      const isSuperAdmin = currentUserRole === 'superadmin';

      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        if (data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No users found</td></tr>';
          return;
        }

        tbody.innerHTML = data.users.map(user => {
          const createdDate = new Date(user.createdAt).toLocaleDateString();
          const statusBadge = user.mustChangePassword
            ? '<span class="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">Must Change Password</span>'
            : '<span class="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Active</span>';

          const currentUserId = data.currentUserId || JSON.parse(atob(token.split('.')[1])).id;
          const isSelf = user._id === currentUserId;

          // Check online status
          let onlineStatus = '';
          let lastSeenText = '';
          if (user.isOnline) {
            onlineStatus = '<span class="flex items-center gap-1.5"><span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span class="text-green-700 text-xs font-semibold">Online</span></span>';
            lastSeenText = '<span class="text-xs text-gray-500">Active now</span>';
          } else if (user.lastActive) {
            const lastActive = new Date(user.lastActive);
            const now = new Date();
            const diffMs = now - lastActive;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 5) {
              onlineStatus = '<span class="flex items-center gap-1.5"><span class="w-2 h-2 bg-yellow-500 rounded-full"></span><span class="text-yellow-700 text-xs font-semibold">Away</span></span>';
              lastSeenText = '<span class="text-xs text-gray-500">Last seen ' + diffMins + ' min ago</span>';
            } else if (diffHours < 1) {
              onlineStatus = '<span class="flex items-center gap-1.5"><span class="w-2 h-2 bg-gray-400 rounded-full"></span><span class="text-gray-600 text-xs font-semibold">Offline</span></span>';
              lastSeenText = '<span class="text-xs text-gray-500">Last seen ' + diffMins + ' min ago</span>';
            } else if (diffDays < 1) {
              onlineStatus = '<span class="flex items-center gap-1.5"><span class="w-2 h-2 bg-gray-400 rounded-full"></span><span class="text-gray-600 text-xs font-semibold">Offline</span></span>';
              lastSeenText = '<span class="text-xs text-gray-500">Last seen ' + diffHours + 'h ago</span>';
            } else {
              onlineStatus = '<span class="flex items-center gap-1.5"><span class="w-2 h-2 bg-gray-400 rounded-full"></span><span class="text-gray-600 text-xs font-semibold">Offline</span></span>';
              lastSeenText = '<span class="text-xs text-gray-500">Last seen ' + diffDays + 'd ago</span>';
            }
          } else {
            onlineStatus = '<span class="flex items-center gap-1.5"><span class="w-2 h-2 bg-gray-400 rounded-full"></span><span class="text-gray-600 text-xs font-semibold">Offline</span></span>';
            lastSeenText = '<span class="text-xs text-gray-500">Never logged in</span>';
          }

          return `
            <tr class="hover:bg-gray-50 transition-colors ${isSelf ? 'bg-blue-50' : ''}">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                      ${user.name.charAt(0).toUpperCase()}
                    </div>
                    ${user.isOnline ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>' : ''}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-gray-800">${user.name}</span>
                      ${isSelf ? '<span class="px-2 py-0.5 rounded-full bg-violet-500 text-white text-xs font-semibold">You</span>' : ''}
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      ${onlineStatus}
                      ${lastSeenText}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-gray-600">${user.email}</td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">${user.role}</span>
              </td>
              <td class="px-6 py-4 text-gray-600">${createdDate}</td>
              <td class="px-6 py-4">${statusBadge}</td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2">
                  <button onclick="openResetPasswordModal('${user._id}', '${user.name}')" class="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium" title="Reset Password">
                    <i class="fa-solid fa-key"></i>
                  </button>
                  ${!isSelf && isSuperAdmin ? `
                    <button onclick="deleteUser('${user._id}', '${user.name}')" class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium" title="Delete User">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  ` : !isSelf && !isSuperAdmin ? `
                    <button onclick="showAccessDenied()" class="px-3 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium" title="Only Super Admin can delete users">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `;
        }).join('');
      } else {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-500">${data.error || 'Failed to load users'}</td></tr>`;
      }
    } catch (error) {
      console.error('Load users error:', error);
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-red-500">Error loading users</td></tr>';
    }
  };

  // Add User Modal Functions
  // Show access denied message
  window.showAccessDenied = function () {
    // Create toast notification
    const toastHtml = `
      <div class="fixed top-4 right-4 z-50 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-4 max-w-md animate-slide-down" id="accessDeniedToast">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <i class="fa-solid fa-shield-halved text-red-500 text-xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-red-800 mb-1">Access Denied</h3>
            <p class="text-sm text-red-700">Only Super Admin can delete user accounts.</p>
            <p class="text-xs text-red-600 mt-1">Please contact your Super Admin if you need to remove a user.</p>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-red-400 hover:text-red-600">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', toastHtml);

    // Auto remove after 5 seconds
    setTimeout(() => {
      const toast = document.getElementById('accessDeniedToast');
      if (toast) toast.remove();
    }, 5000);
  };

  // Delete user function
  window.deleteUser = async function (userId, userName) {
    // Confirm deletion
    const confirmed = confirm(`Are you sure you want to delete ${userName}?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        const toastHtml = `
          <div class="fixed top-4 right-4 z-50 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg shadow-lg p-4 max-w-md animate-slide-down" id="deleteSuccessToast">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <i class="fa-solid fa-check-circle text-emerald-500 text-xl"></i>
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-emerald-800 mb-1">User Deleted</h3>
                <p class="text-sm text-emerald-700">${userName} has been successfully removed.</p>
              </div>
              <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-emerald-400 hover:text-emerald-600">
                <i class="fa-solid fa-times"></i>
              </button>
            </div>
          </div>
        `;

        document.body.insertAdjacentHTML('beforeend', toastHtml);

        setTimeout(() => {
          const toast = document.getElementById('deleteSuccessToast');
          if (toast) toast.remove();
        }, 5000);

        // Reload users list
        loadUsers();
      } else {
        // Show error message
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Error deleting user. Please try again.');
    }
  };

  window.openAddUserModal = function () {
    document.getElementById('addUserModal').classList.remove('hidden');
    document.getElementById('addUserForm').reset();
    document.getElementById('addUserMessage').classList.add('hidden');
  };

  window.closeAddUserModal = function () {
    document.getElementById('addUserModal').classList.add('hidden');
  };

  window.generatePassword = async function () {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/users/generate-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        document.getElementById('userPassword').value = data.password;
      }
    } catch (error) {
      console.error('Generate password error:', error);
    }
  };

  // Add User Form Submit
  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('addUserForm');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const messageDiv = document.getElementById('addUserMessage');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';

        const userData = {
          name: document.getElementById('userName').value,
          email: document.getElementById('userEmail').value,
          password: document.getElementById('userPassword').value,
          role: document.getElementById('userRole').value
        };

        try {
          const token = localStorage.getItem('adminToken');
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
          });

          const data = await response.json();

          if (data.success) {
            messageDiv.className = 'p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl';
            messageDiv.innerHTML = `
              <div class="flex items-start gap-3 text-emerald-800">
                <i class="fa-solid fa-check-circle text-lg"></i>
                <div class="text-sm">
                  <p class="font-semibold mb-1">User created successfully!</p>
                  <p>Temporary Password: <strong class="font-mono">${data.temporaryPassword}</strong></p>
                  <p class="text-xs mt-1">Please provide this password to the user. They will be required to change it on first login.</p>
                </div>
              </div>
            `;
            messageDiv.classList.remove('hidden');
            form.reset();
            loadUsers();

            setTimeout(() => {
              closeAddUserModal();
            }, 5000);
          } else {
            // Check if it's a duplicate email error
            const errorMessage = data.error || 'Failed to create user';
            const isDuplicateEmail = errorMessage.toLowerCase().includes('email') &&
              (errorMessage.toLowerCase().includes('exists') ||
                errorMessage.toLowerCase().includes('already'));

            messageDiv.className = 'p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl';
            messageDiv.innerHTML = `
              <div class="flex items-start gap-3 text-red-800">
                <i class="fa-solid fa-exclamation-circle text-lg mt-0.5"></i>
                <div class="text-sm">
                  <p class="font-semibold mb-1">${isDuplicateEmail ? 'Email Already in Use' : 'Error'}</p>
                  <p>${errorMessage}</p>
                  ${isDuplicateEmail ? '<p class="text-xs mt-1">Please use a different email address or check if the user already exists.</p>' : ''}
                </div>
              </div>
            `;
            messageDiv.classList.remove('hidden');
          }
        } catch (error) {
          console.error('Add user error:', error);
          messageDiv.className = 'p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl';
          messageDiv.innerHTML = `
            <div class="flex items-center gap-3 text-red-800">
              <i class="fa-solid fa-exclamation-circle text-lg"></i>
              <span class="text-sm font-medium">Error creating user</span>
            </div>
          `;
          messageDiv.classList.remove('hidden');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Add User';
        }
      });
    }
  });

  // Reset Password Modal Functions
  window.openResetPasswordModal = function (userId, userName) {
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetUserName').textContent = userName;
    document.getElementById('resetPasswordModal').classList.remove('hidden');
    document.getElementById('resetPasswordForm').reset();
    document.getElementById('resetPasswordMessage').classList.add('hidden');
  };

  window.closeResetPasswordModal = function () {
    document.getElementById('resetPasswordModal').classList.add('hidden');
  };

  window.generateResetPassword = async function () {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/users/generate-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        document.getElementById('resetNewPassword').value = data.password;
      }
    } catch (error) {
      console.error('Generate password error:', error);
    }
  };

  // Reset Password Form Submit
  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('resetPasswordForm');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const messageDiv = document.getElementById('resetPasswordMessage');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting...';

        const userId = document.getElementById('resetUserId').value;
        const newPassword = document.getElementById('resetNewPassword').value;

        try {
          const token = localStorage.getItem('adminToken');
          const response = await fetch(`/api/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newPassword })
          });

          const data = await response.json();

          if (data.success) {
            messageDiv.className = 'p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl';
            messageDiv.innerHTML = `
              <div class="flex items-start gap-3 text-emerald-800">
                <i class="fa-solid fa-check-circle text-lg"></i>
                <div class="text-sm flex-1">
                  <p class="font-semibold mb-2">✅ Password reset successfully!</p>
                  
                  <div class="bg-white border-2 border-emerald-300 rounded-lg p-3 mb-2">
                    <p class="text-xs text-gray-600 mb-1">Temporary Password:</p>
                    <div class="flex items-center gap-2">
                      <code class="text-lg font-bold text-violet-600 flex-1" id="tempPasswordDisplay">${data.temporaryPassword}</code>
                      <button onclick="copyTempPassword('${data.temporaryPassword}')" class="px-3 py-1 bg-violet-500 hover:bg-violet-600 text-white text-xs rounded-lg transition-all">
                        <i class="fa-solid fa-copy"></i> Copy
                      </button>
                    </div>
                  </div>
                  
                  <div class="bg-amber-50 border-l-4 border-amber-500 p-2 rounded-r-lg">
                    <p class="text-xs text-amber-800 font-semibold mb-1">
                      ⚠️ IMPORTANT: You must notify the user!
                    </p>
                    <p class="text-xs text-amber-700">
                      Send this password to the user via email, SMS, or in person. 
                      They will be required to change it on next login.
                    </p>
                  </div>
                  
                  ${data.emailSent ? `
                    <div class="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                      <i class="fa-solid fa-envelope-circle-check"></i>
                      <span>Email notification sent to user!</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
            messageDiv.classList.remove('hidden');
            loadUsers();

            // Don't auto-close so admin can copy the password
            // setTimeout(() => {
            //   closeResetPasswordModal();
            // }, 5000);
          } else {
            messageDiv.className = 'p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl';
            messageDiv.innerHTML = `
              <div class="flex items-center gap-3 text-red-800">
                <i class="fa-solid fa-exclamation-circle text-lg"></i>
                <span class="text-sm font-medium">${data.error || 'Failed to reset password'}</span>
              </div>
            `;
            messageDiv.classList.remove('hidden');
          }
        } catch (error) {
          console.error('Reset password error:', error);
          messageDiv.className = 'p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl';
          messageDiv.innerHTML = `
            <div class="flex items-center gap-3 text-red-800">
              <i class="fa-solid fa-exclamation-circle text-lg"></i>
              <span class="text-sm font-medium">Error resetting password</span>
            </div>
          `;
          messageDiv.classList.remove('hidden');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Reset Password';
        }
      });
    }
  });

  // Delete User Function
  window.deleteUser = async function (userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        showNotification('User deleted successfully', 'success');
        loadUsers();
      } else {
        showNotification(data.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      showNotification('Error deleting user', 'error');
    }
  };

  // ==========================================
  // CHANGE PASSWORD FUNCTIONS
  // ==========================================

  // Toggle Password Visibility
  window.togglePasswordVisibility = function (inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  };

  // Change Password Form Submit with Enhanced Validation
  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('changePasswordForm');
    if (form) {
      // Real-time password strength indicator
      const newPasswordInput = document.getElementById('newPassword');
      if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function () {
          updatePasswordStrengthIndicator(this.value);
        });
      }

      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('changePasswordEmail').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageDiv = document.getElementById('changePasswordMessage');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Enhanced Validation
        if (!email || !email.trim()) {
          showChangePasswordError(messageDiv, 'Please enter your email address');
          return;
        }

        if (newPassword !== confirmPassword) {
          showChangePasswordError(messageDiv, 'New passwords do not match');
          return;
        }

        if (newPassword.length < 8) {
          showChangePasswordError(messageDiv, 'Password must be at least 8 characters long');
          return;
        }

        // Check password strength
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
          showChangePasswordError(messageDiv, 'Password must contain uppercase, lowercase, and numbers');
          return;
        }

        // Check if same as current
        if (currentPassword === newPassword) {
          showChangePasswordError(messageDiv, 'New password must be different from current password');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Changing Password...';

        try {
          const token = localStorage.getItem('adminToken');
          const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, currentPassword, newPassword })
          });

          const data = await response.json();

          if (data.success) {
            messageDiv.className = 'p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl';
            messageDiv.innerHTML = `
              <div class="flex items-center gap-3 text-emerald-800">
                <i class="fa-solid fa-check-circle text-lg"></i>
                <div class="text-sm">
                  <p class="font-semibold">Password changed successfully!</p>
                  <p class="text-xs mt-1">Your password has been updated securely.</p>
                </div>
              </div>
            `;
            messageDiv.classList.remove('hidden');
            form.reset();

            // Hide password strength indicator
            const strengthIndicator = document.getElementById('passwordStrengthIndicator');
            if (strengthIndicator) {
              strengthIndicator.classList.add('hidden');
            }
          } else {
            showChangePasswordError(messageDiv, data.error || 'Failed to change password');
          }
        } catch (error) {
          console.error('Change password error:', error);
          showChangePasswordError(messageDiv, 'Network error. Please try again.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Change Password';
        }
      });
    }
  });

  // Helper function to show error messages
  function showChangePasswordError(messageDiv, errorText) {
    messageDiv.className = 'p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl';
    messageDiv.innerHTML = `
      <div class="flex items-center gap-3 text-red-800">
        <i class="fa-solid fa-exclamation-circle text-lg"></i>
        <span class="text-sm font-medium">${errorText}</span>
      </div>
    `;
    messageDiv.classList.remove('hidden');
  }

  // Copy temporary password to clipboard
  window.copyTempPassword = function (password) {
    navigator.clipboard.writeText(password).then(() => {
      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-check-circle"></i>
          <span class="font-medium">Password copied to clipboard!</span>
        </div>
      `;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.remove();
      }, 3000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy password. Please copy manually.');
    });
  };

  // Password strength indicator
  function updatePasswordStrengthIndicator(password) {
    const strengthIndicator = document.getElementById('passwordStrengthIndicator');
    if (!strengthIndicator) return;

    if (password.length === 0) {
      strengthIndicator.classList.add('hidden');
      return;
    }

    strengthIndicator.classList.remove('hidden');

    let strength = 0;
    let strengthText = '';
    let strengthColor = '';
    let strengthWidth = '0%';

    // Calculate strength
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // Set strength level
    if (strength <= 2) {
      strengthText = 'Weak';
      strengthColor = 'bg-red-500';
      strengthWidth = '33%';
    } else if (strength <= 4) {
      strengthText = 'Medium';
      strengthColor = 'bg-amber-500';
      strengthWidth = '66%';
    } else {
      strengthText = 'Strong';
      strengthColor = 'bg-emerald-500';
      strengthWidth = '100%';
    }

    strengthIndicator.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-semibold text-gray-600">Password Strength:</span>
        <span class="text-xs font-bold ${strengthColor === 'bg-emerald-500' ? 'text-emerald-600' : strengthColor === 'bg-amber-500' ? 'text-amber-600' : 'text-red-600'}">${strengthText}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="${strengthColor} h-2 rounded-full transition-all duration-300" style="width: ${strengthWidth}"></div>
      </div>
    `;
  }

  // ==========================================
  // DEPARTMENT DOCUMENTS MANAGEMENT
  // ==========================================

  // Load all documents
  window.loadDepartmentDocuments = async function () {
    console.log('🚀 === loadDepartmentDocuments STARTED ===');
    const tbody = document.getElementById('documentsTableBody');

    if (!tbody) {
      console.error('❌ tbody not found!');
      return;
    }

    // Get selected category from active button
    const activeBtn = document.querySelector('.category-btn.bg-primary-600');
    const category = activeBtn ? activeBtn.getAttribute('data-category') : 'All';
    console.log('📂 Category selected:', category);
    console.log('🎯 Active button:', activeBtn);

    tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin text-3xl mb-3 text-primary-500"></i><p>Loading documents...</p></td></tr>';

    try {
      const token = localStorage.getItem('adminToken');
      console.log('🔑 Token exists:', token ? 'YES' : 'NO');
      
      // Only add category param if not "All"
      const url = category && category !== 'All'
        ? `/api/department-documents?category=${category}`
        : '/api/department-documents';
      console.log('🔗 Fetching URL:', url);

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('📥 Response status:', response.status);
      console.log('📥 Response OK:', response.ok);

      const data = await response.json();
      console.log('📄 Data received:', data);
      console.log('📄 Data.success:', data.success);
      console.log('📄 Documents count:', data.documents ? data.documents.length : 'N/A');

      if (data.success) {
        if (data.documents.length === 0) {
          console.log('⚠️ No documents found');
          tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">No documents found</td></tr>';
          return;
        }

        console.log('✅ Rendering', data.documents.length, 'documents');
        tbody.innerHTML = data.documents.map(doc => {
          const date = new Date(doc.dateIssued).toLocaleDateString();
          
          // Status badges like Grade Portal
          const publishedBadge = doc.isPublished
            ? '<span class="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Yes</span>'
            : '<span class="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">No</span>';

          const activeBadge = doc.isActive !== false
            ? '<span class="px-2 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">Active</span>'
            : '<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">Inactive</span>';

          // File type icon
          let typeIcon = '<i class="fa-solid fa-file text-gray-400 text-lg"></i>';
          if (doc.contentType === 'file') {
            if (doc.fileType === 'pdf') typeIcon = '<i class="fa-solid fa-file-pdf text-red-500 text-lg"></i>';
            else if (doc.fileType === 'doc' || doc.fileType === 'docx') typeIcon = '<i class="fa-solid fa-file-word text-blue-500 text-lg"></i>';
            else if (doc.fileType === 'jpg' || doc.fileType === 'jpeg' || doc.fileType === 'png') typeIcon = '<i class="fa-solid fa-file-image text-green-500 text-lg"></i>';
          } else {
            typeIcon = '<i class="fa-solid fa-file-lines text-amber-500 text-lg"></i>';
          }

          // Truncate description for display
          const shortDesc = doc.description && doc.description.length > 50 
            ? doc.description.substring(0, 50) + '...' 
            : (doc.description || 'No description');

          return `
            <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100">
              <td class="px-6 py-4">
                <div class="flex items-start gap-3">
                  ${doc.isPinned ? '<i class="fa-solid fa-thumbtack text-violet-500 mt-1"></i>' : ''}
                  <div>
                    <div class="font-semibold text-gray-800 text-sm">${doc.title}</div>
                    <div class="text-xs text-gray-500 mt-0.5 max-w-xs">${shortDesc}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-medium">${doc.category}</span>
              </td>
              <td class="px-6 py-4 text-center">${typeIcon}</td>
              <td class="px-6 py-4 text-center text-sm text-gray-600">${date}</td>
              <td class="px-6 py-4 text-center">${publishedBadge}</td>
              <td class="px-6 py-4 text-center">${activeBadge}</td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-1">
                  <button onclick="viewDocument('${doc._id}')" class="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 flex items-center justify-center transition-colors" title="View">
                    <i class="fa-solid fa-eye text-xs"></i>
                  </button>
                  <button onclick="editDocument('${doc._id}')" class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors" title="Edit">
                    <i class="fa-solid fa-pen text-xs"></i>
                  </button>
                  <button onclick="deleteDocument('${doc._id}', '${doc.title.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors" title="Delete">
                    <i class="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
        console.log('✅ Documents rendered successfully');
      } else {
        console.error('❌ API returned success: false');
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-red-500">Error: ' + (data.error || 'Unknown error') + '</td></tr>';
      }
    } catch (err) {
      console.error('❌❌❌ Load documents error:', err);
      console.error('❌ Error name:', err.name);
      console.error('❌ Error message:', err.message);
      tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-red-500">Error loading documents: ' + err.message + '</td></tr>';
    }
    console.log('🏁 === loadDepartmentDocuments FINISHED ===');
  };

  // Open upload modal
  window.openUploadDocumentModal = function () {
    document.getElementById('uploadDocumentModal').classList.remove('hidden');
    document.getElementById('uploadDocumentForm').reset();
    document.getElementById('uploadDocumentMessage').classList.add('hidden');
    switchContentType('file');
  };

  // Close upload modal
  window.closeUploadDocumentModal = function () {
    document.getElementById('uploadDocumentModal').classList.add('hidden');
  };

  // Close edit document modal
  window.closeEditDocumentModal = function () {
    document.getElementById('editDocumentModal').classList.add('hidden');
  };

  // Handle edit document form submission
  const editDocumentForm = document.getElementById('editDocumentForm');
  if (editDocumentForm) {
    editDocumentForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      
      const docId = document.getElementById('editDocId').value;
      const messageDiv = document.getElementById('editDocumentMessage');
      const submitBtn = this.querySelector('button[type="submit"]');
      
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
      
      try {
        const token = localStorage.getItem('adminToken');
        const formData = {
          title: document.getElementById('editDocTitle').value,
          description: document.getElementById('editDocDescription').value,
          category: document.getElementById('editDocCategory').value,
          dateIssued: document.getElementById('editDocDate').value,
          isPublished: document.getElementById('editIsPublished').checked,
          isPinned: document.getElementById('editIsPinned').checked
        };
        
        const response = await fetch(`/api/department-documents/${docId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          messageDiv.className = 'p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl';
          messageDiv.innerHTML = `
            <div class="flex items-center gap-3 text-emerald-800">
              <i class="fa-solid fa-check-circle text-lg"></i>
              <span class="text-sm font-medium">Document updated successfully!</span>
            </div>
          `;
          messageDiv.classList.remove('hidden');
          
          setTimeout(() => {
            closeEditDocumentModal();
            loadDepartmentDocuments();
          }, 1500);
        } else {
          messageDiv.className = 'p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl';
          messageDiv.innerHTML = `
            <div class="flex items-center gap-3 text-red-800">
              <i class="fa-solid fa-exclamation-circle text-lg"></i>
              <span class="text-sm font-medium">${data.error || 'Update failed'}</span>
            </div>
          `;
          messageDiv.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Edit error:', error);
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
        submitBtn.innerHTML = '<i class="fa-solid fa-save mr-2"></i>Save Changes';
      }
    });
  }

  // Switch content type
  window.switchContentType = function (type) {
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
  window.handleFileSelect = function (input) {
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
  window.clearFile = function () {
    document.getElementById('documentFile').value = '';
    document.getElementById('filePreview').classList.add('hidden');
  };

  // Toggle custom category input
  window.toggleCustomCategory = function () {
    const categorySelect = document.getElementById('docCategory');
    const customSection = document.getElementById('customCategorySection');
    const customInput = document.getElementById('customCategory');

    if (categorySelect.value === 'Other') {
      customSection.classList.remove('hidden');
      customInput.required = true;
    } else {
      customSection.classList.add('hidden');
      customInput.required = false;
      customInput.value = '';
    }
  };

  // Toggle publish status
  window.togglePublishDocument = async function (docId) {
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

  // Toggle active status
  window.toggleActiveDocument = async function (docId) {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/department-documents/${docId}/active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        loadDepartmentDocuments();
      } else {
        alert(data.error || 'Failed to update active status');
      }
    } catch (error) {
      console.error('Toggle active error:', error);
      alert('Error updating active status');
    }
  };

          // Edit document - open edit modal with document data
  window.editDocument = async function (docId) {
    const token = localStorage.getItem('adminToken');
    
    try {
      // Fetch document data
      const response = await fetch(`/api/department-documents/${docId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!data.success) {
        alert('Failed to load document for editing');
        return;
      }
      
      const doc = data.document;
      
      // Populate edit form
      document.getElementById('editDocId').value = docId;
      document.getElementById('editDocTitle').value = doc.title;
      document.getElementById('editDocDescription').value = doc.description || '';
      document.getElementById('editDocCategory').value = doc.category;
      document.getElementById('editDocDate').value = doc.dateIssued ? doc.dateIssued.split('T')[0] : '';
      document.getElementById('editIsPublished').checked = doc.isPublished;
      document.getElementById('editIsPinned').checked = doc.isPinned;
      
      // Show modal
      document.getElementById('editDocumentModal').classList.remove('hidden');
    } catch (error) {
      console.error('Edit document error:', error);
      alert('Error loading document for editing');
    }
  };

  // Delete document
  window.deleteDocument = async function (docId, title) {
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

  // View document with comments
  window.viewDocument = async function (docId) {
    const modal = document.getElementById('documentViewerModal');
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`/api/department-documents/${docId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const doc = data.document;
        const date = new Date(doc.dateIssued).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Build comments HTML with delete buttons
        const commentsHtml = doc.comments && doc.comments.length > 0 ?
          doc.comments.map((comment, idx) => `
            <div class="p-4 bg-white rounded-xl border border-gray-200 mb-3" id="admin-comment-${comment._id}">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <p class="font-semibold text-gray-800">${comment.userName}</p>
                  <p class="text-sm text-gray-500">${new Date(comment.createdAt).toLocaleString()}</p>
                </div>
                <button onclick="deleteComment('${docId}', '${comment._id}')" class="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium" title="Delete Comment">
                  <i class="fa-solid fa-trash"></i> Delete
                </button>
              </div>
              <p class="text-gray-700">${comment.comment}</p>
              
              <!-- Replies -->
              ${comment.replies && comment.replies.length > 0 ? `
                <div class="ml-4 mt-3 space-y-2 border-l-2 border-gray-100 pl-4">
                  ${comment.replies.map((reply, rIdx) => `
                    <div class="p-3 bg-gray-50 rounded-lg" id="admin-reply-${comment._id}-${rIdx}">
                      <div class="flex items-center justify-between mb-1">
                        <p class="font-semibold text-gray-700 text-sm">${reply.userName}</p>
                        <span class="text-xs text-gray-500">${new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                      <p class="text-gray-600 text-sm">${reply.comment}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('') :
          '<p class="text-gray-500 text-center py-8">No comments yet</p>';

        modal.innerHTML = `
          <div class="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div class="sticky top-0 bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 px-8 py-6 rounded-t-3xl flex items-start justify-between z-10">
              <div class="text-white">
                <h2 class="text-2xl font-bold mb-2">${doc.title}</h2>
                <div class="flex flex-wrap gap-4 text-sm text-white/90">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-calendar-alt"></i>
                    <span>${date}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-eye"></i>
                    <span>${doc.viewCount || 0} views</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-download"></i>
                    <span>${doc.downloadCount || 0} downloads</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-comments"></i>
                    <span>${doc.comments?.length || 0} comments</span>
                  </div>
                </div>
              </div>
              <button onclick="closeDocumentModal()" class="w-12 h-12 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all ml-4 group">
                <i class="fa-solid fa-times text-white text-lg group-hover:scale-110 transition-transform"></i>
              </button>
            </div>
            <div class="p-8">
              ${doc.description ? `
                <div class="mb-6 p-5 bg-violet-50 rounded-2xl border-l-4 border-violet-500">
                  <p class="text-gray-700">${doc.description}</p>
                </div>
              ` : ''}
              <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Comments (${doc.comments?.length || 0})</h3>
                ${commentsHtml}
              </div>
            </div>
          </div>
        `;

        modal.classList.remove('hidden');
      }
    } catch (error) {
      console.error('View document error:', error);
      alert('Failed to load document');
    }
  };

  // Close document modal
  window.closeDocumentModal = function () {
    document.getElementById('documentViewerModal').classList.add('hidden');
  };

  // Delete comment
  window.deleteComment = async function (docId, commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`/api/department-documents/${docId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        // Remove from UI
        const commentEl = document.getElementById(`admin-comment-${commentId}`);
        if (commentEl) commentEl.remove();

        // Reload documents table to update comment count
        loadDocuments();
      } else {
        alert('Failed to delete comment: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      alert('Error deleting comment. Please try again.');
    }
  };

  // Upload document form handler
  const uploadForm = document.getElementById('uploadDocumentForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const messageDiv = document.getElementById('uploadDocumentMessage');
      const submitBtn = this.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Uploading...';

      try {
        const token = localStorage.getItem('adminToken');
        const formData = new FormData();

        // Get category - use custom if "Other" is selected
        const categorySelect = document.getElementById('docCategory');
        const category = categorySelect.value === 'Other'
          ? document.getElementById('customCategory').value
          : categorySelect.value;

        formData.append('title', document.getElementById('docTitle').value);
        formData.append('category', category);
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

  // Category filter - new button-based
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('click', function(e) {
      if (e.target.classList.contains('category-btn')) {
        // Remove active class from all buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
          btn.classList.remove('bg-primary-600', 'text-white');
          btn.classList.add('bg-gray-100', 'text-gray-600');
        });
        // Add active class to clicked button
        e.target.classList.remove('bg-gray-100', 'text-gray-600');
        e.target.classList.add('bg-primary-600', 'text-white');
        
        loadDepartmentDocuments();
      }
    });
  }

  // Search functionality
  const documentsSearch = document.getElementById('documentsSearch');
  if (documentsSearch) {
    documentsSearch.addEventListener('input', function (e) {
      const searchTerm = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#documentsTableBody tr');

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });
  }

})();
