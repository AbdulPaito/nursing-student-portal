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

  // Toast with enhanced animations
  function toast(message, type) {
    type = type || 'success';
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const id = 'toast-' + Date.now();
    
    const colors = {
      success: { bg: 'bg-gradient-to-r from-emerald-500 to-teal-500', icon: 'fa-check-circle', shadow: 'shadow-emerald-500/30' },
      error: { bg: 'bg-gradient-to-r from-rose-500 to-red-600', icon: 'fa-circle-xmark', shadow: 'shadow-rose-500/30' },
      info: { bg: 'bg-gradient-to-r from-primary-500 to-secondary-500', icon: 'fa-circle-info', shadow: 'shadow-primary-500/30' }
    };
    
    const color = colors[type] || colors.info;
    
    container.insertAdjacentHTML('beforeend', `
      <div id="${id}" class="${color.bg} text-white px-6 py-4 rounded-2xl shadow-2xl ${color.shadow} flex items-center gap-4 transform translate-x-full transition-all duration-300" style="backdrop-filter: blur(10px);">
        <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid ${color.icon} text-xl"></i>
        </div>
        <span class="font-semibold">${escapeHtml(message)}</span>
        <button onclick="this.parentElement.remove()" class="ml-auto w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `);
    
    const el = document.getElementById(id);
    // Animate in
    requestAnimationFrame(() => {
      el.classList.remove('translate-x-full');
    });
    
    setTimeout(() => {
      if (el && el.parentNode) {
        el.classList.add('translate-x-full', 'opacity-0');
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

  // Modal functions with animations
  window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Animate backdrop
    const backdrop = modal.querySelector('.absolute.inset-0');
    if (backdrop) {
      backdrop.style.opacity = '0';
      setTimeout(() => backdrop.style.opacity = '1', 10);
    }
  };

  window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = modal.querySelector('.absolute.inset-0');
    
    if (backdrop) {
      backdrop.style.opacity = '0';
    }
    
    setTimeout(() => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }, 200);
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
    confirmMessage.textContent = msg || 'Are you sure you want to delete this item? This action cannot be undone.';
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

  // Sidebar with smooth animations
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  function toggleSidebar() {
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    
    if (isOpen) {
      sidebar.classList.add('-translate-x-full');
      sidebarBackdrop.classList.add('hidden');
      sidebarBackdrop.classList.remove('opacity-100');
      sidebarBackdrop.classList.add('opacity-0');
    } else {
      sidebar.classList.remove('-translate-x-full');
      sidebarBackdrop.classList.remove('hidden');
      setTimeout(() => {
        sidebarBackdrop.classList.remove('opacity-0');
        sidebarBackdrop.classList.add('opacity-100');
      }, 10);
    }
  }

  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
  if (sidebarClose) sidebarClose.addEventListener('click', toggleSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', toggleSidebar);

  // Section switching with fade animations
  document.querySelectorAll('.sidebar-link[data-section]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href') === '#') e.preventDefault();
      const section = this.dataset.section;
      
      // Fade out current sections
      document.querySelectorAll('.admin-section').forEach(function(s) { 
        s.style.opacity = '0';
        setTimeout(() => s.classList.add('hidden'), 200);
      });
      
      // Show new section with animation
      setTimeout(() => {
        const panel = document.getElementById('section-' + section);
        if (panel) {
          panel.classList.remove('hidden');
          panel.style.opacity = '0';
          setTimeout(() => {
            panel.style.opacity = '1';
            panel.classList.add('animate-fade-in');
          }, 50);
        }
      }, 200);
      
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

  // Update current date
  function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
  }
  updateCurrentDate();

  // Animated counter with easing
  function animateCounter(element, target, duration = 1500) {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-expo)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);
      
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }

  // Countdown timer for next event
  function updateCountdown(targetDate) {
    const countdownEl = document.getElementById('statCountdown');
    if (!countdownEl || !targetDate) return;
    
    function update() {
      const now = new Date();
      const diff = new Date(targetDate) - now;
      
      if (diff <= 0) {
        countdownEl.textContent = 'Event started!';
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      countdownEl.textContent = `${days}d ${hours}h ${minutes}m`;
    }
    
    update();
    setInterval(update, 60000);
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
      
      // Start countdown if there's an upcoming event
      if (upcoming.length && upcoming[0].date) {
        updateCountdown(upcoming[0].date + 'T' + (upcoming[0].time || '00:00'));
      }

      // Recent Activity with staggered animations
      let activity = [];
      events.slice(0, 5).forEach(function(e) { 
        activity.push({ type: 'event', text: e.title, date: e.date, icon: 'fa-calendar-check', color: 'bg-primary-100 text-primary-600' }); 
      });
      
      dailySubjects.forEach(function(d) {
        (d.subjects || []).slice(0, 2).forEach(function(s) { 
          activity.push({ type: 'subject', text: d.dayOfWeek + ': ' + s.name, date: d.dayOfWeek, icon: 'fa-book-open', color: 'bg-emerald-100 text-emerald-600' }); 
        });
      });

      activity = activity.slice(0, 10);
      
      if (recentActivityList) {
        recentActivityList.innerHTML = activity.length
          ? activity.map(function(a, index) { 
              return `
                <li class="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 opacity-0 animate-fade-in-up" style="animation-delay: ${index * 0.1}s; animation-fill-mode: forwards;">
                  <div class="w-12 h-12 rounded-xl ${a.color} flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid ${a.icon}"></i>
                  </div>
                  <div class="flex-grow min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">${escapeHtml(a.text)}</p>
                    <p class="text-xs text-gray-500 flex items-center gap-1">
                      <i class="fa-solid fa-tag text-[10px]"></i>
                      ${escapeHtml(a.type)} • ${escapeHtml(a.date)}
                    </p>
                  </div>
                  <div class="w-2 h-2 rounded-full bg-gray-300"></div>
                </li>
              `; 
            }).join('')
          : '<li class="text-gray-500 py-8 text-center flex flex-col items-center gap-3"><i class="fa-solid fa-inbox text-4xl text-gray-300"></i><span>No recent activity. Add events or subjects.</span></li>';
      }

      renderAnalyticsChart(events, dailySubjects, announcements);
    } catch (err) { 
      console.error(err); 
      if (recentActivityList) recentActivityList.innerHTML = '<li class="text-gray-500 py-8 text-center"><i class="fa-solid fa-triangle-exclamation text-4xl text-rose-300 mb-3"></i><p>Could not load activity.</p></li>'; 
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
            backgroundColor: 'rgba(124, 58, 237, 0.8)',
            borderColor: '#7c3aed',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Announcements',
            data: announcementsPerMonth,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 1500,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { 
              usePointStyle: true, 
              padding: 20,
              font: { family: 'Plus Jakarta Sans', size: 12 }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { family: 'Plus Jakarta Sans' } },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans' } }
          }
        }
      }
    });
  }

  // Events CRUD with enhanced UI
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
      if (eventsTableBody) eventsTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center"><i class="fa-solid fa-triangle-exclamation text-4xl text-rose-300 mb-3"></i><p class="text-gray-500">Failed to load events.</p></td></tr>';
      toast('Failed to load events', 'error');
    }
    setEventsLoading(false);
  }

  function renderEvents(list) {
    const q = (document.getElementById('eventsSearch') && document.getElementById('eventsSearch').value || '').toLowerCase();
    const filtered = q ? list.filter(function(e) { return (e.title || '').toLowerCase().includes(q); }) : list;
    
    if (!eventsTableBody) return;
    
    eventsTableBody.innerHTML = filtered.length ? filtered.map(function(e, index) {
      const today = new Date().toISOString().split('T')[0];
      const isPast = e.date < today;
      const statusBadge = isPast 
        ? '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Past</span>'
        : '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600">Upcoming</span>';
      
      return `
        <tr class="hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0 opacity-0 animate-fade-in" style="animation-delay: ${index * 0.05}s; animation-fill-mode: forwards;">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-calendar text-white text-sm"></i>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-800">${escapeHtml(e.title)}</p>
                <p class="text-xs text-gray-500">${e.category || 'General'}</p>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="text-sm text-gray-800 font-medium">${escapeHtml(e.date)}</div>
            <div class="text-xs text-gray-500">${escapeHtml(e.time)}</div>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <i class="fa-solid fa-location-dot text-rose-400"></i>
              <span>${escapeHtml(e.location || '—')}</span>
            </div>
          </td>
          <td class="px-6 py-4">
            ${e.items && e.items.length 
              ? `<div class="flex flex-wrap gap-1">${e.items.slice(0, 3).map(item => `<span class="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs">${escapeHtml(item)}</span>`).join('')}${e.items.length > 3 ? `<span class="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs">+${e.items.length - 3}</span>` : ''}</div>`
              : '<span class="text-gray-400 text-sm">—</span>'
            }
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              ${statusBadge}
              <button class="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center transition-colors" onclick="editEvent('${escapeHtml(e._id)}')" title="Edit">
                <i class="fa-solid fa-pen text-sm"></i>
              </button>
              <button class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 flex items-center justify-center transition-colors" onclick="deleteEvent('${escapeHtml(e._id)}')" title="Delete">
                <i class="fa-solid fa-trash text-sm"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="5" class="px-6 py-12 text-center"><i class="fa-solid fa-inbox text-4xl text-gray-300 mb-3"></i><p class="text-gray-500">No events found.</p></td></tr>';
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
      
      if (!body.title || !body.date || !body.time) {
        toast('Please fill in all required fields', 'error');
        return;
      }
      
      eventSaveBtn.disabled = true;
      eventSaveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
      
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
    const ok = await confirmDelete('Are you sure you want to delete this event?');
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
      if (subjectsTableBody) subjectsTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center"><i class="fa-solid fa-triangle-exclamation text-4xl text-rose-300 mb-3"></i><p class="text-gray-500">Failed to load.</p></td></tr>';
      toast('Failed to load subjects', 'error');
    }
    setSubjectsLoading(false);
  }

  function renderDailySubjects() {
    if (!subjectsTableBody) return;
    
    subjectsTableBody.innerHTML = dailySubjectsFlat.length ? dailySubjectsFlat.map(function(s, index) {
      const typeColors = {
        'Theory': 'bg-blue-100 text-blue-700 border-blue-200',
        'Lab': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Seminar': 'bg-amber-100 text-amber-700 border-amber-200'
      };
      const badgeClass = typeColors[s.type] || typeColors['Theory'];
      const items = Array.isArray(s.itemsNeeded) ? s.itemsNeeded : [];
      
      return `
        <tr class="hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0 opacity-0 animate-fade-in" style="animation-delay: ${index * 0.05}s; animation-fill-mode: forwards;">
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                <i class="fa-solid fa-calendar-day text-white text-sm"></i>
              </div>
              <span class="text-sm font-semibold text-gray-800">${escapeHtml(s.dayOfWeek)}</span>
            </div>
          </td>
          <td class="px-6 py-4">
            <p class="text-sm font-semibold text-gray-800">${escapeHtml(s.name)}</p>
          </td>
          <td class="px-6 py-4">
            <span class="px-3 py-1.5 rounded-lg text-xs font-semibold border ${badgeClass}">${escapeHtml(s.type)}</span>
          </td>
          <td class="px-6 py-4">
            ${items.length 
              ? `<div class="flex flex-wrap gap-1">${items.map(item => `<span class="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs">${escapeHtml(item)}</span>`).join('')}</div>`
              : '<span class="text-gray-400 text-sm">—</span>'
            }
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <button class="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center transition-colors" onclick="editSubject(${index})" title="Edit">
                <i class="fa-solid fa-pen text-sm"></i>
              </button>
              <button class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 flex items-center justify-center transition-colors" onclick="deleteSubject('${s.docId}', ${s.subjectIndex})" title="Delete">
                <i class="fa-solid fa-trash text-sm"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="5" class="px-6 py-12 text-center"><i class="fa-solid fa-inbox text-4xl text-gray-300 mb-3"></i><p class="text-gray-500">No subjects scheduled.</p></td></tr>';
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
      subjectSaveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
      
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
        toast('Subject saved successfully!');
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
    const ok = await confirmDelete('Are you sure you want to delete this subject?');
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
        announcementsTableBody.innerHTML = announcementsList.length ? announcementsList.map(function(a, index) {
          const msg = (a.message || '').substring(0, 60) + ((a.message || '').length > 60 ? '…' : '');
          const active = a.active !== false;
          const dt = a.date + (a.time ? ' ' + a.time : '');
          
          return `
            <tr class="hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0 opacity-0 animate-fade-in" style="animation-delay: ${index * 0.05}s; animation-fill-mode: forwards;">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                    <i class="fa-solid fa-bullhorn text-white text-sm"></i>
                  </div>
                  <p class="text-sm font-semibold text-gray-800">${escapeHtml(a.title)}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm text-gray-600 line-clamp-2">${escapeHtml(msg)}</p>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm text-gray-600">${escapeHtml(dt)}</p>
              </td>
              <td class="px-6 py-4">
                <span class="px-3 py-1.5 rounded-lg text-xs font-semibold ${active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}">${active ? 'Active' : 'Inactive'}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button class="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center transition-colors" onclick="editAnnouncement('${escapeHtml(a._id)}')" title="Edit">
                    <i class="fa-solid fa-pen text-sm"></i>
                  </button>
                  <button class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 flex items-center justify-center transition-colors" onclick="deleteAnnouncement('${escapeHtml(a._id)}')" title="Delete">
                    <i class="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('') : '<tr><td colspan="5" class="px-6 py-12 text-center"><i class="fa-solid fa-inbox text-4xl text-gray-300 mb-3"></i><p class="text-gray-500">No announcements yet.</p></td></tr>';
      }
    } catch (err) {
      if (announcementsTableBody) announcementsTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center"><i class="fa-solid fa-triangle-exclamation text-4xl text-rose-300 mb-3"></i><p class="text-gray-500">Failed to load.</p></td></tr>';
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
      
      if (!body.title || !body.message || !body.date) {
        toast('Please fill in all required fields', 'error');
        return;
      }
      
      announcementSaveBtn.disabled = true;
      announcementSaveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
      
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
    const ok = await confirmDelete('Are you sure you want to delete this announcement?');
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
