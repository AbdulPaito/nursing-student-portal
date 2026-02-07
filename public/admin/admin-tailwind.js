(function() {
  'use strict';
  // API Configuration - Set your Render backend URL here
  const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '' // Local development - use relative URLs
    : 'https://nursing-student-portal.onrender.com'; // Production - Render backend URL
  
  console.log('🔗 API URL configured:', API || 'Relative URLs (same domain)');

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

  // Check for forced password change on first login
  window.addEventListener('DOMContentLoaded', function() {
    const mustChangePassword = localStorage.getItem('mustChangePassword');
    if (mustChangePassword === 'true') {
      // Auto-navigate to change password section
      setTimeout(() => {
        // Show notification
        toast('You must change your password before continuing', 'info');
        
        // Navigate to change password section
        const changePasswordLink = document.querySelector('[data-section="change-password"]');
        if (changePasswordLink) {
          changePasswordLink.click();
        }
        
        // Clear the flag after showing once
        localStorage.removeItem('mustChangePassword');
      }, 1000);
    }
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

  // Format time from 24-hour to 12-hour format
  function formatTime(time24) {
    if (!time24 || time24 === '—') return time24 || '—';
    try {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (e) {
      return time24;
    }
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

  window.closeCourseModal = function() {
    const modal = document.getElementById('courseModal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
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
      
      console.log('📄 Switching to section:', section);
      
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
            
            // Load music when music section is shown
            if (section === 'music') {
              console.log('🎵 Music section loaded, fetching files...');
              loadMusicFiles();
            }
            
            // Load courses when courses-subjects section is shown
            if (section === 'courses-subjects') {
              console.log('📚 Courses & subjects section loaded, fetching courses...');
              loadCourses();
            }
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
      if (eventsTableBody) eventsTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center"><i class="fa-solid fa-triangle-exclamation text-4xl text-rose-300 mb-3"></i><p class="text-gray-500">Failed to load events.</p></td></tr>';
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
            <span class="text-gray-700">${formatTime(e.time)}</span>
          </td>
          <td class="px-6 py-4">
            <div class="text-sm text-gray-800 font-medium">${escapeHtml(e.startDate || e.date)}</div>
            ${e.endDate && e.endDate !== e.startDate ? `<div class="text-xs text-gray-500">to ${escapeHtml(e.endDate)}</div>` : ''}
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
    }).join('') : '<tr><td colspan="6" class="px-6 py-12 text-center"><i class="fa-solid fa-inbox text-4xl text-gray-300 mb-3"></i><p class="text-gray-500">No events found.</p></td></tr>';
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
    if (document.getElementById('eventCategoryCustom')) {
      document.getElementById('eventCategoryCustom').value = '';
      document.getElementById('eventCategoryCustom').classList.add('hidden');
    }
    document.getElementById('eventStartDate').value = '';
    document.getElementById('eventEndDate').value = '';
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
    
    // Handle category
    const category = e.category || '';
    const knownCategories = ['Orientation', 'Training', 'Workshops', 'Seminars', 'Social Events'];
    const categorySelect = document.getElementById('eventCategory');
    const customInput = document.getElementById('eventCategoryCustom');
    
    if (categorySelect) {
      if (category && knownCategories.indexOf(category) === -1 && category !== '') {
        // Custom category
        categorySelect.value = 'Other';
        if (customInput) {
          customInput.value = category;
          customInput.classList.remove('hidden');
        }
      } else {
        // Standard category or empty
        categorySelect.value = category;
        if (customInput) {
          customInput.value = '';
          customInput.classList.add('hidden');
        }
      }
    }
    
    document.getElementById('eventStartDate').value = e.startDate || e.date || '';
    document.getElementById('eventEndDate').value = e.endDate || '';
    document.getElementById('eventTime').value = e.time || '09:00';
    document.getElementById('eventLocation').value = e.location || '';
    document.getElementById('eventItems').value = (e.items && e.items.length) ? e.items.join('\n') : '';
    
    openModal('eventModal');
  };

  const eventSaveBtn = document.getElementById('eventSaveBtn');
  if (eventSaveBtn) {
    eventSaveBtn.addEventListener('click', async function() {
      const id = document.getElementById('eventId').value;
      const startDate = document.getElementById('eventStartDate').value;
      const endDate = document.getElementById('eventEndDate').value;
      
      // Handle category
      const categorySelect = document.getElementById('eventCategory') ? document.getElementById('eventCategory').value : '';
      const categoryCustom = document.getElementById('eventCategoryCustom') ? document.getElementById('eventCategoryCustom').value.trim() : '';
      const category = categorySelect === 'Other' ? categoryCustom : categorySelect;
      
      // Validate custom category if Other is selected
      if (categorySelect === 'Other' && !categoryCustom) {
        toast('Please enter a custom category', 'error');
        return;
      }
      
      const body = {
        title: document.getElementById('eventTitle').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        category: category,
        date: startDate,
        startDate: startDate,
        endDate: endDate,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value.trim(),
        items: (document.getElementById('eventItems').value || '').split('\n').map(function(s) { return s.trim(); }).filter(Boolean)
      };
      
      if (!body.title || !body.startDate || !body.time) {
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
    }).join('') : '<tr><td colspan="5" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center"><i class="fa-solid fa-inbox text-4xl text-gray-300 mb-3"></i><p class="text-gray-500 font-medium">No subjects scheduled.</p></div></td></tr>';
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

  // Course Management
  let coursesData = [];
  
  function setSubjectsLoading(on) {
    const loadingDiv = document.getElementById('subjectsLoading');
    const tableWrap = document.getElementById('subjectsTableWrap');
    if (loadingDiv) loadingDiv.classList.toggle('hidden', !on);
    if (tableWrap) tableWrap.classList.toggle('hidden', on);
  }
  
  async function loadCourses() {
    setSubjectsLoading(true);
    try {
      const res = await fetch(API + '/api/courses');
      const json = await res.json();
      if (json.success) {
        coursesData = json.data || [];
        renderCourses();
      } else {
        throw new Error(json.error || 'Failed to load courses');
      }
    } catch (err) {
      const tbody = document.getElementById('dailySubjectsTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center"><div class="text-rose-600 font-medium">Failed to load courses</div></td></tr>';
      toast('Failed to load courses', 'error');
    }
    setSubjectsLoading(false);
  }
  
  function renderCourses() {
    const tbody = document.getElementById('dailySubjectsTableBody');
    if (!tbody) return;
    
    if (!coursesData.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-12 text-center"><div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4"><i class="fa-solid fa-book-open text-2xl text-gray-400"></i></div><p class="text-gray-500 font-medium">No courses added yet</p></td></tr>';
      return;
    }
    
    tbody.innerHTML = coursesData.map(course => {
      console.log('Rendering course:', course.code, 'subjectType:', course.subjectType);
      
      const statusBadge = course.status === 'Active' 
        ? '<span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Active</span>'
        : '<span class="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">Inactive</span>';
      
      const subjectTypeDisplay = course.subjectType && course.subjectType !== ''
        ? `<span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">${escapeHtml(course.subjectType)}</span>`
        : '<span class="text-gray-400 text-sm">—</span>';
      
      return `<tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4"><span class="font-mono font-semibold text-primary-600">${escapeHtml(course.code)}</span></td>
        <td class="px-6 py-4"><span class="font-medium text-gray-800">${escapeHtml(course.name)}</span></td>
        <td class="px-6 py-4 text-center"><span class="font-semibold text-gray-700">${escapeHtml(course.unit.toString())}</span></td>
        <td class="px-6 py-4">${subjectTypeDisplay}</td>
        <td class="px-6 py-4">${escapeHtml(course.yearLevel)}</td>
        <td class="px-6 py-4">${escapeHtml(course.semester)}</td>
        <td class="px-6 py-4">${statusBadge}</td>
        <td class="px-6 py-4"><div class="flex gap-2">
          <button onclick="editCourse('${course._id}')" class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"><i class="fa-solid fa-pen text-xs"></i> Edit</button>
          <button onclick="deleteCourse('${course._id}')" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"><i class="fa-solid fa-trash text-xs"></i> Delete</button>
        </div></td>
      </tr>`;
    }).join('');
  }

  // Function to open course modal
  window.openCourseModal = function() {
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
    
    const modal = document.getElementById('courseModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };
  
  // Toggle custom subject type input
  window.toggleCustomSubjectType = function() {
    const selectElement = document.getElementById('courseSubjectType');
    const customInput = document.getElementById('courseSubjectTypeCustom');
    
    if (selectElement.value === 'Other') {
      customInput.classList.remove('hidden');
      customInput.focus();
    } else {
      customInput.classList.add('hidden');
      customInput.value = '';
    }
  };
  
  // Toggle custom category input for events
  window.toggleCustomCategory = function() {
    const selectElement = document.getElementById('eventCategory');
    const customInput = document.getElementById('eventCategoryCustom');
    
    if (selectElement.value === 'Other') {
      customInput.classList.remove('hidden');
      customInput.focus();
    } else {
      customInput.classList.add('hidden');
      customInput.value = '';
    }
  };

  // Switch between Course Catalog and Weekly Schedule tabs in admin
  window.switchAdminTab = function(tab) {
    const catalogTab = document.getElementById('adminCatalogTab');
    const scheduleTab = document.getElementById('adminScheduleTab');
    const catalogSection = document.getElementById('adminCatalogSection');
    const scheduleSection = document.getElementById('adminScheduleSection');
    
    if (tab === 'catalog') {
      catalogTab.className = 'admin-main-tab px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md';
      scheduleTab.className = 'admin-main-tab px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-white text-gray-600 hover:bg-gray-50';
      catalogSection.classList.remove('hidden');
      scheduleSection.classList.add('hidden');
    } else if (tab === 'schedule') {
      scheduleTab.className = 'admin-main-tab px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md';
      catalogTab.className = 'admin-main-tab px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-white text-gray-600 hover:bg-gray-50';
      scheduleSection.classList.remove('hidden');
      catalogSection.classList.add('hidden');
      // Load daily subjects when switching to schedule tab
      if (!window.dailySubjectsLoaded) {
        loadDailySubjects();
      }
    }
  };

  // ====================
  // Daily Subjects Management
  // ====================
  let dailySubjectsData = {};
  let currentDay = 'Monday';
  window.dailySubjectsLoaded = false;

  // Switch day tab
  window.switchAdminDay = function(day) {
    currentDay = day;
    document.querySelectorAll('.admin-day-tab').forEach(btn => {
      if (btn.getAttribute('data-day') === day) {
        btn.className = 'admin-day-tab px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md';
      } else {
        btn.className = 'admin-day-tab px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50';
      }
    });
    renderDailySubjects(day);
  };

  // Open modal
  window.openDailySubjectModal = function() {
    document.getElementById('dailySubjectModalTitle').textContent = 'Add Daily Subject';
    document.getElementById('dailySubjectId').value = '';
    document.getElementById('dailySubjectDay').value = currentDay;
    document.getElementById('dailySubjectCode').value = '';
    document.getElementById('dailySubjectName').value = '';
    document.getElementById('dailySubjectType').value = '';
    document.getElementById('dailySubjectTypeCustom').value = '';
    document.getElementById('dailySubjectTypeCustom').classList.add('hidden');
    document.getElementById('dailySubjectStartTime').value = '';
    document.getElementById('dailySubjectEndTime').value = '';
    document.getElementById('dailySubjectDate').value = '';
    document.getElementById('dailySubjectRoom').value = '';
    document.getElementById('dailySubjectInstructor').value = '';
    
    const modal = document.getElementById('dailySubjectModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  // Auto-select day when date is changed
  document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('dailySubjectDate');
    if (dateInput) {
      dateInput.addEventListener('change', function() {
        const selectedDate = this.value;
        if (selectedDate) {
          const date = new Date(selectedDate + 'T00:00:00');
          const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = dayNames[dayIndex];
          
          // Update hidden day input and switch to that day's tab
          document.getElementById('dailySubjectDay').value = dayName;
          currentDay = dayName;
          switchAdminDay(dayName);
          
          toast(`Day auto-selected: ${dayName}`, 'success');
        }
      });
    }
  });

  // Toggle custom type input
  window.toggleDailySubjectCustomType = function() {
    const selectElement = document.getElementById('dailySubjectType');
    const customInput = document.getElementById('dailySubjectTypeCustom');
    
    if (selectElement.value === 'Other') {
      customInput.classList.remove('hidden');
      customInput.focus();
    } else {
      customInput.classList.add('hidden');
      customInput.value = '';
    }
  };

  // Close modal
  window.closeDailySubjectModal = function() {
    const modal = document.getElementById('dailySubjectModal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  };

  // Save daily subject
  window.saveDailySubject = async function() {
    const subjectId = document.getElementById('dailySubjectId').value; // Check if editing
    const code = document.getElementById('dailySubjectCode').value.trim();
    const name = document.getElementById('dailySubjectName').value.trim();
    const typeSelect = document.getElementById('dailySubjectType').value;
    const typeCustom = document.getElementById('dailySubjectTypeCustom').value.trim();
    const type = typeSelect === 'Other' ? typeCustom : typeSelect;
    const startTime = document.getElementById('dailySubjectStartTime').value;
    const endTime = document.getElementById('dailySubjectEndTime').value;
    const date = document.getElementById('dailySubjectDate').value;
    const room = document.getElementById('dailySubjectRoom').value.trim();
    const instructor = document.getElementById('dailySubjectInstructor').value.trim();
    const day = document.getElementById('dailySubjectDay').value || currentDay;

    console.log('Saving subject to day:', day); // Debug
    console.log('Current day:', currentDay); // Debug
    console.log('Saving subject with instructor:', instructor); // Debug

    if (!code || !name || !type || !startTime || !endTime) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    if (typeSelect === 'Other' && !typeCustom) {
      toast('Please enter a custom type', 'error');
      return;
    }

    const saveBtn = document.getElementById('dailySubjectSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const subjectData = {
        code: code,
        name: name,
        type: type,
        startTime: startTime,
        endTime: endTime,
        date: date,
        room: room,
        instructor: instructor
      };

      // If editing, delete old and create new (simpler approach)
      if (subjectId !== '') {
        await fetch(API + '/api/daily-subjects/' + day + '/' + subjectId, {
          method: 'DELETE',
          headers: headers()
        });
      }

      const res = await fetch(API + '/api/daily-subjects/' + day, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(subjectData)
      });

      const json = await res.json();
      if (json.success) {
        toast(subjectId !== '' ? 'Subject updated successfully!' : 'Daily subject added successfully!', 'success');
        closeDailySubjectModal();
        loadDailySubjects();
      } else {
        throw new Error(json.error || 'Failed to save daily subject');
      }
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Subject';
  };

  // Load daily subjects
  async function loadDailySubjects() {
    try {
      const res = await fetch(API + '/api/daily-subjects', { headers: headers() });
      const json = await res.json();
      
      dailySubjectsData = {};
      if (Array.isArray(json)) {
        json.forEach(doc => {
          dailySubjectsData[doc.dayOfWeek] = doc.subjects || [];
        });
      }

      window.dailySubjectsLoaded = true;
      
      // Set Monday as default active tab
      switchAdminDay('Monday');
    } catch (err) {
      console.error('Error loading daily subjects:', err);
      toast('Error loading daily subjects', 'error');
    }
  }

  // Render daily subjects table
  function renderDailySubjects(day) {
    const tbody = document.getElementById('dailyScheduleTableBody');
    const subjects = dailySubjectsData[day] || [];

    if (!subjects.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="px-6 py-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
              <i class="fa-solid fa-calendar-xmark text-2xl text-gray-400"></i>
            </div>
            <p class="text-gray-500 font-medium">No subjects scheduled for ${day}</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = subjects.map((subject, index) => {
      const type = subject.type || '';
      let typeBadge = '<span class="text-gray-400 text-sm">—</span>';
      
      if (type === 'Lecture') {
        typeBadge = '<span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Lecture</span>';
      } else if (type === 'Practical/Lab') {
        typeBadge = '<span class="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Practical/Lab</span>';
      } else if (type === 'Seminar') {
        typeBadge = '<span class="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">Seminar</span>';
      } else if (type) {
        typeBadge = `<span class="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">${escapeHtml(type)}</span>`;
      }
      
      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4">
            <span class="font-mono font-semibold text-primary-600">${escapeHtml(subject.code || subject.name)}</span>
          </td>
          <td class="px-6 py-4">
            <span class="font-medium text-gray-800">${escapeHtml(subject.name || subject.customName || '')}</span>
          </td>
          <td class="px-6 py-4">
            ${typeBadge}
          </td>
          <td class="px-6 py-4">
            <span class="text-gray-700">${formatTime(subject.startTime || subject.time)}</span>
          </td>
          <td class="px-6 py-4">
            <span class="text-gray-700">${formatTime(subject.endTime)}</span>
          </td>
          <td class="px-6 py-4">
            <span class="text-gray-700">${escapeHtml(subject.date || '—')}</span>
          </td>
          <td class="px-6 py-4">
            <span class="text-gray-700">${escapeHtml(subject.room || subject.location || '—')}</span>
          </td>
          <td class="px-6 py-4">
            <span class="text-gray-700">${escapeHtml(subject.instructor || '—')}</span>
          </td>
          <td class="px-6 py-4">
            <div class="flex gap-2">
              <button onclick="editDailySubject('${day}', ${index})" class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1">
                <i class="fa-solid fa-pen text-xs"></i> Edit
              </button>
              <button onclick="deleteDailySubject('${day}', ${index})" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1">
                <i class="fa-solid fa-trash text-xs"></i> Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Edit daily subject
  window.editDailySubject = function(day, index) {
    const subjects = dailySubjectsData[day] || [];
    const subject = subjects[index];
    
    if (!subject) {
      toast('Subject not found', 'error');
      return;
    }

    document.getElementById('dailySubjectModalTitle').textContent = 'Edit Daily Subject';
    document.getElementById('dailySubjectId').value = index; // Store index
    document.getElementById('dailySubjectDay').value = day;
    document.getElementById('dailySubjectCode').value = subject.code || '';
    document.getElementById('dailySubjectName').value = subject.name || '';
    
    // Handle type
    const type = subject.type || '';
    const knownTypes = ['Lecture', 'Practical/Lab', 'Seminar'];
    const typeSelect = document.getElementById('dailySubjectType');
    const customInput = document.getElementById('dailySubjectTypeCustom');
    
    if (type && knownTypes.indexOf(type) === -1 && type !== '') {
      // Custom type
      typeSelect.value = 'Other';
      customInput.value = type;
      customInput.classList.remove('hidden');
    } else {
      // Standard type or empty
      typeSelect.value = type;
      customInput.value = '';
      customInput.classList.add('hidden');
    }
    
    document.getElementById('dailySubjectStartTime').value = subject.startTime || subject.time || '';
    document.getElementById('dailySubjectEndTime').value = subject.endTime || '';
    document.getElementById('dailySubjectDate').value = subject.date || '';
    document.getElementById('dailySubjectRoom').value = subject.room || subject.location || '';
    document.getElementById('dailySubjectInstructor').value = subject.instructor || '';
    
    const modal = document.getElementById('dailySubjectModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  // Delete daily subject
  window.deleteDailySubject = async function(day, index) {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const res = await fetch(API + '/api/daily-subjects/' + day + '/' + index, {
        method: 'DELETE',
        headers: headers()
      });

      const json = await res.json();
      if (json.success) {
        toast('Subject deleted successfully!', 'success');
        loadDailySubjects();
      } else {
        throw new Error(json.error || 'Failed to delete subject');
      }
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
  };

  window.saveCourse = async function() {
    const courseId = document.getElementById('courseId').value;
    const code = document.getElementById('courseCode').value.trim();
    const name = document.getElementById('courseName').value.trim();
    const unit = parseFloat(document.getElementById('courseUnit').value);
    const subjectTypeSelect = document.getElementById('courseSubjectType').value;
    const subjectTypeCustom = document.getElementById('courseSubjectTypeCustom').value.trim();
    const subjectType = subjectTypeSelect === 'Other' ? subjectTypeCustom : subjectTypeSelect;
    const yearLevel = document.getElementById('courseYearLevel').value;
    const semester = document.getElementById('courseSemester').value;
    const status = document.getElementById('courseStatus').value;
    
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
    
    const saveBtn = document.getElementById('courseSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
      const url = courseId ? API + '/api/courses/' + courseId : API + '/api/courses';
      const method = courseId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
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
      
      const json = await res.json();
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
  
  window.editCourse = async function(courseId) {
    const course = coursesData.find(c => c._id === courseId);
    if (!course) return;
    
    document.getElementById('courseModalTitle').textContent = 'Edit Course or Subject';
    document.getElementById('courseId').value = course._id;
    document.getElementById('courseCode').value = course.code;
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseUnit').value = course.unit;
    
    // Handle subject type
    const subjectType = course.subjectType || '';
    const knownTypes = ['Lab', 'Lecture', 'Seminar'];
    const customInput = document.getElementById('courseSubjectTypeCustom');
    
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
    const modal = document.getElementById('courseModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };
  
  window.deleteCourse = async function(courseId) {
    const ok = await confirmDelete('Are you sure you want to delete this course?');
    if (!ok) return;
    
    try {
      const res = await fetch(API + '/api/courses/' + courseId, {
        method: 'DELETE',
        headers: headers()
      });
      
      const json = await res.json();
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

  // Function to open daily subject modal
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

  // Music Management
  let musicList = [];
  const musicGrid = document.getElementById('musicGrid');
  const musicLoading = document.getElementById('musicLoading');
  const musicEmpty = document.getElementById('musicEmpty');

  async function loadMusicFiles() {
    console.log('🎵 Loading music files...');
    if (musicLoading) musicLoading.classList.remove('hidden');
    if (musicGrid) musicGrid.classList.add('hidden');
    if (musicEmpty) musicEmpty.classList.add('hidden');

    try {
      console.log('📡 Fetching from:', API + '/api/music');
      const res = await apiFetch('/api/music');
      console.log('✅ Music response:', res);
      const raw = res.data;
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
      const locationLabel = music.location === 'login' ? 'Login Page' : music.location === 'portal' ? 'Student Portal' : 'Both Pages';
      const statusClass = music.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
      const statusText = music.isActive ? 'Active' : 'Inactive';
      const fileSize = formatFileSize(music.fileSize);
      
      return '<div class="glass rounded-2xl border-2 border-gray-200 p-5 hover:border-primary-500 hover:shadow-lg transition-all">' +
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
    if (!bytes || bytes < 1024) return (bytes || 0) + ' B';
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
    const fileInput = document.getElementById('musicFile');
    const display = document.getElementById('musicFileNameDisplay');
    if (fileInput.files.length > 0) {
      display.textContent = fileInput.files[0].name;
    }
  };

  document.getElementById('musicUploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('🎵 Starting music upload...');
    
    const title = document.getElementById('musicTitle').value;
    const location = document.getElementById('musicLocation').value;
    const file = document.getElementById('musicFile').files[0];

    console.log('📋 Upload details:', { title, location, fileName: file?.name, fileSize: file?.size });

    if (!file) {
      toast('Please select a music file', 'error');
      console.error('❌ No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('location', location);
    formData.append('music', file);

    const uploadBtn = document.getElementById('musicUploadBtn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

    try {
      const uploadUrl = API + '/api/music/upload';
      console.log('📡 Uploading to:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + getToken() },
        body: formData
      });

      console.log('📥 Upload response status:', response.status);
      const data = await response.json();
      console.log('📥 Upload response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      console.log('✅ Music uploaded successfully!');
      toast('Music uploaded successfully!', 'success');
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
      const res = await apiFetch('/api/music/' + id + '/toggle', { method: 'PUT', headers: headers() });
      if (!res.ok) throw new Error(res.data.message || 'Failed to update status');
      toast(res.data.message || 'Status updated', 'success');
      loadMusicFiles();
    } catch (error) {
      toast('Error: ' + error.message, 'error');
    }
  };

  window.deleteMusic = async function(id) {
    const ok = await confirmDelete('Are you sure you want to delete this music file?');
    if (!ok) return;

    try {
      const res = await apiFetch('/api/music/' + id, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error(res.data.message || 'Delete failed');
      toast('Music deleted successfully!', 'success');
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
    const id = document.getElementById('editMusicId').value;
    const title = document.getElementById('editMusicTitle').value;
    const location = document.getElementById('editMusicLocation').value;

    try {
      const res = await apiFetch('/api/music/' + id, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ title: title, location: location })
      });

      if (!res.ok) throw new Error(res.data.message || 'Update failed');
      toast('Music updated successfully!', 'success');
      closeMusicEditModal();
      loadMusicFiles();
    } catch (error) {
      toast('Error: ' + error.message, 'error');
    }
  });

  // Department Info - Teachers & Students
  let teachersList = [];
  let studentsList = [];

  // Tab switching
  window.showDepartmentTab = function(tab) {
    document.querySelectorAll('.department-tab').forEach(function(btn) {
      btn.classList.remove('text-primary-600', 'border-primary-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    });
    document.getElementById('tab-' + tab).classList.remove('text-gray-500', 'border-transparent');
    document.getElementById('tab-' + tab).classList.add('text-primary-600', 'border-primary-600');
    
    document.querySelectorAll('.department-content').forEach(function(content) {
      content.classList.add('hidden');
    });
    document.getElementById('content-' + tab).classList.remove('hidden');
    
    if (tab === 'teachers' && teachersList.length === 0) loadTeachers();
    if (tab === 'students' && studentsList.length === 0) loadStudents();
  };

  // Teachers CRUD
  function loadTeachers() {
    const stored = localStorage.getItem('teachersList');
    teachersList = stored ? JSON.parse(stored) : [];
    renderTeachers();
  }

  function saveTeachersToStorage() {
    localStorage.setItem('teachersList', JSON.stringify(teachersList));
  }

  function renderTeachers() {
    const tbody = document.getElementById('teachersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = teachersList.length ? teachersList.map(function(t, index) {
      return '<tr class="hover:bg-gray-50/80 transition-colors opacity-0 animate-fade-in" style="animation-delay: ' + (index * 0.05) + 's; animation-fill-mode: forwards;"><td class="px-6 py-4"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center"><i class="fa-solid fa-chalkboard-user text-white text-sm"></i></div><span class="text-sm font-semibold text-gray-800">' + escapeHtml(t.name) + '</span></div></td><td class="px-6 py-4"><span class="text-sm text-gray-600">' + escapeHtml(t.position) + '</span></td><td class="px-6 py-4"><span class="text-sm text-gray-600">' + escapeHtml(t.department) + '</span></td><td class="px-6 py-4"><div class="text-sm text-gray-600">' + (t.contact ? '<div><i class="fa-solid fa-phone text-xs mr-1"></i>' + escapeHtml(t.contact) + '</div>' : '') + (t.email ? '<div><i class="fa-solid fa-envelope text-xs mr-1"></i>' + escapeHtml(t.email) + '</div>' : '') + (!t.contact && !t.email ? '<span class="text-gray-400">—</span>' : '') + '</div></td><td class="px-6 py-4"><div class="flex items-center gap-2"><button class="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center transition-colors" onclick="editTeacher(' + index + ')" title="Edit"><i class="fa-solid fa-pen text-sm"></i></button><button class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 flex items-center justify-center transition-colors" onclick="deleteTeacher(' + index + ')" title="Delete"><i class="fa-solid fa-trash text-sm"></i></button></div></td></tr>';
    }).join('') : '<tr><td colspan="5" class="px-6 py-12 text-center"><div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4"><i class="fa-solid fa-chalkboard-user text-2xl text-gray-400"></i></div><p class="text-gray-500 font-medium">No teachers added yet</p></td></tr>';
  }

  window.openTeacherForm = function() {
    document.getElementById('teacherModalTitle').textContent = 'Add Teacher';
    document.getElementById('teacherId').value = '';
    document.getElementById('teacherName').value = '';
    document.getElementById('teacherPosition').value = '';
    document.getElementById('teacherDepartment').value = '';
    document.getElementById('teacherContact').value = '';
    document.getElementById('teacherEmail').value = '';
    openModal('teacherModal');
  };

  window.editTeacher = function(index) {
    const t = teachersList[index];
    if (!t) return;
    document.getElementById('teacherModalTitle').textContent = 'Edit Teacher';
    document.getElementById('teacherId').value = index;
    document.getElementById('teacherName').value = t.name || '';
    document.getElementById('teacherPosition').value = t.position || '';
    document.getElementById('teacherDepartment').value = t.department || '';
    document.getElementById('teacherContact').value = t.contact || '';
    document.getElementById('teacherEmail').value = t.email || '';
    openModal('teacherModal');
  };

  const teacherSaveBtn = document.getElementById('teacherSaveBtn');
  if (teacherSaveBtn) {
    teacherSaveBtn.addEventListener('click', function() {
      const id = document.getElementById('teacherId').value;
      const teacher = {
        name: document.getElementById('teacherName').value.trim(),
        position: document.getElementById('teacherPosition').value.trim(),
        department: document.getElementById('teacherDepartment').value.trim(),
        contact: document.getElementById('teacherContact').value.trim(),
        email: document.getElementById('teacherEmail').value.trim()
      };
      if (!teacher.name || !teacher.position || !teacher.department) {
        toast('Please fill in all required fields', 'error');
        return;
      }
      if (id === '') {
        teachersList.push(teacher);
        toast('Teacher added successfully!');
      } else {
        teachersList[parseInt(id)] = teacher;
        toast('Teacher updated successfully!');
      }
      saveTeachersToStorage();
      renderTeachers();
      closeModal('teacherModal');
    });
  }

  window.deleteTeacher = async function(index) {
    const ok = await confirmDelete('Are you sure you want to delete this teacher?');
    if (!ok) return;
    teachersList.splice(index, 1);
    saveTeachersToStorage();
    renderTeachers();
    toast('Teacher deleted successfully!');
  };

  // Students CRUD
  function loadStudents() {
    const stored = localStorage.getItem('studentsList');
    studentsList = stored ? JSON.parse(stored) : [];
    renderStudents();
  }

  function saveStudentsToStorage() {
    localStorage.setItem('studentsList', JSON.stringify(studentsList));
  }

  function renderStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = studentsList.length ? studentsList.map(function(s, index) {
      return '<tr class="hover:bg-gray-50/80 transition-colors opacity-0 animate-fade-in" style="animation-delay: ' + (index * 0.05) + 's; animation-fill-mode: forwards;"><td class="px-6 py-4"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center"><i class="fa-solid fa-user-graduate text-white text-sm"></i></div><span class="text-sm font-semibold text-gray-800">' + escapeHtml(s.name) + '</span></div></td><td class="px-6 py-4"><span class="text-sm text-gray-600">' + escapeHtml(s.yearLevel) + '</span></td><td class="px-6 py-4"><span class="text-sm text-gray-600">' + (s.section ? escapeHtml(s.section) : '<span class="text-gray-400">—</span>') + '</span></td><td class="px-6 py-4"><div class="text-sm text-gray-600">' + (s.contact ? '<div><i class="fa-solid fa-phone text-xs mr-1"></i>' + escapeHtml(s.contact) + '</div>' : '') + (s.email ? '<div><i class="fa-solid fa-envelope text-xs mr-1"></i>' + escapeHtml(s.email) + '</div>' : '') + (!s.contact && !s.email ? '<span class="text-gray-400">—</span>' : '') + '</div></td><td class="px-6 py-4"><div class="flex items-center gap-2"><button class="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center transition-colors" onclick="editStudent(' + index + ')" title="Edit"><i class="fa-solid fa-pen text-sm"></i></button><button class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 flex items-center justify-center transition-colors" onclick="deleteStudent(' + index + ')" title="Delete"><i class="fa-solid fa-trash text-sm"></i></button></div></td></tr>';
    }).join('') : '<tr><td colspan="5" class="px-6 py-12 text-center"><div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4"><i class="fa-solid fa-user-graduate text-2xl text-gray-400"></i></div><p class="text-gray-500 font-medium">No students added yet</p></td></tr>';
  }

  window.openStudentForm = function() {
    document.getElementById('studentModalTitle').textContent = 'Add Student';
    document.getElementById('studentId').value = '';
    document.getElementById('studentName').value = '';
    document.getElementById('studentYearLevel').value = '';
    document.getElementById('studentSection').value = '';
    document.getElementById('studentContact').value = '';
    document.getElementById('studentEmail').value = '';
    openModal('studentModal');
  };

  window.editStudent = function(index) {
    const s = studentsList[index];
    if (!s) return;
    document.getElementById('studentModalTitle').textContent = 'Edit Student';
    document.getElementById('studentId').value = index;
    document.getElementById('studentName').value = s.name || '';
    document.getElementById('studentYearLevel').value = s.yearLevel || '';
    document.getElementById('studentSection').value = s.section || '';
    document.getElementById('studentContact').value = s.contact || '';
    document.getElementById('studentEmail').value = s.email || '';
    openModal('studentModal');
  };

  const studentSaveBtn = document.getElementById('studentSaveBtn');
  if (studentSaveBtn) {
    studentSaveBtn.addEventListener('click', function() {
      const id = document.getElementById('studentId').value;
      const student = {
        name: document.getElementById('studentName').value.trim(),
        yearLevel: document.getElementById('studentYearLevel').value,
        section: document.getElementById('studentSection').value.trim(),
        contact: document.getElementById('studentContact').value.trim(),
        email: document.getElementById('studentEmail').value.trim()
      };
      if (!student.name || !student.yearLevel) {
        toast('Please fill in all required fields', 'error');
        return;
      }
      if (id === '') {
        studentsList.push(student);
        toast('Student added successfully!');
      } else {
        studentsList[parseInt(id)] = student;
        toast('Student updated successfully!');
      }
      saveStudentsToStorage();
      renderStudents();
      closeModal('studentModal');
    });
  }

  window.deleteStudent = async function(index) {
    const ok = await confirmDelete('Are you sure you want to delete this student?');
    if (!ok) return;
    studentsList.splice(index, 1);
    saveStudentsToStorage();
    renderStudents();
    toast('Student deleted successfully!');
  };

  loadTeachers();
  loadStudents();
})();
