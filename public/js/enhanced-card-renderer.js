/**
 * Enhanced Card Renderer for Student Portal
 * Displays all entry information clearly with consistent styling
 * Includes: Day, Subject/Title, Custom Name, Type, Time, Date, Items Needed
 */

(function() {
  'use strict';

  // Utility function to escape HTML
  function escapeHtml(str) {
    if (str == null || str === '') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Format time from HH:MM to 12-hour format
  function formatTime(timeStr) {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  }

  // Format date to readable format
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  }
  
  // Format date range for multi-day events
  function formatDateRange(startDate, endDate) {
    if (!startDate) return '';
    if (!endDate || endDate === startDate) return formatDate(startDate);
    
    try {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      
      const startFormatted = start.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const endFormatted = end.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      return `${startFormatted} - ${endFormatted}`;
    } catch (e) {
      return startDate;
    }
  }

  // Get day of week from date
  function getDayOfWeek(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } catch (e) {
      return '';
    }
  }

  // Type color configurations
  const typeColors = {
    // Subject/Entry types
    'lecture': { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-500', icon: 'fa-book' },
    'theory': { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-500', icon: 'fa-book' },
    'practical/lab': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-600', icon: 'fa-flask' },
    'practical': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-600', icon: 'fa-flask' },
    'lab': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-600', icon: 'fa-microscope' },
    'seminar': { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', badge: 'bg-purple-600', icon: 'fa-users' },
    'workshop': { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', badge: 'bg-orange-600', icon: 'fa-tools' },
    'orientation': { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-600', icon: 'fa-compass' },
    'urgent': { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-600', icon: 'fa-exclamation-triangle' },
    'academic': { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-700', badge: 'bg-teal-600', icon: 'fa-graduation-cap' },
    'general': { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700', badge: 'bg-gray-500', icon: 'fa-circle-info' },
    'other': { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700', badge: 'bg-gray-500', icon: 'fa-tag' }
  };

  // Get type configuration
  function getTypeConfig(type) {
    const typeKey = (type || 'general').toLowerCase();
    return typeColors[typeKey] || typeColors.general;
  }

  /**
   * Render Daily Subject Card
   * Shows: Day of Week, Subject Name, Custom Name, Type, Time, Date, Items Needed
   */
  window.renderSubjectCard = function(subject, dayOfWeek) {
    const type = subject.type || 'Lecture';
    const config = getTypeConfig(type);
    const hasItems = subject.itemsNeeded && subject.itemsNeeded.length > 0;
    const displayName = subject.customName || subject.name;
    
    return `
      <div class="glass rounded-2xl border-l-4 ${config.border} p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up">
        <!-- Day of Week Badge -->
        <div class="flex items-center justify-between mb-3">
          <span class="px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-bold rounded-full shadow-sm">
            ${escapeHtml(dayOfWeek)}
          </span>
          <span class="px-3 py-1 ${config.badge} text-white text-xs font-bold rounded-full">
            ${escapeHtml(type)}
          </span>
        </div>

        <!-- Subject Name Section -->
        <div class="mb-3 bg-gradient-to-br from-blue-50 to-white rounded-lg p-3 border border-blue-200">
          <p class="text-sm text-gray-700 leading-relaxed break-words">
            <span class="font-bold text-gray-800">Subject:</span> ${escapeHtml(subject.name)}
          </p>
        </div>

        <!-- Custom Name/Description Section -->
        ${subject.customName ? `
          <div class="mb-3 bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 border border-gray-200">
            <p class="text-sm text-gray-700 leading-relaxed break-words">
              <span class="font-bold text-gray-800">Description:</span> ${escapeHtml(subject.customName)}
            </p>
          </div>
        ` : ''}

        <!-- Details Grid - 2x2 Layout -->
        <div class="bg-white/50 rounded-lg p-3 mb-3 border border-gray-100">
          <div class="grid grid-cols-2 gap-3 text-xs">
            <!-- Row 1: Time | Date -->
            ${subject.time ? `
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <i class="fa-solid fa-clock text-primary-600 text-xs"></i>
                </div>
                <div class="min-w-0">
                  <span class="text-gray-500 font-medium block text-xs">Time</span>
                  <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(formatTime(subject.time))}</span>
                </div>
              </div>
            ` : ''}
            
            ${subject.date ? `
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
                  <i class="fa-solid fa-calendar text-secondary-600 text-xs"></i>
                </div>
                <div class="min-w-0">
                  <span class="text-gray-500 font-medium block text-xs">Date</span>
                  <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(subject.date)}</span>
                </div>
              </div>
            ` : ''}
            
            <!-- Row 2: Location | Instructor -->
            ${subject.location || subject.room ? `
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <i class="fa-solid fa-location-dot text-green-600 text-xs"></i>
                </div>
                <div class="min-w-0">
                  <span class="text-gray-500 font-medium block text-xs">Location</span>
                  <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(subject.location || subject.room)}</span>
                </div>
              </div>
            ` : ''}
            
            ${subject.instructor ? `
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <i class="fa-solid fa-chalkboard-user text-purple-600 text-xs"></i>
                </div>
                <div class="min-w-0">
                  <span class="text-gray-500 font-medium block text-xs">Instructor</span>
                  <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(subject.instructor)}</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Items Needed Section -->
        ${hasItems ? `
          <div class="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
            <p class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <i class="fa-solid fa-list-check text-primary-600"></i>
              Items Needed:
            </p>
            <ul class="space-y-2">
              ${subject.itemsNeeded.map(item => `
                <li class="flex items-start gap-2 text-sm text-gray-700">
                  <i class="fa-solid fa-circle-check text-green-600 text-xs mt-1 flex-shrink-0"></i>
                  <span class="break-words">${escapeHtml(item)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : `
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500"><i class="fa-solid fa-check-circle text-green-500 mr-1"></i>No items required</p>
          </div>
        `}
      </div>
    `;
  };

  /**
   * Render Event Card
   * Shows: Day of Week, Event Title, Custom Name, Type, Time, Date, Location, Items
   * Enhanced with better message handling and modern card design
   */
  window.renderEventCard = function(event) {
    const type = event.type || 'General';
    const config = getTypeConfig(type);
    const hasItems = event.items && event.items.length > 0;
    const startDate = event.startDate || event.date;
    const endDate = event.endDate;
    const dayOfWeek = getDayOfWeek(startDate);
    const displayName = event.customName || event.title;
    const isMultiDay = endDate && endDate !== startDate;
    const description = event.description || '';
    const isLongMessage = description.length > 120;
    const shortDescription = isLongMessage ? description.substring(0, 120) + '...' : description;
    const eventId = `event-${Math.random().toString(36).substr(2, 9)}`;
    
    return `
      <div class="group relative glass rounded-2xl border-l-4 ${config.border} p-4 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 animate-fade-in-up overflow-hidden">
        
        <!-- Decorative gradient overlay -->
        <div class="absolute top-0 right-0 w-24 h-24 ${config.bg} opacity-20 blur-3xl rounded-full -z-10 group-hover:opacity-40 transition-opacity duration-300"></div>
        
        <!-- Header: Day Badge & Type Badge -->
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="px-3 py-1.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1.5">
            <i class="fa-solid fa-calendar-day text-xs"></i>
            ${escapeHtml(dayOfWeek)}${isMultiDay ? ' <i class="fa-solid fa-arrow-right mx-1"></i>' + escapeHtml(getDayOfWeek(endDate)) : ''}
          </span>
          <span class="px-2.5 py-1 ${config.badge} text-white text-xs font-bold rounded-full shadow-md">
            ${escapeHtml(type)}
          </span>
        </div>

        <!-- Title Section -->
        <div class="mb-3 bg-gradient-to-br from-blue-50 to-white rounded-lg p-3 border border-blue-200">
          <p class="text-sm text-gray-700 leading-relaxed break-words">
            <span class="font-bold text-gray-800">Title:</span> ${escapeHtml(event.title)}
          </p>
        </div>

        <!-- Message Section -->
        ${description ? `
          <div class="mb-3 bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 border border-gray-200">
            <div id="${eventId}-short" class="${isLongMessage ? '' : 'hidden'}">
              <p class="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                <span class="font-bold text-gray-800">Message:</span> ${escapeHtml(shortDescription)}
              </p>
              <button onclick="document.getElementById('${eventId}-short').classList.add('hidden'); document.getElementById('${eventId}-full').classList.remove('hidden')" 
                      class="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
                <i class="fa-solid fa-chevron-down"></i>
                Read More
              </button>
            </div>
            <div id="${eventId}-full" class="${isLongMessage ? 'hidden' : ''}">
              <p class="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                <span class="font-bold text-gray-800">Message:</span> ${escapeHtml(description)}
              </p>
              ${isLongMessage ? `
                <button onclick="document.getElementById('${eventId}-full').classList.add('hidden'); document.getElementById('${eventId}-short').classList.remove('hidden')" 
                        class="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
                  <i class="fa-solid fa-chevron-up"></i>
                  Show Less
                </button>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Event Details Grid - 2x2 Layout -->
        <div class="bg-white/50 rounded-lg p-3 mb-3 border border-gray-100">
          <div class="grid grid-cols-2 gap-3 text-xs">
            <!-- Row 1: Time | Date -->
            <!-- Time -->
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-clock text-primary-600 text-xs"></i>
              </div>
              <div class="min-w-0">
                <span class="text-gray-500 font-medium block text-xs">Time</span>
                <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(formatTime(event.time))}</span>
              </div>
            </div>
            
            <!-- Date -->
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-calendar text-secondary-600 text-xs"></i>
              </div>
              <div class="min-w-0">
                <span class="text-gray-500 font-medium block text-xs">Date</span>
                <span class="text-gray-800 font-bold text-xs truncate block">
                  ${isMultiDay ? escapeHtml(formatDateRange(startDate, endDate)) : escapeHtml(startDate)}
                </span>
              </div>
            </div>
            
            <!-- Row 2: Location | Category -->
            <!-- Location -->
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-location-dot text-green-600 text-xs"></i>
              </div>
              <div class="min-w-0">
                <span class="text-gray-500 font-medium block text-xs">Location</span>
                <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(event.location || 'N/A')}</span>
              </div>
            </div>
            
            <!-- Category -->
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-tag text-purple-600 text-xs"></i>
              </div>
              <div class="min-w-0">
                <span class="text-gray-500 font-medium block text-xs">Category</span>
                <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(event.category || 'General')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Needed Section -->
        ${hasItems ? `
          <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
            <div class="flex items-center gap-1.5 mb-2">
              <div class="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center">
                <i class="fa-solid fa-list-check text-white text-xs"></i>
              </div>
              <span class="text-xs font-bold text-orange-900">Items Needed</span>
            </div>
            <ul class="space-y-1.5">
              ${event.items.map(item => `
                <li class="flex items-start gap-2 text-xs text-gray-800">
                  <i class="fa-solid fa-circle-check text-green-600 text-sm mt-0.5 flex-shrink-0"></i>
                  <span class="break-words flex-1 leading-relaxed">${escapeHtml(item)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <!-- Bottom accent line -->
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    `;
  };

  /**
   * Render Announcement Card
   * Shows: Day of Week, Title, Type, Time, Date, Message, Items
   */
  window.renderAnnouncementCard = function(announcement) {
    const type = announcement.type || 'General';
    const config = getTypeConfig(type);
    const hasItems = announcement.itemsNeeded && announcement.itemsNeeded.length > 0;
    const dayOfWeek = getDayOfWeek(announcement.date);
    const isUrgent = type.toLowerCase() === 'urgent' || (announcement.title && announcement.title.toLowerCase().includes('urgent'));
    
    return `
      <div class="glass rounded-2xl border-l-4 ${config.border} p-5 hover:shadow-xl transition-all duration-300 ${isUrgent ? 'animate-pulse-slow' : ''}">
        <!-- Day of Week Badge -->
        <div class="flex items-center justify-between mb-3">
          <span class="px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-bold rounded-full shadow-sm">
            ${escapeHtml(dayOfWeek)}
          </span>
          <span class="px-3 py-1 ${config.badge} text-white text-xs font-bold rounded-full">
            ${escapeHtml(type)}
          </span>
        </div>

        <!-- Title Section -->
        <div class="mb-3 bg-gradient-to-br from-blue-50 to-white rounded-lg p-3 border border-blue-200">
          <p class="text-sm text-gray-700 leading-relaxed break-words">
            <span class="font-bold text-gray-800">Title:</span> ${escapeHtml(announcement.title)}
          </p>
        </div>

        <!-- Message Section -->
        ${announcement.message ? `
          <div class="mb-3 bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 border border-gray-200">
            <p class="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
              <span class="font-bold text-gray-800">Message:</span> ${escapeHtml(announcement.message)}
            </p>
          </div>
        ` : ''}

        <!-- Details Grid - 2x2 Layout -->
        <div class="bg-white/50 rounded-lg p-3 mb-4 border border-gray-100">
          <div class="grid grid-cols-2 gap-3 text-xs">
            <!-- Row 1: Time | Date -->
            <!-- Time -->
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-clock text-primary-600 text-xs"></i>
              </div>
              <div class="min-w-0">
                <span class="text-gray-500 font-medium block text-xs">Time</span>
                <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(formatTime(announcement.time))}</span>
              </div>
            </div>
            
            <!-- Date -->
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-calendar text-secondary-600 text-xs"></i>
              </div>
              <div class="min-w-0">
                <span class="text-gray-500 font-medium block text-xs">Date</span>
                <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(announcement.date)}</span>
              </div>
            </div>
            
            <!-- Row 2: Location | Category -->
            <!-- Location -->
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-location-dot text-green-600 text-xs"></i>
              </div>
              <div class="min-w-0">
                <span class="text-gray-500 font-medium block text-xs">Location</span>
                <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(announcement.location || 'N/A')}</span>
              </div>
            </div>
            
            <!-- Category -->
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-tag text-purple-600 text-xs"></i>
              </div>
              <div class="min-w-0">
                <span class="text-gray-500 font-medium block text-xs">Category</span>
                <span class="text-gray-800 font-bold text-xs truncate block">${escapeHtml(announcement.category || announcement.type || 'General')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Needed Section (if applicable) -->
        ${hasItems ? `
          <div class="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
            <p class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <i class="fa-solid fa-list-check text-primary-600"></i>
              Items Needed:
            </p>
            <ul class="space-y-2">
              ${announcement.itemsNeeded.map(item => `
                <li class="flex items-start gap-2 text-sm text-gray-700">
                  <i class="fa-solid fa-circle-check text-green-600 text-xs mt-1 flex-shrink-0"></i>
                  <span class="break-words">${escapeHtml(item)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  };

  /**
   * Render Compact Subject Card (for Today's Subjects sidebar)
   */
  window.renderCompactSubjectCard = function(subject, dayOfWeek) {
    const type = subject.type || 'Lecture';
    const config = getTypeConfig(type);
    const hasItems = subject.itemsNeeded && subject.itemsNeeded.length > 0;
    
    return `
      <div class="glass rounded-xl border-l-4 ${config.border} p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center">
            <i class="fa-solid ${config.icon} ${config.text} text-sm"></i>
          </div>
          <div class="flex-grow min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="px-2 py-0.5 ${config.badge} text-white text-xs font-bold rounded-full">${escapeHtml(type)}</span>
              <span class="text-sm font-bold text-gray-800 truncate">${escapeHtml(subject.name)}</span>
            </div>
            ${subject.customName ? `<p class="text-xs ${config.text} font-semibold mb-1 truncate">${escapeHtml(subject.customName)}</p>` : ''}
            
            <!-- Time and Teacher Info -->
            <div class="space-y-1 mt-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
              ${subject.time ? `
                <p class="text-xs text-gray-600 flex items-center gap-1">
                  <i class="fa-solid fa-clock text-primary-600"></i>
                  <span><span class="font-bold text-gray-700">Time:</span> ${escapeHtml(formatTime(subject.time))}</span>
                </p>
              ` : ''}
              
              ${subject.instructor ? `
                <p class="text-xs text-gray-600 flex items-center gap-1">
                  <i class="fa-solid fa-chalkboard-user text-emerald-600"></i>
                  <span><span class="font-bold text-gray-700">Teacher:</span> ${escapeHtml(subject.instructor)}</span>
                </p>
              ` : ''}
              
              ${subject.location || subject.room ? `
                <p class="text-xs text-gray-600 flex items-center gap-1">
                  <i class="fa-solid fa-location-dot text-purple-600"></i>
                  <span><span class="font-bold text-gray-700">Location:</span> ${escapeHtml(subject.location || subject.room)}</span>
                </p>
              ` : ''}
            </div>
            
            ${hasItems ? `
              <details class="mt-2 pt-2 border-t border-gray-200">
                <summary class="text-xs font-semibold text-gray-600 cursor-pointer hover:text-primary-600 transition-colors">
                  <i class="fa-solid fa-chevron-down mr-1"></i>Items (${subject.itemsNeeded.length})
                </summary>
                <ul class="mt-2 space-y-1 pl-4">
                  ${subject.itemsNeeded.map(item => `
                    <li class="text-xs text-gray-600 flex items-start gap-1">
                      <i class="fa-solid fa-circle text-primary-600" style="font-size: 4px; margin-top: 6px;"></i>
                      <span class="break-words">${escapeHtml(item)}</span>
                    </li>
                  `).join('')}
                </ul>
              </details>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  };

})();
