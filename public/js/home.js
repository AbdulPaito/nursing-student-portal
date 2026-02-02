(function() {
  'use strict';

  function escapeHtml(s) {
    if (s == null || s === '') return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function getEventTypeIcon(title) {
    if (!title) return 'bi-calendar-event';
    var t = title.toLowerCase();
    if (t.indexOf('orientation') !== -1) return 'bi-house-door';
    if (t.indexOf('lab') !== -1) return 'bi-droplet';
    if (t.indexOf('seminar') !== -1) return 'bi-people';
    return 'bi-calendar-event';
  }

  function getItemIcon(itemText) {
    if (!itemText) return 'bi-circle-fill';
    var t = itemText.toLowerCase();
    if (t.indexOf('textbook') !== -1 || t.indexOf('book') !== -1) return 'bi-book';
    if (t.indexOf('laptop') !== -1 || t.indexOf('computer') !== -1) return 'bi-laptop';
    if (t.indexOf('stethoscope') !== -1 || t.indexOf('lab coat') !== -1 || t.indexOf('uniform') !== -1) return 'bi-heart-pulse';
    return 'bi-check2';
  }

  function formatCountdown(dateStr, timeStr) {
    var d = new Date(dateStr + 'T' + (timeStr || '00:00'));
    var now = new Date();
    if (d <= now) return 'In progress or passed';
    var diff = d - now;
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return days + 'd ' + hours + 'h ' + mins + 'm';
    if (hours > 0) return hours + 'h ' + mins + 'm';
    return mins + 'm';
  }

  // Hero date
  var heroDate = document.getElementById('heroDate');
  if (heroDate) {
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    heroDate.textContent = new Date().toLocaleDateString('en-US', options);
  }

  // Scroll reveal
  var reveal = document.querySelectorAll('.scroll-reveal');
  function onReveal() {
    reveal.forEach(function(el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) el.classList.add('is-visible');
    });
  }
  window.addEventListener('scroll', onReveal);
  window.addEventListener('load', onReveal);

  // Announcements: sliding cards with icons, date, urgent
  var announcementsInner = document.getElementById('announcementsInner');
  var announcementsPlaceholder = document.getElementById('announcementsPlaceholder');
  var announcementsPrev = document.getElementById('announcementsPrev');
  var announcementsNext = document.getElementById('announcementsNext');
  var announcementIndex = 0;
  var announcementSlides = [];
  var announcementInterval;

  function formatAnnouncementDateTime(dateStr, timeStr) {
    if (!dateStr) return '';
    try {
      var d = new Date(dateStr + (timeStr ? 'T' + timeStr : ''));
      var datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      var timePart = timeStr ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
      return timePart ? datePart + ' – ' + timePart : datePart;
    } catch (e) { return dateStr + (timeStr ? ' ' + timeStr : ''); }
  }
  function renderAnnouncements(list) {
    if (!list.length) return;
    announcementsPlaceholder.classList.add('d-none');
    announcementSlides = list.map(function(a, i) {
      var isUrgent = (a.title && a.title.toLowerCase().indexOf('urgent') !== -1) || (a.urgent === true);
      var dateTimeStr = formatAnnouncementDateTime(a.date, a.time);
      return (
        '<div class="announcement-card rounded-3 p-3 flex-shrink-0 ' + (isUrgent ? 'announcement-urgent' : '') + '" data-index="' + i + '">' +
          '<div class="d-flex align-items-start">' +
            '<i class="bi bi-megaphone-fill me-2 mt-1 announcement-icon"></i>' +
            '<div class="flex-grow-1">' +
              '<strong class="d-block">' + escapeHtml(a.title) + '</strong>' +
              (dateTimeStr ? '<span class="d-block small text-muted">' + escapeHtml(dateTimeStr) + '</span>' : '') +
              '<span class="text-muted small d-block mt-1">' + escapeHtml(a.message) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    });
    announcementsInner.innerHTML = announcementSlides.join('');
    announcementIndex = 0;
    var n = announcementSlides.length;
    announcementsInner.style.width = (n * 100) + '%';
    announcementsInner.querySelectorAll('.announcement-card').forEach(function(card) {
      card.style.flex = '0 0 ' + (100 / n) + '%';
    });
    setTimeout(updateAnnouncementsPosition, 50);
    if (announcementInterval) clearInterval(announcementInterval);
    announcementInterval = setInterval(function() {
      announcementIndex = (announcementIndex + 1) % Math.max(1, announcementSlides.length);
      updateAnnouncementsPosition();
    }, 5000);
  }

  function updateAnnouncementsPosition() {
    var cards = announcementsInner.querySelectorAll('.announcement-card:not(.announcement-card-placeholder)');
    if (!cards.length) return;
    var total = cards.length;
    announcementIndex = (announcementIndex + total) % total;
    var translatePct = total ? (announcementIndex * 100 / total) : 0;
    announcementsInner.style.transform = 'translateX(-' + translatePct + '%)';
  }

  if (announcementsPrev) announcementsPrev.addEventListener('click', function() {
    announcementIndex = (announcementIndex - 1 + announcementSlides.length) % Math.max(1, announcementSlides.length);
    updateAnnouncementsPosition();
    if (announcementInterval) { clearInterval(announcementInterval); announcementInterval = setInterval(function() {
      announcementIndex = (announcementIndex + 1) % Math.max(1, announcementSlides.length);
      updateAnnouncementsPosition();
    }, 5000); }
  });
  if (announcementsNext) announcementsNext.addEventListener('click', function() {
    announcementIndex = (announcementIndex + 1) % Math.max(1, announcementSlides.length);
    updateAnnouncementsPosition();
    if (announcementInterval) { clearInterval(announcementInterval); announcementInterval = setInterval(function() {
      announcementIndex = (announcementIndex + 1) % Math.max(1, announcementSlides.length);
      updateAnnouncementsPosition();
    }, 5000); }
  });

  fetch('/api/announcements').then(function(r) { return r.json(); }).then(function(list) {
    renderAnnouncements(list);
  }).catch(function() {});

  // Events: cards with shadow, icon, per-card countdown
  var upcomingEventsEl = document.getElementById('upcomingEvents');
  var eventsList = [];

  function updateEventCountdowns() {
    var now = new Date();
    document.querySelectorAll('.event-countdown').forEach(function(el) {
      var dateStr = el.getAttribute('data-date');
      var timeStr = el.getAttribute('data-time');
      var title = el.getAttribute('data-title');
      if (!dateStr) return;
      el.textContent = formatCountdown(dateStr, timeStr);
    });
  }

  fetch('/api/events/upcoming').then(function(r) { return r.json(); }).then(function(events) {
    eventsList = events;
    if (!events.length) {
      upcomingEventsEl.innerHTML = '<div class="col-12"><p class="text-muted">No upcoming events.</p></div>';
      return;
    }
    var show = events.slice(0, 4);
    upcomingEventsEl.innerHTML = show.map(function(e) {
      var icon = getEventTypeIcon(e.title);
      var itemsArr = e.items && Array.isArray(e.items) ? e.items : [];
      var itemsHtml = '<p class="mb-1"><strong>Items to Bring:</strong></p>' + (itemsArr.length ? '<ul class="list-items mb-0 small"><li>' + itemsArr.map(function(i) { return escapeHtml(i); }).join('</li><li>') + '</li></ul>' : '<p class="mb-0 small text-muted">No items required.</p>');
      return (
        '<div class="col-12 col-md-6">' +
          '<div class="card card-event h-100">' +
            '<div class="card-header card-event-header d-flex align-items-center">' +
              '<i class="bi ' + icon + ' me-2 event-type-icon"></i>' +
              '<span>' + escapeHtml(e.title) + '</span>' +
            '</div>' +
            '<div class="card-body">' +
              '<p class="mb-1"><i class="bi bi-calendar3 me-1 text-muted"></i>' + escapeHtml(e.date) + '</p>' +
              '<p class="mb-1"><i class="bi bi-clock me-1 text-muted"></i>' + escapeHtml(e.time) + '</p>' +
              '<p class="mb-1"><i class="bi bi-geo-alt me-1 text-muted"></i>' + escapeHtml(e.location || '—') + '</p>' +
              '<div class="mt-1">' + itemsHtml + '</div>' +
              '<div class="event-countdown small fw-bold text-primary" data-date="' + escapeHtml(e.date) + '" data-time="' + escapeHtml(e.time || '') + '" data-title="' + escapeHtml(e.title) + '">' + formatCountdown(e.date, e.time) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
    setInterval(updateEventCountdowns, 60000);
    updateNextEventBanner(events[0]);
  }).catch(function() {
    if (upcomingEventsEl) upcomingEventsEl.innerHTML = '<div class="col-12"><p class="text-muted">Could not load events.</p></div>';
  });

  // Next event banner
  function updateNextEventBanner(next) {
    var banner = document.getElementById('nextEventBanner');
    var text = document.getElementById('nextEventBannerText');
    if (!banner || !text || !next) return;
    banner.classList.remove('d-none');
    function setBannerText() {
      text.textContent = 'Next: ' + next.title + ' — ' + formatCountdown(next.date, next.time);
    }
    setBannerText();
    setInterval(setBannerText, 60000);
  }

  // Today's subjects: accordion (items collapsed by default)
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var today = days[new Date().getDay()];
  var todayContainer = document.getElementById('todaySubjects');

  fetch('/api/daily-subjects/day/' + today).then(function(r) { return r.json(); }).then(function(data) {
    var subjects = data.subjects || [];
    if (!subjects.length) {
      todayContainer.innerHTML = '<p class="text-muted">No subjects scheduled for today.</p>';
      return;
    }
    var typeIcons = { theory: 'bi-book', lab: 'bi-droplet', seminar: 'bi-people' };
    todayContainer.innerHTML = subjects.map(function(s, idx) {
      var type = (s.type || 'Theory').toLowerCase();
      var badgeClass = type === 'lab' ? 'badge-lab' : type === 'seminar' ? 'badge-seminar' : 'badge-theory';
      var cardClass = type === 'lab' ? 'card-lab' : type === 'seminar' ? 'card-seminar' : 'card-theory';
      var icon = typeIcons[type] || 'bi-book';
      var id = 'subject-' + idx;
      var hasItems = s.itemsNeeded && s.itemsNeeded.length;
      return (
        '<div class="card card-portal card-subject-accordion ' + cardClass + ' mb-2">' +
          '<div class="card-body py-2">' +
            '<div class="d-flex align-items-center">' +
              '<i class="bi ' + icon + ' me-2 subject-type-icon"></i>' +
              '<span class="badge ' + badgeClass + ' me-2">' + escapeHtml(s.type || 'Theory') + '</span>' +
              '<strong class="flex-grow-1">' + escapeHtml(s.name) + '</strong>' +
              (hasItems ? '<button class="btn btn-sm btn-link p-0 text-primary accordion-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#' + id + '" aria-expanded="false"><i class="bi bi-chevron-down"></i></button>' : '') +
            '</div>' +
            '<div class="' + (hasItems ? 'collapse' : '') + ' mt-2" id="' + id + '"><p class="mb-1"><strong>Items to Bring:</strong></p>' + (hasItems ? '<ul class="list-items mb-0 small">' + (s.itemsNeeded || []).map(function(i) { return '<li><i class="bi ' + getItemIcon(i) + ' item-icon"></i>' + escapeHtml(i) + '</li>'; }).join('') + '</ul>' : '<p class="mb-0 text-muted small">No items required.</p>') + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }).catch(function() {
    if (todayContainer) todayContainer.innerHTML = '<p class="text-muted">Could not load subjects.</p>';
  });

  // Mini calendar
  var calendarGrid = document.getElementById('miniCalendarGrid');
  var calendarHeader = document.querySelector('.mini-calendar-header');
  var calendarLegend = document.getElementById('miniCalendarLegend');

  fetch('/api/events/upcoming').then(function(r) { return r.json(); }).then(function(events) {
    var eventDates = {};
    var eventTitlesByDate = {};
    events.forEach(function(e) {
      if (e.date) {
        eventDates[e.date] = (eventDates[e.date] || 0) + 1;
        if (!eventTitlesByDate[e.date]) eventTitlesByDate[e.date] = [];
        eventTitlesByDate[e.date].push(e.title || 'Event');
      }
    });
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var first = new Date(year, month, 1);
    var last = new Date(year, month + 1, 0);
    var startDay = first.getDay();
    var daysInMonth = last.getDate();
    var monthName = first.toLocaleString('en-US', { month: 'long' });

    if (calendarHeader) calendarHeader.textContent = monthName + ' ' + year;

    var html = '';
    var pad = startDay;
    while (pad--) html += '<span class="mini-cal-day mini-cal-day-empty"></span>';
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var titles = eventTitlesByDate[dateStr];
      var hasEvent = titles && titles.length;
      var isToday = now.getDate() === d && now.getMonth() === month;
      var tooltip = hasEvent ? titles.join('; ') : '';
      html += '<span class="mini-cal-day ' + (hasEvent ? 'mini-cal-day-event' : '') + (isToday ? ' mini-cal-day-today' : '') + '" title="' + escapeHtml(tooltip) + '">' + d + '</span>';
    }
    if (calendarGrid) calendarGrid.innerHTML = html;
    if (calendarLegend) calendarLegend.innerHTML = '<span class="me-2"><span class="mini-cal-legend-dot mini-cal-day-today me-1"></span>Today</span><span><span class="mini-cal-legend-dot mini-cal-day-event me-1"></span>Event</span>';
  }).catch(function() {
    if (calendarGrid) calendarGrid.innerHTML = '<p class="small text-muted">Unable to load calendar.</p>';
  });
})();
