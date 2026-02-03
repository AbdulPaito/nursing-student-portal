(function() {
  'use strict';
  const API = '';

  function getToken() { return localStorage.getItem('adminToken'); }
  function headers() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }; }

  // Auth check
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
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const id = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-primary';
    const icon = type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-circle' : 'bi-info-circle';
    
    container.insertAdjacentHTML('beforeend', `
      <div id="${id}" class="${bgClass} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in-right">
        <i class="bi ${icon} text-xl"></i>
        <span class="font-medium">${escapeHtml(message)}</span>
        <button onclick="this.parentElement.remove()" class="ml-2 text-white/70 hover:text-white">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `);
    
    const el = document.getElementById(id);
    setTimeout(() => {
      if (el && el.parentNode) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        setTimeout(() => el.remove(), 300);
      }
    }, 4000);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // Modal functions
  window.openModal = function(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.body.style.overflow = '';
  };

  // Confirm delete
  let confirmDeleteResolve;
  const confirmModal = document.getElementById('confirmDeleteModal');
  const confirmMessage = document.getElementById('confirmDeleteMessage');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
      const resolve = confirmDeleteResolve;
      confirmDeleteResolve = null;
      if (resolve) resolve(true);
      closeModal('confirmDeleteModal');
    });
  }

  function confirmDelete(msg) {
    if (!confirmModal) return Promise.resolve(confirm(msg || 'Delete this item?'));
    confirmMessage.textContent = msg || 'Are you sure you want to delete this item?';
    return new Promise(function(resolve) {
      confirmDeleteResolve = resolve;
      openModal('confirmDeleteModal');
      confirmModal.addEventListener('hidden', function once() {
        confirmModal.removeEventListener('hidden', once);
        if (confirmDeleteResolve) { confirmDeleteResolve(false); confirmDeleteResolve = null; }
      }, { once: true });
    });
  }

  // API helper
  function apiFetch(url, options) {
    options = options || {};
    options.headers = options.headers || headers();
    return fetch(API + url, options).then(function(r) {
      if (r.status === 401) { 
        localStorage.removeItem('adminToken'); 
        localStorage.removeItem('adminUser'); 
        window.location.href = '/admin/login'; 
        return { ok: false, data: null }; 
      }
      return r.json().then(function(data) { return { ok: r.ok, status: r.status, data: data }; });
    });
  }

  // Sidebar
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  function toggleSidebar() {
    sidebar.classList.toggle('-translate-x-full');
    sidebarBackdrop.classList.toggle('hidden');
  }

  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
  if (sidebarClose) sidebarClose.addEventListener('click', toggleSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', toggleSidebar);

  // Section switching
  document.querySelectorAll('.sidebar-link[data-section]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href') === '#') e.preventDefault();
      const section = this.dataset.section;
      
      document.querySelectorAll('.admin-section').forEach(function(s) { 
        s.classList.add('hidden'); 
      });
      
      const panel = document.getElementById('section-' + section);
      if (panel) panel.classList.remove('hidden');
      
      document.querySelectorAll('.sidebar-link').forEach(function(n) { 
        n.classList.remove('active'); 
      });
      this.classList.add('active');
      
      if (window.innerWidth < 1024) toggleSidebar();
    });
  });

  // Logout
  document.getElementById('logoutLink').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  });

  // Dashboard Stats with Animation
  function animateCounter(element, target, duration = 1000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current);
    }, 16);
  }

  let analyticsChartInstance = null;
  const recentActivityList = document.getElementById('recentActivityList');

  async function loadDashboard() {
    try {
      const [eventsRes, subjectsRes, announcementsRes] = await Promise.all([
        apiFetch('/api/events'),
        apiFetch('/api/daily-subjects'),
        apiFetch('/api/announcements')
      ]);

      const events = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      const dailySubjects = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];
      const announcements = Array.isArray(announcementsRes.data) ? announcementsRes.data : [];

      // Animate counters
      animateCounter(document.getElementById('statEvents'), events.length);
      animateCounter(document.getElementById('statSubjects'), dailySubjects.length);
      animateCounter(document.getElementById('statAnnouncements'), announcements.length);

      const today = new Date().toISOString().split('T')[0];
      const upcoming = events.filter(function(e) { return e.date >= today; })
                             .sort(function(a, b) { return a.date.localeCompare(b.date); });
      
      const nextEl = document.getElementById('statNextEventName');
      const dateEl = document.getElementById('statNextEventDate');
      
      if (nextEl) nextEl.textContent = upcoming.length ? upcoming[0].title : '—';
      if (dateEl) dateEl.textContent = upcoming.length ? upcoming[0].date : 'No upcoming events';

      // Recent Activity
      let activity = [];
      events.slice(0, 5).forEach(function(e) { 
        activity.push({ type: 'event', text: e.title, date: e.date, icon: 'bi-calendar-event', color: 'bg-blue-100 text-blue-600' }); 
      });
      
      dailySubjects.forEach(function(d) {
        (d.subjects || []).slice(0, 2).forEach(function(s) { 
          activity.push({ type: 'subject', text: d.dayOfWeek + ': ' + s.name, date: d.dayOfWeek, icon: 'bi-journal-bookmark', color: 'bg-green-100 text-green-600' }); 
        });
      });

      activity = activity.slice(0, 10);
      
      if (recentActivityList) {
        recentActivityList.innerHTML = activity.length
          ? activity.map(function(a) { 
              return `
                <li class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div class="w-10 h-10 rounded-full ${a.color} flex items-center justify-center flex-shrink-0">
                    <i class="bi ${a.icon}"></i>
                  </div>
                  <div class="flex-grow min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${escapeHtml(a.text)}</p>
                    <p class="text-xs text-gray-500">${escapeHtml(a.type)} • ${escapeHtml(a.date)}</p>
                  </div>
                </li>
              `; 
            }).join('')
          : '<li class="text-gray-500 py-4 text-center">No recent activity. Add events or subjects.</li>';
      }

      renderAnalyticsChart(events, dailySubjects, announcements);
    } catch (err) { 
      console.error(err); 
      if (recentActivityList) recentActivityList.innerHTML = '<li class="text-gray-500 py-4 text-center">Could not load activity.</li>'; 
    }
  }

  function renderAnalyticsChart(events, dailySubjects, announcements) {
    const canvas = document.getElementById('analyticsChart');
    if (!canvas || typeof Chart === 'undefined') return;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function buildMonthlyCounts(list) {
      const counts = new Array(12).fill(0);
      (list || []).forEach(function(item) {
        if (!item.date) return;
        const m = parseInt(item.date.substring(5, 7), 10) - 1;
        if (m >= 0 && m < 12) counts[m]++;
      });
      return counts;
    }

    const eventsPerMonth = buildMonthlyCounts(events);
    const announcementsPerMonth = buildMonthlyCounts(announcements);
    
    if (analyticsChartInstance) analyticsChartInstance.destroy();
    
    analyticsChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Events',
            data: eventsPerMonth,
            backgroundColor: 'rgba(30, 144, 255, 0.8)',
            borderColor: '#1E90FF',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Announcements',
            data: announcementsPerMonth,
            backgroundColor: 'rgba(34, 139, 34, 0.7)',
            borderColor: '#228B22',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { usePointStyle: true, padding: 20 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // Events CRUD
  let eventsList = [];
  const eventsTableBody = document.getElementById('eventsTableBody');
  const eventsTableWrap = document.getElementById('eventsTableWrap');
  const eventsLoading = document.getElementById('eventsLoading');

  function setEventsLoading(on) {
    if (eventsLoading) eventsLoading.classList.toggle('hidden', !on);
    if (eventsTableWrap) eventsTableWrap.classList.toggle('hidden', on);
  }

  async function loadEvents() {
    setEventsLoading(true);
    try {
      const res = await apiFetch('/api/events');
      eventsList = Array.isArray(res.data) ? res.data : [];
      renderEvents(eventsList);
    } catch (err) {
      if (eventsTableBody) eventsTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Failed to load.</td></tr>';
      toast('Failed to load events', 'error');
    }
    setEventsLoading(false);
  }

  function renderEvents(list) {
    const q = (document.getElementById('eventsSearch') && document.getElementById('eventsSearch').value || '').toLowerCase();
    const filtered = q ? list.filter(function(e) { return (e.title || '').toLowerCase().includes(q); }) : list;
    
    if (!eventsTableBody) return;
    
    eventsTableBody.innerHTML = filtered.length ? filtered.map(function(e) {
      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4 text-sm text-gray-800 font-medium">${escapeHtml(e.title)}</td>
          <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(e.date)}</td>
          <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(e.time)}</td>
          <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(e.location || '')}</td>
          <td class="px-6 py-4 text-sm text-gray-600">${e.items && e.items.length ? e.items.map(escapeHtml).join(', ') : '—'}</td>
          <td class="px-6 py-4 text-sm">
            <button class="btn-action bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30 mr-2" onclick="editEvent('${escapeHtml(e._id)}')">
              <i class="bi bi-pencil"></i>Edit
            </button>
            <button class="btn-action bg-red-500 hover:bg-red-600 text-white shadow-red-500/30" onclick="deleteEvent('${escapeHtml(e._id)}')">
              <i class="bi bi-trash"></i>Delete
            </button>
          </td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No events.</td></tr>';
  }

  if (document.getElementById('eventsSearch')) {
    document.getElementById('eventsSearch').addEventListener('input', function() { renderEvents(eventsList); });
  }

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
    openModal('eventModal');
  };

  window.editEvent = function(id) {
    const e = eventsList.find(function(x) { return x._id === id; });
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
    
    openModal('eventModal');
  };

  const eventSaveBtn = document.getElementById('eventSaveBtn');
  if (eventSaveBtn) {
    eventSaveBtn.addEventListener('click', async function() {
      const id = document.getElementById('eventId').value;
      const body = {
        title: document.getElementById('eventTitle').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        category: (document.getElementById('eventCategory') && document.getElementById('eventCategory').value) || '',
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value.trim(),
        items: (document.getElementById('eventItems').value || '').split('\n').map(function(s) { return s.trim(); }).filter(Boolean)
      };
      
      eventSaveBtn.disabled = true;
      eventSaveBtn.innerHTML = '<div class="spinner spinner-sm border-white border-t-transparent mr-2"></div>Saving...';
      
      try {
        const res = await apiFetch('/api/events' + (id ? '/' + id : ''), { 
          method: id ? 'PUT' : 'POST', 
          headers: headers(), 
          body: JSON.stringify(body) 
        });
        
        if (!res.ok) throw new Error(res.data.error || 'Save failed');
        
        closeModal('eventModal');
        toast(res.data.message || 'Saved successfully!');
        loadEvents();
        loadDashboard();
      } catch (err) {
        toast(err.message || 'Failed to save.', 'error');
      }
      
      eventSaveBtn.disabled = false;
      eventSaveBtn.innerHTML = 'Save Event';
    });
  }

  window.deleteEvent = async function(id) {
    const ok = await confirmDelete('Delete this event?');
    if (!ok) return;
    
    try {
      const res = await apiFetch('/api/events/' + id, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error(res.data.error || 'Delete failed');
      toast(res.data.message || 'Deleted successfully!');
      loadEvents();
      loadDashboard();
    } catch (err) { 
      toast(err.message || 'Failed to delete.', 'error'); 
    }
  };

  // Daily Subjects CRUD
  let dailySubjectsFlat = [];
  const subjectsTableBody = document.getElementById('dailySubjectsTableBody');
  const subjectsTableWrap = document.getElementById('subjectsTableWrap');
  const subjectsLoading = document.getElementById('subjectsLoading');

  function setSubjectsLoading(on) {
    if (subjectsLoading) subjectsLoading.classList.toggle('hidden', !on);
    if (subjectsTableWrap) subjectsTableWrap.classList.toggle('hidden', on);
  }

  async function loadDailySubjects() {
    setSubjectsLoading(true);
    try {
      const res = await apiFetch('/api/daily-subjects');
      const list = Array.isArray(res.data) ? res.data : [];
      
      dailySubjectsFlat = [];
      list.forEach(function(doc) {
        const subs = Array.isArray(doc.subjects) ? doc.subjects : [];
        subs.forEach(function(s, i) {
          dailySubjectsFlat.push({ 
            docId: doc._id, 
            subjectIndex: i, 
            dayOfWeek: doc.dayOfWeek || '', 
            name: s.name || '', 
            type: s.type || 'Theory', 
            itemsNeeded: Array.isArray(s.itemsNeeded) ? s.itemsNeeded : [] 
          });
        });
      });
      
      renderDailySubjects();
    } catch (err) {
      if (subjectsTableBody) subjectsTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Failed to load.</td></tr>';
      toast('Failed to load subjects', 'error');
    }
    setSubjectsLoading(false);
  }

  function renderDailySubjects() {
    if (!subjectsTableBody) return;
    
    subjectsTableBody.innerHTML = dailySubjectsFlat.length ? dailySubjectsFlat.map(function(s, idx) {
      const typeColors = {
        'Theory': 'bg-blue-100 text-blue-700',
        'Lab': 'bg-green-100 text-green-700',
        'Seminar': 'bg-yellow-100 text-yellow-700'
      };
      const badgeClass = typeColors[s.type] || typeColors['Theory'];
      const items = Array.isArray(s.itemsNeeded) ? s.itemsNeeded : [];
      
      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4 text-sm text-gray-800 font-medium">${escapeHtml(s.dayOfWeek)}</td>
          <td class="px-6 py-4 text-sm text-gray-800">${escapeHtml(s.name)}</td>
          <td class="px-6 py-4">
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}">${escapeHtml(s.type)}</span>
          </td>
          <td class="px-6 py-4 text-sm text-gray-600">${items.length ? items.map(escapeHtml).join(', ') : '—'}</td>
          <td class="px-6 py-4 text-sm">
            <button class="btn-action bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30 mr-2" onclick="editSubject(${idx})">
              <i class="bi bi-pencil"></i>Edit
            </button>
            <button class="btn-action bg-red-500 hover:bg-red-600 text-white shadow-red-500/30" onclick="deleteSubject('${s.docId}', ${s.subjectIndex})">
              <i class="bi bi-trash"></i>Delete
            </button>
          </td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No subjects.</td></tr>';
  }

  const subjectNameSelect = document.getElementById('subjectNameSelect');
  const subjectNameOtherWrap = document.getElementById('subjectNameOtherWrap');
  
  if (subjectNameSelect) {
    subjectNameSelect.addEventListener('change', function() {
      if (subjectNameOtherWrap) subjectNameOtherWrap.classList.toggle('hidden', this.value !== 'Other');
    });
  }

  function getSubjectNameValue() {
    const sel = document.getElementById('subjectNameSelect');
    const other = document.getElementById('subjectNameOther');
    if (!sel) return (other ? other.value : '') || '';
    return sel.value === 'Other' ? (other ? other.value.trim() : '') : (sel.value || '');
  }

  function setSubjectNameValue(name) {
    const sel = document.getElementById('subjectNameSelect');
    const other = document.getElementById('subjectNameOther');
    if (!sel) return;
    
    const opts = Array.from(sel.options).map(function(o) { return o.value; });
    if (name && opts.indexOf(name) >= 0) { 
      sel.value = name; 
      if (subjectNameOtherWrap) subjectNameOtherWrap.classList.add('hidden'); 
    } else { 
      sel.value = 'Other'; 
      if (subjectNameOtherWrap) subjectNameOtherWrap.classList.remove('hidden'); 
      if (other) other.value = name || ''; 
    }
  }

  window.openSubjectForm = function() {
    document.getElementById('subjectModalTitle').textContent = 'Add Subject';
    document.getElementById('subjectDocId').value = '';
    document.getElementById('subjectIndex').value = '';
    document.getElementById('subjectDay').value = 'Monday';
    setSubjectNameValue('');
    document.getElementById('subjectType').value = 'Theory';
    document.getElementById('subjectItems').value = '';
    openModal('subjectModal');
  };

  window.editSubject = function(idx) {
    const s = dailySubjectsFlat[idx];
    if (!s) return;
    
    document.getElementById('subjectModalTitle').textContent = 'Edit Subject';
    document.getElementById('subjectDocId').value = s.docId;
    document.getElementById('subjectIndex').value = s.subjectIndex;
    document.getElementById('subjectDay').value = s.dayOfWeek;
    setSubjectNameValue(s.name || '');
    document.getElementById('subjectType').value = s.type || 'Theory';
    document.getElementById('subjectItems').value = (s.itemsNeeded && Array.isArray(s.itemsNeeded) && s.itemsNeeded.length) ? s.itemsNeeded.join('\n') : '';
    
    openModal('subjectModal');
  };

  const subjectSaveBtn = document.getElementById('subjectSaveBtn');
  if (subjectSaveBtn) {
    subjectSaveBtn.addEventListener('click', async function() {
      const docId = document.getElementById('subjectDocId').value;
      const subjectIndex = document.getElementById('subjectIndex').value;
      const dayOfWeek = document.getElementById('subjectDay').value;
      const name = getSubjectNameValue();
      const type = document.getElementById('subjectType').value;
      const itemsNeeded = (document.getElementById('subjectItems').value || '').split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
      
      if (!name) { 
        toast('Please enter or select a subject name.', 'error'); 
        return; 
      }
      
      subjectSaveBtn.disabled = true;
      subjectSaveBtn.innerHTML = '<div class="spinner spinner-sm border-white border-t-transparent mr-2"></div>Saving...';
      
      try {
        if (!docId) {
          const res = await apiFetch('/api/daily-subjects', { 
            method: 'POST', 
            headers: headers(), 
            body: JSON.stringify({ dayOfWeek: dayOfWeek, subject: { name: name, type: type, itemsNeeded: itemsNeeded } }) 
          });
          if (!res.ok) throw new Error(res.data.error || 'Save failed');
        } else {
          const listRes = await apiFetch('/api/daily-subjects');
          const list = Array.isArray(listRes.data) ? listRes.data : [];
          const doc = list.find(function(d) { return d._id === docId; });
          if (!doc) throw new Error('Document not found');
          
          const subjects = Array.isArray(doc.subjects) ? doc.subjects : [];
          const idx = parseInt(subjectIndex, 10);
          if (idx < 0 || idx >= subjects.length) throw new Error('Invalid subject index');
          
          subjects[idx] = { name: name, type: type, itemsNeeded: itemsNeeded };
          doc.subjects = subjects;
          
          const res = await apiFetch('/api/daily-subjects/' + docId, { 
            method: 'PUT', 
            headers: headers(), 
            body: JSON.stringify({ dayOfWeek: doc.dayOfWeek, subjects: doc.subjects }) 
          });
          if (!res.ok) throw new Error(res.data.error || 'Save failed');
        }
        
        closeModal('subjectModal');
        toast('Saved successfully!');
        loadDailySubjects();
        loadDashboard();
      } catch (err) {
        toast(err.message || 'Failed to save.', 'error');
      }
      
      subjectSaveBtn.disabled = false;
      subjectSaveBtn.innerHTML = 'Save Subject';
    });
  }

  window.deleteSubject = async function(docId, subjectIndex) {
    const ok = await confirmDelete('Delete this subject?');
    if (!ok) return;
    
    try {
      const res = await apiFetch('/api/daily-subjects/' + docId + '?subjectIndex=' + subjectIndex, { 
        method: 'DELETE', 
        headers: headers() 
      });
      if (!res.ok) throw new Error(res.data.error || 'Delete failed');
      toast(res.data.message || 'Deleted successfully!');
      loadDailySubjects();
      loadDashboard();
    } catch (err) { 
      toast(err.message || 'Failed to delete.', 'error'); 
    }
  };

  // Announcements CRUD
  let announcementsList = [];
  const announcementsTableBody = document.getElementById('announcementsTableBody');
  const announcementsTableWrap = document.getElementById('announcementsTableWrap');
  const announcementsLoading = document.getElementById('announcementsLoading');

  function setAnnouncementsLoading(on) {
    if (announcementsLoading) announcementsLoading.classList.toggle('hidden', !on);
    if (announcementsTableWrap) announcementsTableWrap.classList.toggle('hidden', on);
  }

  async function loadAnnouncements() {
    setAnnouncementsLoading(true);
    try {
      const res = await apiFetch('/api/announcements');
      announcementsList = Array.isArray(res.data) ? res.data : [];
      
      if (announcementsTableBody) {
        announcementsTableBody.innerHTML = announcementsList.length ? announcementsList.map(function(a) {
          const msg = (a.message || '').substring(0, 60) + ((a.message || '').length > 60 ? '…' : '');
          const active = a.active !== false;
          const dt = a.date + (a.time ? ' ' + a.time : '');
          
          return `
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 text-sm text-gray-800 font-medium">${escapeHtml(a.title)}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(msg)}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(dt)}</td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">${active ? 'Active' : 'Inactive'}</span>
              </td>
              <td class="px-6 py-4 text-sm">
                <button class="btn-action bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30 mr-2" onclick="editAnnouncement('${escapeHtml(a._id)}')">
                  <i class="bi bi-pencil"></i>Edit
                </button>
                <button class="btn-action bg-red-500 hover:bg-red-600 text-white shadow-red-500/30" onclick="deleteAnnouncement('${escapeHtml(a._id)}')">
                  <i class="bi bi-trash"></i>Delete
                </button>
              </td>
            </tr>
          `;
        }).join('') : '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No announcements.</td></tr>';
      }
    } catch (err) {
      if (announcementsTableBody) announcementsTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Failed to load.</td></tr>';
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
    const timeEl = document.getElementById('announcementTime');
    if (timeEl) timeEl.value = '09:00';
    document.getElementById('announcementActive').checked = true;
    openModal('announcementModal');
  };

  window.editAnnouncement = function(id) {
    const a = announcementsList.find(function(x) { return x._id === id; });
    if (!a) return;
    
    document.getElementById('announcementModalTitle').textContent = 'Edit Announcement';
    document.getElementById('announcementId').value = a._id;
    document.getElementById('announcementTitle').value = a.title || '';
    document.getElementById('announcementMessage').value = a.message || '';
    document.getElementById('announcementDate').value = a.date || '';
    const timeEl = document.getElementById('announcementTime');
    if (timeEl) timeEl.value = (a.time || '09:00').substring(0, 5);
    document.getElementById('announcementActive').checked = a.active !== false;
    
    openModal('announcementModal');
  };

  const announcementSaveBtn = document.getElementById('announcementSaveBtn');
  if (announcementSaveBtn) {
    announcementSaveBtn.addEventListener('click', async function() {
      const id = document.getElementById('announcementId').value;
      const timeEl = document.getElementById('announcementTime');
      
      const body = {
        title: document.getElementById('announcementTitle').value.trim(),
        message: document.getElementById('announcementMessage').value.trim(),
        date: document.getElementById('announcementDate').value,
        time: timeEl ? timeEl.value || '09:00' : '09:00',
        active: document.getElementById('announcementActive').checked
      };
      
      announcementSaveBtn.disabled = true;
      announcementSaveBtn.innerHTML = '<div class="spinner spinner-sm border-white border-t-transparent mr-2"></div>Saving...';
      
      try {
        const res = await apiFetch('/api/announcements' + (id ? '/' + id : ''), { 
          method: id ? 'PUT' : 'POST', 
          headers: headers(), 
          body: JSON.stringify(body) 
        });
        
        if (!res.ok) throw new Error(res.data.error || 'Save failed');
        
        closeModal('announcementModal');
        toast(res.data.message || 'Saved successfully!');
        loadAnnouncements();
        loadDashboard();
      } catch (err) {
        toast(err.message || 'Failed to save.', 'error');
      }
      
      announcementSaveBtn.disabled = false;
      announcementSaveBtn.innerHTML = 'Save Announcement';
    });
  }

  window.deleteAnnouncement = async function(id) {
    const ok = await confirmDelete('Delete this announcement?');
    if (!ok) return;
    
    try {
      const res = await apiFetch('/api/announcements/' + id, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error(res.data.error || 'Delete failed');
      toast(res.data.message || 'Deleted successfully!');
      loadAnnouncements();
      loadDashboard();
    } catch (err) { 
      toast(err.message || 'Failed to delete.', 'error'); 
    }
  };

  // Initialize
  loadDashboard();
  loadEvents();
  loadDailySubjects();
  loadAnnouncements();
})();
