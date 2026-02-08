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

        <!-- Subject Information -->
        <div class="mb-4">
          <div class="flex items-start gap-3 mb-2">
            <div class="flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center">
              <i class="fa-solid ${config.icon} ${config.text} text-lg"></i>
            </div>
            <div class="flex-grow">
              <h4 class="font-bold text-gray-800 text-lg mb-1">${escapeHtml(subject.name)}</h4>
              ${subject.customName ? `<p class="text-sm ${config.text} font-semibold">${escapeHtml(subject.customName)}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          ${subject.time ? `
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <i class="fa-solid fa-clock text-primary-600"></i>
              <span><strong>Time:</strong> ${escapeHtml(formatTime(subject.time))}</span>
            </div>
          ` : ''}
          
          ${subject.date ? `
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <i class="fa-solid fa-calendar text-primary-600"></i>
              <span><strong>Date:</strong> ${escapeHtml(subject.date)}</span>
            </div>
          ` : ''}
          
          ${subject.location ? `
            <div class="flex items-center gap-2 text-sm text-gray-600 col-span-full">
              <i class="fa-solid fa-location-dot text-primary-600"></i>
              <span><strong>Location:</strong> ${escapeHtml(subject.location)}</span>
            </div>
          ` : ''}
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
    
    return `
      <div class="glass rounded-2xl border-l-4 ${config.border} p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up">
        <!-- Day of Week Badge -->
        <div class="flex items-center justify-between mb-3">
          <span class="px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-bold rounded-full shadow-sm">
            ${escapeHtml(dayOfWeek)}${isMultiDay ? ' <i class="fa-solid fa-arrow-right mx-1"></i>' + escapeHtml(getDayOfWeek(endDate)) : ''}
          </span>
          <span class="px-3 py-1 ${config.badge} text-white text-xs font-bold rounded-full">
            ${escapeHtml(type)}
          </span>
        </div>

        <!-- Event Information -->
        <div class="mb-4">
          <div class="flex items-start gap-3 mb-2">
            <div class="flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center">
              <i class="fa-solid ${config.icon} ${config.text} text-lg"></i>
            </div>
            <div class="flex-grow">
              <!-- Event Title -->
              <div class="mb-2">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  <i class="fa-solid fa-flag mr-1"></i> Event Title
                </p>
                <h4 class="font-bold text-gray-800 text-lg">${escapeHtml(event.title)}</h4>
              </div>
              
              ${event.customName ? `<p class="text-sm ${config.text} font-semibold">${escapeHtml(event.customName)}</p>` : ''}
              
              <!-- Message/Description -->
              ${event.description ? `
                <div class="mt-2">
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    <i class="fa-solid fa-message mr-1"></i> Message
                  </p>
                  <p class="text-sm text-gray-600">${escapeHtml(event.description)}</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <i class="fa-solid fa-clock text-primary-600"></i>
            <span><strong>Time:</strong> ${escapeHtml(formatTime(event.time))}</span>
          </div>
          
          <div class="flex items-center gap-2 text-sm text-gray-600 ${isMultiDay ? 'col-span-full' : ''}">
            <i class="fa-solid fa-calendar text-primary-600"></i>
            <span><strong>Date:</strong> ${isMultiDay ? escapeHtml(formatDateRange(startDate, endDate)) : escapeHtml(startDate)}</span>
          </div>
          
          ${event.location ? `
            <div class="flex items-center gap-2 text-sm text-gray-600 col-span-full">
              <i class="fa-solid fa-location-dot text-primary-600"></i>
              <span><strong>Location:</strong> ${escapeHtml(event.location)}</span>
            </div>
          ` : ''}
          
          ${event.category ? `
            <div class="flex items-center gap-2 text-sm text-gray-600 col-span-full">
              <i class="fa-solid fa-tag text-primary-600"></i>
              <span><strong>Category:</strong> ${escapeHtml(event.category)}</span>
            </div>
          ` : ''}
        </div>

        <!-- Items Needed Section -->
        ${hasItems ? `
          <div class="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
            <p class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <i class="fa-solid fa-list-check text-primary-600"></i>
              Items Needed:
            </p>
            <ul class="space-y-2">
              ${event.items.map(item => `
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

        <!-- Announcement Information -->
        <div class="mb-4">
          <div class="flex items-start gap-3 mb-2">
            <div class="flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center">
              <i class="fa-solid ${config.icon} ${config.text} text-lg"></i>
            </div>
            <div class="flex-grow">
              <h4 class="font-bold text-gray-800 text-lg mb-1">${escapeHtml(announcement.title)}</h4>
              <p class="text-sm text-gray-600 mt-2 leading-relaxed">${escapeHtml(announcement.message)}</p>
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <i class="fa-solid fa-clock text-primary-600"></i>
            <span><strong>Time:</strong> ${escapeHtml(formatTime(announcement.time))}</span>
          </div>
          
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <i class="fa-solid fa-calendar text-primary-600"></i>
            <span><strong>Date:</strong> ${escapeHtml(announcement.date)}</span>
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
            ${subject.time ? `<p class="text-xs text-gray-500"><i class="fa-solid fa-clock mr-1 text-primary-600"></i>${escapeHtml(formatTime(subject.time))}</p>` : ''}
            
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
