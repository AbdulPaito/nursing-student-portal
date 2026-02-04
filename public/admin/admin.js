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
  document.querySelectorAll('.admin-sidebar .nav-link[data-section]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href') === '#') e.preventDefault();
      var section = this.getAttribute('data-section');
      document.querySelectorAll('.admin-section').forEach(function(s) { s.classList.add('d-none'); });
      var panel = document.getElementById('section-' + section);
      if (panel) panel.classList.remove('d-none');
      document.querySelectorAll('.admin-sidebar .nav-link').forEach(function(n) { n.classList.remove('active'); });
      this.classList.add('active');
      if (sidebar && window.innerWidth < 992) { sidebar.classList.remove('show'); if (sidebarBackdrop) sidebarBackdrop.classList.remove('show'); }
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
  function setSubjectsLoading(on) {
    if (subjectsLoading) subjectsLoading.classList.toggle('d-none', !on);
    if (subjectsTableWrap) subjectsTableWrap.classList.toggle('d-none', on);
  }
  async function loadDailySubjects() {
    setSubjectsLoading(true);
    try {
      var res = await apiFetch('/api/daily-subjects');
      var raw = res.data;
      var list = Array.isArray(raw) ? raw : (raw && raw.data ? raw.data : []);
      dailySubjectsFlat = [];
      list.forEach(function(doc) {
        var subs = Array.isArray(doc.subjects) ? doc.subjects : [];
        subs.forEach(function(s, i) {
          dailySubjectsFlat.push({ docId: doc._id, subjectIndex: i, dayOfWeek: doc.dayOfWeek || '', name: s.name || '', type: s.type || 'Theory', itemsNeeded: Array.isArray(s.itemsNeeded) ? s.itemsNeeded : [] });
        });
      });
      renderDailySubjects();
    } catch (err) {
      if (subjectsTableBody) subjectsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Failed to load.</td></tr>';
      toast('Failed to load subjects', 'error');
    }
    setSubjectsLoading(false);
  }
  function renderDailySubjects() {
    if (!subjectsTableBody) return;
    subjectsTableBody.innerHTML = dailySubjectsFlat.length ? dailySubjectsFlat.map(function(s, idx) {
      var badge = s.type === 'Lab' ? 'badge-lab' : s.type === 'Seminar' ? 'badge-seminar' : 'badge-theory';
      var items = Array.isArray(s.itemsNeeded) ? s.itemsNeeded : [];
      return '<tr><td>' + escapeHtml(s.dayOfWeek) + '</td><td>' + escapeHtml(s.name) + '</td><td><span class="badge ' + badge + '">' + escapeHtml(s.type) + '</span></td><td>' + (items.length ? items.map(escapeHtml).join(', ') : '—') + '</td><td><button class="btn btn-sm btn-edit me-1" onclick="window.editSubject(' + idx + ')">Edit</button><button class="btn btn-sm btn-delete" onclick="window.deleteSubject(\'' + s.docId + '\',' + s.subjectIndex + ')">Delete</button></td></tr>';
    }).join('') : '<tr><td colspan="5" class="text-center text-muted">No subjects.</td></tr>';
  }

  var subjectNameSelect = document.getElementById('subjectNameSelect');
  var subjectNameOtherWrap = document.getElementById('subjectNameOtherWrap');
  var subjectNameOther = document.getElementById('subjectNameOther');
  if (subjectNameSelect) {
    subjectNameSelect.addEventListener('change', function() {
      if (subjectNameOtherWrap) subjectNameOtherWrap.classList.toggle('d-none', this.value !== 'Other');
      if (subjectNameOther) subjectNameOther.value = '';
    });
  }
  function getSubjectNameValue() {
    var sel = document.getElementById('subjectNameSelect');
    var other = document.getElementById('subjectNameOther');
    if (!sel) return (subjectNameOther && subjectNameOther.value) || '';
    return sel.value === 'Other' ? (other ? other.value.trim() : '') : (sel.value || '');
  }
  function setSubjectNameValue(name) {
    var sel = document.getElementById('subjectNameSelect');
    var other = document.getElementById('subjectNameOther');
    if (!sel) return;
    var opts = Array.from(sel.options).map(function(o) { return o.value; });
    if (name && opts.indexOf(name) >= 0) { sel.value = name; if (subjectNameOtherWrap) subjectNameOtherWrap.classList.add('d-none'); if (other) other.value = ''; }
    else { sel.value = 'Other'; if (subjectNameOtherWrap) subjectNameOtherWrap.classList.remove('d-none'); if (other) other.value = name || ''; }
  }
  window.openSubjectForm = function() {
    document.getElementById('subjectModalTitle').textContent = 'Add Subject';
    document.getElementById('subjectDocId').value = '';
    document.getElementById('subjectIndex').value = '';
    document.getElementById('subjectDay').value = 'Monday';
    setSubjectNameValue('');
    document.getElementById('subjectType').value = 'Theory';
    document.getElementById('subjectItems').value = '';
  };
  window.editSubject = function(idx) {
    var s = dailySubjectsFlat[idx];
    if (!s) return;
    document.getElementById('subjectModalTitle').textContent = 'Edit Subject';
    document.getElementById('subjectDocId').value = s.docId;
    document.getElementById('subjectIndex').value = s.subjectIndex;
    document.getElementById('subjectDay').value = s.dayOfWeek;
    setSubjectNameValue(s.name || '');
    document.getElementById('subjectType').value = s.type || 'Theory';
    document.getElementById('subjectItems').value = (s.itemsNeeded && Array.isArray(s.itemsNeeded) && s.itemsNeeded.length) ? s.itemsNeeded.join('\n') : '';
    new bootstrap.Modal(document.getElementById('subjectModal')).show();
  };

  var subjectSaveBtn = document.getElementById('subjectSaveBtn');
  subjectSaveBtn.addEventListener('click', async function() {
    var docId = document.getElementById('subjectDocId').value;
    var subjectIndex = document.getElementById('subjectIndex').value;
    var dayOfWeek = document.getElementById('subjectDay').value;
    var name = getSubjectNameValue();
    var type = document.getElementById('subjectType').value;
    var itemsNeeded = (document.getElementById('subjectItems').value || '').split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
    if (!name) { toast('Please enter or select a subject name.', 'error'); subjectSaveBtn.disabled = false; subjectSaveBtn.textContent = 'Save'; return; }
    subjectSaveBtn.disabled = true;
    subjectSaveBtn.textContent = 'Saving...';
    try {
      if (!docId) {
        var res = await apiFetch('/api/daily-subjects', { method: 'POST', headers: headers(), body: JSON.stringify({ dayOfWeek: dayOfWeek, subject: { name: name, type: type, itemsNeeded: itemsNeeded } }) });
        if (!res.ok) throw new Error(res.data.error || 'Save failed');
      } else {
        var listRes = await apiFetch('/api/daily-subjects');
        var list = Array.isArray(listRes.data) ? listRes.data : (listRes.data && listRes.data.data ? listRes.data.data : []);
        var doc = list.find(function(d) { return d._id === docId; });
        if (!doc) throw new Error('Document not found');
        var subjects = Array.isArray(doc.subjects) ? doc.subjects : [];
        var idx = parseInt(subjectIndex, 10);
        if (idx < 0 || idx >= subjects.length) throw new Error('Invalid subject index');
        subjects[idx] = { name: name, type: type, itemsNeeded: itemsNeeded };
        doc.subjects = subjects;
        var res = await apiFetch('/api/daily-subjects/' + docId, { method: 'PUT', headers: headers(), body: JSON.stringify({ dayOfWeek: doc.dayOfWeek, subjects: doc.subjects }) });
        if (!res.ok) throw new Error(res.data.error || 'Save failed');
      }
      bootstrap.Modal.getInstance(document.getElementById('subjectModal')).hide();
      toast('Saved.');
      loadDailySubjects();
      loadDashboard();
    } catch (err) {
      toast(err.message || 'Failed to save.', 'error');
    }
    subjectSaveBtn.disabled = false;
    subjectSaveBtn.textContent = 'Save';
  });

  window.deleteSubject = async function(docId, subjectIndex) {
    var ok = await confirmDelete('Delete this subject?');
    if (!ok) return;
    try {
      var res = await apiFetch('/api/daily-subjects/' + docId + '?subjectIndex=' + subjectIndex, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error(res.data.error || 'Delete failed');
      toast(res.data.message || 'Deleted.');
      loadDailySubjects();
      loadDashboard();
    } catch (err) { toast(err.message || 'Failed to delete.', 'error'); }
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
  loadDailySubjects();
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

  // Load music when music section is active
  document.addEventListener('DOMContentLoaded', function() {
    var musicSection = document.querySelector('[data-section="music"]');
    if (musicSection) {
      musicSection.addEventListener('click', function() {
        loadMusicFiles();
      });
    }
  });
})();
