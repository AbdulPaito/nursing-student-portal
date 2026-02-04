(function() {
  'use strict';

  // API Base URL
  window.API_BASE = '';

  // Utility Functions
  function escapeHtml(s) {
    if (s == null || s === '') return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function getEventTypeIcon(title) {
    if (!title) return 'bi-calendar-event';
    const t = title.toLowerCase();
    if (t.indexOf('orientation') !== -1) return 'bi-house-door';
    if (t.indexOf('lab') !== -1) return 'bi-droplet';
    if (t.indexOf('seminar') !== -1) return 'bi-people';
    return 'bi-calendar-event';
  }

  function getItemIcon(itemText) {
    if (!itemText) return 'bi-circle-fill';
    const t = itemText.toLowerCase();
    if (t.indexOf('textbook') !== -1 || t.indexOf('book') !== -1) return 'bi-book';
    if (t.indexOf('laptop') !== -1 || t.indexOf('computer') !== -1) return 'bi-laptop';
    if (t.indexOf('stethoscope') !== -1 || t.indexOf('lab coat') !== -1 || t.indexOf('uniform') !== -1) return 'bi-heart-pulse';
    return 'bi-check2';
  }

  function formatCountdown(dateStr, timeStr) {
    const d = new Date(dateStr + 'T' + (timeStr || '00:00'));
    const now = new Date();
    if (d <= now) return 'In progress or passed';
    const diff = d - now;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  // Mobile Menu Toggle with Hamburger Animation
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const hamburger = document.getElementById('hamburger');
  let isMenuOpen = false;

  function toggleMobileMenu() {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
      mobileMenu.classList.remove('hidden');
      hamburger.classList.add('hamburger-active');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
    } else {
      mobileMenu.classList.add('hidden');
      hamburger.classList.remove('hamburger-active');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  }

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    
    // Close menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        if (isMenuOpen) toggleMobileMenu();
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (isMenuOpen && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        toggleMobileMenu();
      }
    });
  }

  // Active page highlighting
  const currentPage = window.location.pathname;
  const allLinks = document.querySelectorAll('[data-page]');
  allLinks.forEach(function(link) {
    const page = link.getAttribute('data-page');
    let isActive = false;
    if (page === 'home' && (currentPage === '/' || currentPage === '/index.html')) isActive = true;
    else if (page === 'events' && currentPage.includes('events')) isActive = true;
    else if (page === 'subjects' && currentPage.includes('daily-subjects')) isActive = true;
    else if (page === 'announcements' && currentPage.includes('announcements')) isActive = true;
    else if (page === 'about' && currentPage.includes('about')) isActive = true;
    
    if (isActive) {
      link.classList.add('active', 'text-primary');
      if (link.classList.contains('nav-link')) {
        link.classList.add('bg-primary/10');
      }
    }
  });

  // Hero Date
  const heroDate = document.getElementById('heroDate');
  if (heroDate) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    heroDate.textContent = new Date().toLocaleDateString('en-US', options);
  }

  // Scroll Reveal Animation
  const revealElements = document.querySelectorAll('.scroll-reveal');
  function onScrollReveal() {
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        el.classList.add('is-visible');
      }
    });
  }
  window.addEventListener('scroll', onScrollReveal);
  window.addEventListener('load', onScrollReveal);

  // Navbar Scroll Effect
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.classList.add('shadow-lg');
      } else {
        navbar.classList.remove('shadow-lg');
      }
    });
  }

  // Announcements Carousel
  const announcementsInner = document.getElementById('announcementsInner');
  const announcementsPlaceholder = document.getElementById('announcementsPlaceholder');
  const announcementsPrev = document.getElementById('announcementsPrev');
  const announcementsNext = document.getElementById('announcementsNext');
  const announcementDots = document.getElementById('announcementDots');
  
  let announcementIndex = 0;
  let announcementSlides = [];
  let announcementInterval;

  function formatAnnouncementDateTime(dateStr, timeStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + (timeStr ? 'T' + timeStr : ''));
      const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timePart = timeStr ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
      return timePart ? datePart + ' – ' + timePart : datePart;
    } catch (e) { return dateStr + (timeStr ? ' ' + timeStr : ''); }
  }

  function renderAnnouncements(list) {
    if (!list.length) return;
    announcementsPlaceholder.classList.add('hidden');
    
    announcementSlides = list.map(function(a, i) {
      const isUrgent = (a.title && a.title.toLowerCase().indexOf('urgent') !== -1) || (a.urgent === true);
      const dateTimeStr = formatAnnouncementDateTime(a.date, a.time);
      return `
        <div class="flex-shrink-0 w-full px-4" data-index="${i}">
          <div class="bg-white rounded-xl p-5 ${isUrgent ? 'border-l-4 border-red-500 bg-red-50' : 'border border-gray-100'} shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full ${isUrgent ? 'bg-red-100' : 'bg-primary/10'} flex items-center justify-center">
                <i class="bi bi-megaphone-fill ${isUrgent ? 'text-red-500' : 'text-primary'} text-xl"></i>
              </div>
              <div class="flex-grow">
                <h4 class="font-bold text-gray-800 mb-1">${escapeHtml(a.title)}</h4>
                ${dateTimeStr ? `<p class="text-sm text-gray-500 mb-2">${escapeHtml(dateTimeStr)}</p>` : ''}
                <p class="text-gray-600 text-sm">${escapeHtml(a.message)}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    announcementsInner.innerHTML = announcementSlides.join('');
    announcementIndex = 0;
    
    // Create dots
    if (announcementDots) {
      announcementDots.innerHTML = list.map((_, i) => `
        <button class="w-2 h-2 rounded-full transition-all duration-300 ${i === 0 ? 'bg-primary w-6' : 'bg-gray-300'}" data-index="${i}" aria-label="Go to announcement ${i + 1}"></button>
      `).join('');
    }
    
    updateAnnouncementsPosition();
    
    if (announcementInterval) clearInterval(announcementInterval);
    announcementInterval = setInterval(function() {
      announcementIndex = (announcementIndex + 1) % Math.max(1, announcementSlides.length);
      updateAnnouncementsPosition();
    }, 5000);
  }

  function updateAnnouncementsPosition() {
    const total = announcementSlides.length;
    if (total === 0) return;
    announcementIndex = (announcementIndex + total) % total;
    announcementsInner.style.transform = `translateX(-${announcementIndex * 100}%)`;
    
    // Update dots
    if (announcementDots) {
      const dots = announcementDots.querySelectorAll('button');
      dots.forEach((dot, i) => {
        if (i === announcementIndex) {
          dot.classList.remove('bg-gray-300', 'w-2');
          dot.classList.add('bg-primary', 'w-6');
        } else {
          dot.classList.remove('bg-primary', 'w-6');
          dot.classList.add('bg-gray-300', 'w-2');
        }
      });
    }
  }

  if (announcementsPrev) {
    announcementsPrev.addEventListener('click', function() {
      announcementIndex = (announcementIndex - 1 + announcementSlides.length) % Math.max(1, announcementSlides.length);
      updateAnnouncementsPosition();
      resetInterval();
    });
  }

  if (announcementsNext) {
    announcementsNext.addEventListener('click', function() {
      announcementIndex = (announcementIndex + 1) % Math.max(1, announcementSlides.length);
      updateAnnouncementsPosition();
      resetInterval();
    });
  }

  function resetInterval() {
    if (announcementInterval) {
      clearInterval(announcementInterval);
      announcementInterval = setInterval(function() {
        announcementIndex = (announcementIndex + 1) % Math.max(1, announcementSlides.length);
        updateAnnouncementsPosition();
      }, 5000);
    }
  }

  // Click on dots
  if (announcementDots) {
    announcementDots.addEventListener('click', function(e) {
      if (e.target.tagName === 'BUTTON') {
        announcementIndex = parseInt(e.target.dataset.index);
        updateAnnouncementsPosition();
        resetInterval();
      }
    });
  }

  fetch('/api/announcements').then(function(r) { return r.json(); }).then(function(list) {
    renderAnnouncements(list);
  }).catch(function() {});

  // Events with Enhanced Cards
  const upcomingEventsEl = document.getElementById('upcomingEvents');

  fetch('/api/events/upcoming').then(function(r) { return r.json(); }).then(function(events) {
    if (!events.length) {
      upcomingEventsEl.innerHTML = `
        <div class="col-span-2 text-center py-12">
          <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <i class="fa-solid fa-calendar-xmark text-4xl text-gray-300"></i>
          </div>
          <p class="text-lg font-medium text-gray-500">No upcoming events.</p>
          <p class="text-sm text-gray-400 mt-2">Check back later for updates!</p>
        </div>
      `;
      return;
    }
    
    const show = events.slice(0, 4);
    upcomingEventsEl.innerHTML = show.map(e => window.renderEventCard(e)).join('');
    
    updateNextEventBanner(events[0]);
    startCountdownTimer(events[0]);
  }).catch(function() {
    if (upcomingEventsEl) upcomingEventsEl.innerHTML = '<div class="col-span-2 text-center py-8 text-gray-500">Could not load events.</div>';
  });

  // Next Event Banner
  function updateNextEventBanner(next) {
    const banner = document.getElementById('nextEventBanner');
    const text = document.getElementById('nextEventBannerText');
    if (!banner || !text || !next) return;
    
    banner.classList.remove('hidden');
    banner.classList.add('animate-fade-in');
    
    function setBannerText() {
      const countdown = formatCountdown(next.date, next.time);
      text.textContent = `Next: ${next.title} — ${countdown}`;
    }
    
    setBannerText();
    setInterval(setBannerText, 60000);
  }

  // Hero Countdown
  function startCountdownTimer(nextEvent) {
    const countdownDisplay = document.getElementById('countdownDisplay');
    if (!countdownDisplay || !nextEvent) return;

    function updateCountdown() {
      const target = new Date(nextEvent.date + 'T' + (nextEvent.time || '00:00'));
      const now = new Date();
      const diff = target - now;
      
      if (diff <= 0) {
        countdownDisplay.innerHTML = '<span class="text-lg">Event in progress!</span>';
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      countdownDisplay.innerHTML = `
        <span class="animate-count">${String(days).padStart(2, '0')}</span>
        <span class="text-sm opacity-70">:</span>
        <span class="animate-count">${String(hours).padStart(2, '0')}</span>
        <span class="text-sm opacity-70">:</span>
        <span class="animate-count">${String(minutes).padStart(2, '0')}</span>
        <span class="text-sm opacity-70">:</span>
        <span class="animate-count">${String(seconds).padStart(2, '0')}</span>
      `;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // Today's Subjects with Enhanced Cards
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const todayContainer = document.getElementById('todaySubjects');

  fetch('/api/daily-subjects/day/' + today).then(function(r) { return r.json(); }).then(function(data) {
    const subjects = data.subjects || [];
    if (!subjects.length) {
      todayContainer.innerHTML = `
        <div class="text-center py-8 bg-gray-50 rounded-2xl">
          <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center">
            <i class="fa-solid fa-calendar-xmark text-3xl text-gray-300"></i>
          </div>
          <p class="text-gray-500 font-medium">No subjects scheduled for today.</p>
          <p class="text-xs text-gray-400 mt-1">Enjoy your free day!</p>
        </div>
      `;
      return;
    }
    
    todayContainer.innerHTML = subjects.map(s => window.renderCompactSubjectCard(s, today)).join('');
  }).catch(function() {
    if (todayContainer) todayContainer.innerHTML = '<p class="text-gray-500 text-center py-4">Could not load subjects.</p>';
  });

  // Mini Calendar
  const calendarGrid = document.getElementById('miniCalendarGrid');
  const calendarHeader = document.getElementById('miniCalendarHeader');

  fetch('/api/events/upcoming').then(function(r) { return r.json(); }).then(function(events) {
    const eventDates = {};
    const eventTitlesByDate = {};
    
    events.forEach(function(e) {
      if (e.date) {
        eventDates[e.date] = (eventDates[e.date] || 0) + 1;
        if (!eventTitlesByDate[e.date]) eventTitlesByDate[e.date] = [];
        eventTitlesByDate[e.date].push(e.title || 'Event');
      }
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay();
    const daysInMonth = last.getDate();
    const monthName = first.toLocaleString('en-US', { month: 'long' });

    if (calendarHeader) {
      calendarHeader.textContent = monthName + ' ' + year;
    }

    let html = '';
    
    // Empty cells for padding
    for (let i = 0; i < startDay; i++) {
      html += '<span class="aspect-square"></span>';
    }
    
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const titles = eventTitlesByDate[dateStr];
      const hasEvent = titles && titles.length;
      const isToday = now.getDate() === d;
      const tooltip = hasEvent ? titles.join('; ') : '';
      
      const classes = [
        'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
        isToday ? 'bg-primary text-white shadow-md' : 'hover:bg-gray-100',
        hasEvent && !isToday ? 'bg-primary-dark text-white' : '',
        hasEvent ? 'hover:scale-110' : ''
      ].filter(Boolean).join(' ');
      
      html += `<span class="${classes}" title="${escapeHtml(tooltip)}">${d}</span>`;
    }
    
    if (calendarGrid) calendarGrid.innerHTML = html;
  }).catch(function() {
    if (calendarGrid) calendarGrid.innerHTML = '<p class="text-sm text-gray-500 text-center col-span-7 py-4">Unable to load calendar.</p>';
  });
})();
