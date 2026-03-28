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

  // Contact link smooth scroll
  const contactLinks = document.querySelectorAll('a[href="#about"]');
  contactLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: 'smooth' });
      }
      // Close mobile menu if open
      if (isMenuOpen) toggleMobileMenu();
    });
  });

})();
