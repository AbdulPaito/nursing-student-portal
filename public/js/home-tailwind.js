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
      const type = a.type || 'General';
      
      // Format date and time properly
      let dayOfWeek = '';
      let formattedDate = a.date || '';
      let formattedTime = '';
      
      if (a.date) {
        try {
          const dateObj = new Date(a.date + 'T00:00:00');
          dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
          formattedDate = a.date;
        }
      }
      
      if (a.time) {
        try {
          const [hours, minutes] = a.time.split(':');
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          formattedTime = `${displayHour}:${minutes} ${ampm}`;
        } catch (e) {
          formattedTime = a.time;
        }
      }
      
      return `
        <div class="flex-shrink-0 w-full px-2" data-index="${i}">
          <!-- Compact Modern Card -->
          <div class="relative max-h-[280px]">
            <!-- Subtle gradient background -->
            <div class="bg-gradient-to-br ${isUrgent ? 'from-red-50 to-rose-50' : 'from-purple-50 to-blue-50'} rounded-2xl shadow-lg border-2 ${isUrgent ? 'border-red-200' : 'border-purple-200'} overflow-hidden">
              
              <!-- Compact Header - No Icon -->
              <div class="p-5 bg-white/60">
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <h3 class="text-lg font-bold text-gray-900 leading-tight">${escapeHtml(a.title)}</h3>
                  <span class="flex-shrink-0 px-2.5 py-1 bg-gradient-to-r ${isUrgent ? 'from-red-500 to-rose-600' : 'from-primary-500 to-secondary-600'} text-white text-xs font-bold rounded-full">
                    ${escapeHtml(type)}
                  </span>
                </div>
                
                <!-- Compact Date/Time -->
                <div class="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  ${dayOfWeek ? `
                    <span class="flex items-center gap-1">
                      <i class="fa-solid fa-calendar text-primary-600"></i>
                      <strong>${escapeHtml(dayOfWeek)}</strong>
                    </span>
                  ` : ''}
                  ${formattedDate ? `
                    <span>${escapeHtml(formattedDate)}</span>
                  ` : ''}
                  ${formattedTime ? `
                    <span class="flex items-center gap-1">
                      <i class="fa-solid fa-clock text-primary-600"></i>
                      ${escapeHtml(formattedTime)}
                    </span>
                  ` : ''}
                </div>
              </div>
              
              <!-- Message Section - Most Visible -->
              <div class="px-5 py-4 bg-white border-t border-purple-100">
                <div class="mb-2">
                  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message:</span>
                </div>
                <p class="text-gray-900 font-semibold text-base leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(a.message)}</p>
              </div>
              
              <!-- Items Section (if any) - Compact -->
              ${a.itemsNeeded && a.itemsNeeded.length ? `
                <div class="px-5 py-3 bg-emerald-50/50 border-t border-emerald-100">
                  <div class="flex items-center gap-2 mb-2">
                    <i class="fa-solid fa-list-check text-emerald-600 text-sm"></i>
                    <h4 class="text-xs font-bold text-gray-700 uppercase">Items Needed</h4>
                  </div>
                  <ul class="space-y-1.5">
                    ${a.itemsNeeded.slice(0, 3).map(item => `
                      <li class="flex items-start gap-2 text-sm text-gray-800">
                        <i class="fa-solid fa-check text-emerald-600 text-xs mt-0.5 flex-shrink-0"></i>
                        <span class="break-words leading-tight">${escapeHtml(item)}</span>
                      </li>
                    `).join('')}
                    ${a.itemsNeeded.length > 3 ? `<li class="text-xs text-gray-500 italic">+${a.itemsNeeded.length - 3} more...</li>` : ''}
                  </ul>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    announcementsInner.innerHTML = announcementSlides.join('');
    announcementIndex = 0;
    
    // Create enhanced pagination dots
    if (announcementDots) {
      announcementDots.innerHTML = list.map((_, i) => `
        <button class="announcement-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Go to announcement ${i + 1}">
          <div class="dot-inner"></div>
        </button>
      `).join('');
      
      // Add styles for enhanced dots
      if (!document.getElementById('announcement-dots-styles')) {
        const dotStyles = document.createElement('style');
        dotStyles.id = 'announcement-dots-styles';
        dotStyles.textContent = `
          .announcement-dot {
            position: relative;
            width: 12px;
            height: 12px;
            cursor: pointer;
            padding: 0;
            border: none;
            background: transparent;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .announcement-dot .dot-inner {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #d1d5db;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .announcement-dot:hover .dot-inner {
            background: #a78bfa;
            transform: scale(1.2);
          }
          
          .announcement-dot.active {
            width: 32px;
          }
          
          .announcement-dot.active .dot-inner {
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
          }
        `;
        document.head.appendChild(dotStyles);
      }
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
      const dots = announcementDots.querySelectorAll('.announcement-dot');
      dots.forEach((dot, i) => {
        if (i === announcementIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
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

  // Events Carousel with Enhanced Cards
  const eventsCarouselTrack = document.getElementById('eventsCarouselTrack');
  const eventsIndicators = document.getElementById('eventsIndicators');
  const eventsPrev = document.getElementById('eventsPrev');
  const eventsNext = document.getElementById('eventsNext');
  let eventIndex = 0;
  let eventSlides = [];
  let eventInterval;

  function renderEventsCarousel(events) {
    // Filter out past events
    const today = new Date().toISOString().split('T')[0];
    const upcomingEvents = events.filter(e => {
      const endDate = e.endDate || e.startDate || e.date;
      return endDate >= today;
    });

    if (!upcomingEvents.length) {
      eventsCarouselTrack.innerHTML = `
        <div class="flex-shrink-0 w-full">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div class="col-span-full text-center py-16">
              <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <i class="fa-solid fa-calendar-xmark text-4xl text-gray-300"></i>
              </div>
              <p class="text-lg font-medium text-gray-500">No upcoming events.</p>
              <p class="text-sm text-gray-400 mt-2">Check back later for updates!</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Split events into groups of 4
    const chunks = [];
    for (let i = 0; i < upcomingEvents.length; i += 4) {
      chunks.push(upcomingEvents.slice(i, i + 4));
    }

    eventSlides = chunks;
    const slidesHtml = chunks.map(chunk => {
      const cardsHtml = chunk.map(e => {
        if (typeof window.renderEventCard === 'function') {
          return window.renderEventCard(e);
        }
        return `<div class="p-4 glass rounded-lg"><h3 class="font-bold">${e.title}</h3><p class="text-sm text-gray-600">${e.date || e.startDate}</p></div>`;
      }).join('');
      
      return `<div class="flex-shrink-0 w-full"><div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">${cardsHtml}</div></div>`;
    }).join('');

    eventsCarouselTrack.innerHTML = slidesHtml;
    
    // Create indicators
    if (chunks.length > 1) {
      eventsIndicators.innerHTML = chunks.map((_, idx) => 
        `<button class="w-2 h-2 rounded-full transition-all duration-300 ${idx === 0 ? 'bg-primary-600 w-6' : 'bg-gray-300 hover:bg-gray-400'}" data-slide="${idx}"></button>`
      ).join('');
      
      eventsIndicators.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function() {
          eventIndex = parseInt(this.getAttribute('data-slide'));
          updateEventsCarouselPosition();
          resetEventInterval();
        });
      });
    } else {
      eventsIndicators.innerHTML = '';
    }

    eventIndex = 0;
    updateEventsCarouselPosition();
    
    // Start auto-play
    if (chunks.length > 1) {
      eventInterval = setInterval(() => {
        eventIndex = (eventIndex + 1) % eventSlides.length;
        updateEventsCarouselPosition();
      }, 5000);
    }
    
    updateNextEventBanner(upcomingEvents[0]);
    startCountdownTimer(upcomingEvents[0]);
  }

  function updateEventsCarouselPosition() {
    if (!eventSlides.length) return;
    eventIndex = (eventIndex + eventSlides.length) % eventSlides.length;
    const translatePct = eventIndex * 100;
    eventsCarouselTrack.style.transform = `translateX(-${translatePct}%)`;
    
    // Update indicators
    eventsIndicators.querySelectorAll('button').forEach((btn, idx) => {
      if (idx === eventIndex) {
        btn.classList.remove('bg-gray-300', 'w-2');
        btn.classList.add('bg-primary-600', 'w-6');
      } else {
        btn.classList.remove('bg-primary-600', 'w-6');
        btn.classList.add('bg-gray-300', 'w-2');
      }
    });
  }

  function resetEventInterval() {
    if (eventInterval) clearInterval(eventInterval);
    if (eventSlides.length > 1) {
      eventInterval = setInterval(() => {
        eventIndex = (eventIndex + 1) % eventSlides.length;
        updateEventsCarouselPosition();
      }, 5000);
    }
  }

  if (eventsPrev) eventsPrev.addEventListener('click', () => {
    eventIndex = (eventIndex - 1 + eventSlides.length) % Math.max(1, eventSlides.length);
    updateEventsCarouselPosition();
    resetEventInterval();
  });

  if (eventsNext) eventsNext.addEventListener('click', () => {
    eventIndex = (eventIndex + 1) % Math.max(1, eventSlides.length);
    updateEventsCarouselPosition();
    resetEventInterval();
  });

  fetch('/api/events/upcoming').then(r => r.json()).then(events => {
    renderEventsCarousel(events);
  }).catch(() => {
    if (eventsCarouselTrack) {
      eventsCarouselTrack.innerHTML = `
        <div class="flex-shrink-0 w-full">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div class="col-span-full text-center py-16">
              <p class="text-gray-500">Could not load events.</p>
            </div>
          </div>
        </div>
      `;
    }
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

  // Hero Countdown - Enhanced Format
  function startCountdownTimer(nextEvent) {
    const countdownDisplay = document.getElementById('countdownDisplay');
    const countdownTitle = document.getElementById('countdownTitle');
    
    if (!countdownDisplay) return;
    
    if (!nextEvent) {
      // No upcoming events
      if (countdownTitle) {
        countdownTitle.innerHTML = '<i class="fa-solid fa-calendar-xmark mr-2"></i>No Upcoming Events';
      }
      countdownDisplay.innerHTML = `
        <div class="text-center py-6">
          <p class="text-lg text-gray-500">No upcoming events. Check back later for updates!</p>
        </div>
      `;
      return;
    }
    
    // Show event title
    if (countdownTitle) {
      countdownTitle.innerHTML = `<i class="fa-solid fa-calendar-star mr-2"></i>Next Event: ${escapeHtml(nextEvent.title)}`;
    }

    function updateCountdown() {
      const target = new Date(nextEvent.date + 'T' + (nextEvent.time || '00:00'));
      const now = new Date();
      const diff = target - now;
      
      if (diff <= 0) {
        countdownDisplay.innerHTML = `
          <div class="text-center py-4">
            <p class="text-xl font-bold text-green-600">
              <i class="fa-solid fa-circle-check mr-2"></i>Event is happening now!
            </p>
          </div>
        `;
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      countdownDisplay.innerHTML = `
        <div class="grid grid-cols-4 gap-4 md:gap-6">
          <div class="text-center">
            <div class="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 shadow-lg">
              <div class="text-3xl md:text-4xl font-bold text-white mb-1">${String(days).padStart(2, '0')}</div>
              <div class="text-xs md:text-sm text-white/80 uppercase tracking-wider">Days</div>
            </div>
          </div>
          <div class="text-center">
            <div class="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl p-4 shadow-lg">
              <div class="text-3xl md:text-4xl font-bold text-white mb-1">${String(hours).padStart(2, '0')}</div>
              <div class="text-xs md:text-sm text-white/80 uppercase tracking-wider">Hours</div>
            </div>
          </div>
          <div class="text-center">
            <div class="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-4 shadow-lg">
              <div class="text-3xl md:text-4xl font-bold text-white mb-1">${String(minutes).padStart(2, '0')}</div>
              <div class="text-xs md:text-sm text-white/80 uppercase tracking-wider">Minutes</div>
            </div>
          </div>
          <div class="text-center">
            <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-4 shadow-lg">
              <div class="text-3xl md:text-4xl font-bold text-white mb-1">${String(seconds).padStart(2, '0')}</div>
              <div class="text-xs md:text-sm text-white/80 uppercase tracking-wider">Seconds</div>
            </div>
          </div>
        </div>
      `;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // Today's Subjects Carousel - 1 subject per slide
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const subjectsCarouselTrack = document.getElementById('subjectsCarouselTrack');
  const subjectsIndicators = document.getElementById('subjectsIndicators');
  const subjectsPrev = document.getElementById('subjectsPrev');
  const subjectsNext = document.getElementById('subjectsNext');
  let subjectIndex = 0;
  let subjectSlides = [];
  let subjectInterval;
  let allTodaySubjects = [];

  function renderSubjectsCarousel(subjects) {
    allTodaySubjects = subjects;
    
    if (!subjects.length) {
      subjectsCarouselTrack.innerHTML = `
        <div class="flex-shrink-0 w-full">
          <div class="text-center py-8 bg-gray-50 rounded-2xl">
            <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center">
              <i class="fa-solid fa-calendar-xmark text-3xl text-gray-300"></i>
            </div>
            <p class="text-gray-500 font-medium">No subjects scheduled for today.</p>
            <p class="text-xs text-gray-400 mt-1">Enjoy your free day!</p>
          </div>
        </div>
      `;
      return;
    }

    // Each subject gets its own slide
    subjectSlides = subjects;
    const slidesHtml = subjects.map((s, idx) => {
      let cardHtml = window.renderCompactSubjectCard ? window.renderCompactSubjectCard(s, today) : '';
      // Make card clickable
      cardHtml = cardHtml.replace('<div class="glass rounded-xl', `<div class="glass rounded-xl cursor-pointer" onclick="showSubjectDetails(${idx})"`);
      return `<div class="flex-shrink-0 w-full">${cardHtml}</div>`;
    }).join('');

    subjectsCarouselTrack.innerHTML = slidesHtml;
    
    // Create indicators
    if (subjects.length > 1) {
      subjectsIndicators.innerHTML = subjects.map((_, idx) => 
        `<button class="w-2 h-2 rounded-full transition-all duration-300 ${idx === 0 ? 'bg-emerald-600 w-6' : 'bg-gray-300 hover:bg-gray-400'}" data-slide="${idx}"></button>`
      ).join('');
      
      subjectsIndicators.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function() {
          subjectIndex = parseInt(this.getAttribute('data-slide'));
          updateSubjectsCarouselPosition();
          resetSubjectInterval();
        });
      });
    } else {
      subjectsIndicators.innerHTML = '';
    }

    subjectIndex = 0;
    updateSubjectsCarouselPosition();
    
    // Start auto-play
    if (subjects.length > 1) {
      subjectInterval = setInterval(() => {
        subjectIndex = (subjectIndex + 1) % subjectSlides.length;
        updateSubjectsCarouselPosition();
      }, 5000);
    }
  }

  function updateSubjectsCarouselPosition() {
    if (!subjectSlides.length) return;
    subjectIndex = (subjectIndex + subjectSlides.length) % subjectSlides.length;
    const translatePct = subjectIndex * 100;
    subjectsCarouselTrack.style.transform = `translateX(-${translatePct}%)`;
    
    // Update indicators
    subjectsIndicators.querySelectorAll('button').forEach((btn, idx) => {
      if (idx === subjectIndex) {
        btn.classList.remove('bg-gray-300', 'w-2');
        btn.classList.add('bg-emerald-600', 'w-6');
      } else {
        btn.classList.remove('bg-emerald-600', 'w-6');
        btn.classList.add('bg-gray-300', 'w-2');
      }
    });
  }

  function resetSubjectInterval() {
    if (subjectInterval) clearInterval(subjectInterval);
    if (subjectSlides.length > 1) {
      subjectInterval = setInterval(() => {
        subjectIndex = (subjectIndex + 1) % subjectSlides.length;
        updateSubjectsCarouselPosition();
      }, 5000);
    }
  }

  if (subjectsPrev) subjectsPrev.addEventListener('click', () => {
    subjectIndex = (subjectIndex - 1 + subjectSlides.length) % Math.max(1, subjectSlides.length);
    updateSubjectsCarouselPosition();
    resetSubjectInterval();
  });

  if (subjectsNext) subjectsNext.addEventListener('click', () => {
    subjectIndex = (subjectIndex + 1) % Math.max(1, subjectSlides.length);
    updateSubjectsCarouselPosition();
    resetSubjectInterval();
  });

  fetch('/api/daily-subjects/day/' + today).then(function(r) { return r.json(); }).then(function(data) {
    const subjects = data.subjects || [];
    renderSubjectsCarousel(subjects);
  }).catch(function() {
    if (subjectsCarouselTrack) {
      subjectsCarouselTrack.innerHTML = `
        <div class="flex-shrink-0 w-full">
          <div class="text-center py-8">
            <p class="text-gray-500">Could not load subjects.</p>
          </div>
        </div>
      `;
    }
  });

  // Show all subjects modal
  window.showAllSubjectsModal = function() {
    if (!allTodaySubjects.length) return;
    
    let modalHTML = `
      <div id="subjectsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.7); animation: fadeIn 0.3s;">
        <div class="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" style="animation: scaleIn 0.3s;">
          <!-- Header -->
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-2xl font-bold mb-1">
                  <i class="fa-solid fa-book-open mr-2"></i>Today's Subjects - ${today}
                </h3>
                <p class="text-emerald-100 text-sm">${allTodaySubjects.length} Subject${allTodaySubjects.length > 1 ? 's' : ''} Scheduled</p>
              </div>
              <button onclick="closeSubjectsModal()" class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:rotate-90">
                <i class="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
          </div>
          
          <!-- Subjects List -->
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-gradient-to-br from-gray-50 to-white">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${allTodaySubjects.map(s => window.renderSubjectCard ? window.renderSubjectCard(s, today) : '').join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
  };

  // Show individual subject details
  window.showSubjectDetails = function(index) {
    if (!allTodaySubjects[index]) return;
    const subject = allTodaySubjects[index];
    
    let modalHTML = `
      <div id="subjectDetailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.7); animation: fadeIn 0.3s;">
        <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" style="animation: scaleIn 0.3s;">
          <!-- Header -->
          <div class="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-2xl font-bold mb-1">
                  <i class="fa-solid fa-book mr-2"></i>Subject Details
                </h3>
              </div>
              <button onclick="closeSubjectDetailModal()" class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:rotate-90">
                <i class="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
          </div>
          
          <!-- Subject Details -->
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-gradient-to-br from-gray-50 to-white">
            ${window.renderSubjectCard ? window.renderSubjectCard(subject, today) : ''}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
  };

  // Close modals
  window.closeSubjectsModal = function() {
    const modal = document.getElementById('subjectsModal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s';
      setTimeout(function() {
        modal.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  };

  window.closeSubjectDetailModal = function() {
    const modal = document.getElementById('subjectDetailModal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s';
      setTimeout(function() {
        modal.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  };

  // Statistics Cards - Fetch Real Data
  const statEvents = document.getElementById('statEvents');
  const statSubjects = document.getElementById('statSubjects');
  const statAnnouncements = document.getElementById('statAnnouncements');
  const statNextEventName = document.getElementById('statNextEventName');
  const statNextEventDate = document.getElementById('statNextEventDate');

  function loadStatistics() {
    fetch('/api/stats/all')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.stats) {
          // Animate numbers counting up
          function animateCount(element, target) {
            if (!element) return;
            const duration = 1000;
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;
            
            const timer = setInterval(function() {
              current += increment;
              if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
              } else {
                element.textContent = Math.floor(current);
              }
            }, 16);
          }
          
          animateCount(statEvents, data.stats.totalEvents);
          animateCount(statSubjects, data.stats.subjectsTodayCount);
          animateCount(statAnnouncements, data.stats.announcementsCount);
        }
      })
      .catch(function(err) {
        console.error('Failed to load statistics:', err);
        // Keep showing 0 on error
      });
    
    // Load next event info for 4th stat card
    fetch('/api/events/upcoming')
      .then(function(r) { return r.json(); })
      .then(function(events) {
        if (events && events.length > 0) {
          const nextEvent = events[0];
          if (statNextEventName) {
            statNextEventName.textContent = nextEvent.title;
            statNextEventName.title = nextEvent.title; // tooltip
          }
          if (statNextEventDate) {
            const eventDate = new Date(nextEvent.date + 'T' + (nextEvent.time || '00:00'));
            const formatted = eventDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
            statNextEventDate.textContent = formatted;
          }
        } else {
          if (statNextEventName) statNextEventName.textContent = '—';
          if (statNextEventDate) statNextEventDate.textContent = 'No upcoming events';
        }
      })
      .catch(function(err) {
        console.error('Failed to load next event:', err);
      });
  }

  // Load statistics on page load
  loadStatistics();

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
        hasEvent && !isToday ? 'bg-emerald-500 text-white' : '',
        hasEvent ? 'hover:scale-110' : ''
      ].filter(Boolean).join(' ');
      
      const dateClickAttr = hasEvent ? `data-date="${dateStr}" data-events='${JSON.stringify(eventTitlesByDate[dateStr] || [])}'` : '';
      html += `<span class="${classes}" title="${escapeHtml(tooltip)}" ${dateClickAttr}>${d}</span>`;
    }
    
    if (calendarGrid) calendarGrid.innerHTML = html;
    
    // Add click event listeners to calendar dates with events
    setTimeout(function() {
      const eventDates = calendarGrid.querySelectorAll('[data-date]');
      eventDates.forEach(function(dateEl) {
        dateEl.addEventListener('click', function() {
          const date = this.getAttribute('data-date');
          showEventModal(date, events);
        });
      });
    }, 100);
  }).catch(function() {
    if (calendarGrid) calendarGrid.innerHTML = '<p class="text-sm text-gray-500 text-center col-span-7 py-4">Unable to load calendar.</p>';
  });

  // Event Modal Function
  function showEventModal(dateStr, allEvents) {
    const dateEvents = allEvents.filter(function(e) { return e.date === dateStr; });
    if (!dateEvents.length) return;

    const dateObj = new Date(dateStr + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let modalHTML = `
      <div id="eventModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.7); animation: fadeIn 0.3s;">
        <div class="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" style="animation: scaleIn 0.3s;">
          <!-- Header -->
          <div class="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-2xl font-bold mb-1">
                  <i class="fa-solid fa-calendar-day mr-2"></i>Events on ${formattedDate}
                </h3>
                <p class="text-primary-100 text-sm">${dateEvents.length} Event${dateEvents.length > 1 ? 's' : ''} Scheduled</p>
              </div>
              <button onclick="closeEventModal()" class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:rotate-90">
                <i class="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
          </div>
          
          <!-- Events List with Enhanced Cards -->
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-gradient-to-br from-gray-50 to-white">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    `;

    dateEvents.forEach(function(event) {
      // Use the same renderEventCard function from enhanced-card-renderer.js
      if (typeof window.renderEventCard === 'function') {
        modalHTML += window.renderEventCard(event);
      } else {
        // Fallback if renderEventCard is not available
        modalHTML += `
          <div class="glass rounded-2xl p-5 border-l-4 border-primary-500">
            <h4 class="text-lg font-bold text-gray-800 mb-2">${escapeHtml(event.title)}</h4>
            ${event.description ? `<p class="text-sm text-gray-600 mb-3">${escapeHtml(event.description)}</p>` : ''}
            <div class="text-xs text-gray-500">
              ${event.time ? `<p><i class="fa-solid fa-clock mr-1"></i>${event.time}</p>` : ''}
              ${event.location ? `<p><i class="fa-solid fa-location-dot mr-1"></i>${escapeHtml(event.location)}</p>` : ''}
            </div>
          </div>
        `;
      }
    });

    modalHTML += `
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('eventModal');
    if (existingModal) existingModal.remove();

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
  }

  // Close modal function
  window.closeEventModal = function() {
    const modal = document.getElementById('eventModal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s';
      setTimeout(function() {
        modal.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  };

  // Close on background click
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'eventModal') {
      closeEventModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeEventModal();
    }
  });
})();
