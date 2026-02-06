// Course Catalog and Weekly Schedule Tab Handler
(function() {
  // ====================
  // Main Tab Switching
  // ====================
  const catalogTab = document.getElementById('catalogTab');
  const scheduleTab = document.getElementById('scheduleTab');
  const catalogSection = document.getElementById('catalogSection');
  const scheduleSection = document.getElementById('scheduleSection');

  if (catalogTab && scheduleTab) {
    catalogTab.addEventListener('click', () => {
      catalogTab.className = 'main-tab px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md';
      scheduleTab.className = 'main-tab px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-white text-gray-600 hover:bg-gray-50';
      catalogSection.classList.remove('hidden');
      scheduleSection.classList.add('hidden');
    });

    scheduleTab.addEventListener('click', () => {
      scheduleTab.className = 'main-tab px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md';
      catalogTab.className = 'main-tab px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-white text-gray-600 hover:bg-gray-50';
      scheduleSection.classList.remove('hidden');
      catalogSection.classList.add('hidden');
    });
  }

  // ====================
  // Course Catalog Logic
  // ====================
  let allCourses = [];
  let currentFilter = 'all';

  function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderCourseRow(course) {
    const hasSubjectType = course.subjectType && course.subjectType !== '';
    const subjectTypeDisplay = hasSubjectType 
      ? `<span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">${escapeHtml(course.subjectType)}</span>`
      : '<span class="text-gray-400 text-sm">—</span>';
    
    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4">
          <span class="font-mono font-semibold text-primary-600">${escapeHtml(course.code || '')}</span>
        </td>
        <td class="px-6 py-4">
          <span class="font-medium text-gray-800">${escapeHtml(course.name || '')}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="font-semibold text-gray-700">${escapeHtml(course.unit ? course.unit.toString() : '0')}</span>
        </td>
        <td class="px-6 py-4">
          ${subjectTypeDisplay}
        </td>
        <td class="px-6 py-4">
          <span class="text-gray-700">${escapeHtml(course.yearLevel || '')}</span>
        </td>
        <td class="px-6 py-4">
          <span class="text-gray-700">${escapeHtml(course.semester || '')}</span>
        </td>
      </tr>
    `;
  }

  function renderCourses() {
    const container = document.getElementById('coursesContent');
    if (!container) return;

    let filtered = allCourses;

    if (currentFilter !== 'all') {
      filtered = allCourses.filter(c => c.yearLevel === currentFilter);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
              <i class="fa-solid fa-book-open text-2xl text-gray-400"></i>
            </div>
            <p class="text-gray-500 font-medium">No courses found for this filter</p>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = filtered.map(course => renderCourseRow(course)).join('');
  }

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', function() {
      currentFilter = this.getAttribute('data-filter');
      
      // Update button styles
      document.querySelectorAll('.filter-tab').forEach(b => {
        if (b === this) {
          b.className = 'filter-tab px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm';
        } else {
          b.className = 'filter-tab px-4 py-2 rounded-lg text-sm font-semibold bg-white text-gray-600 hover:bg-gray-50 transition-all';
        }
      });
      
      renderCourses();
    });
  });

  // Load courses
  fetch('/api/courses').then(r => r.json()).then(response => {
    console.log('API Response:', response);
    
    // Check if response has data property (success: true, data: [...])
    let courses = [];
    if (response.success && response.data) {
      courses = response.data;
    } else if (Array.isArray(response)) {
      courses = response;
    }
    
    console.log('Courses:', courses);
    allCourses = courses.filter(c => c.status === 'Active');
    console.log('Active Courses:', allCourses);
    renderCourses();
  }).catch((error) => {
    console.error('Error loading courses:', error);
    const container = document.getElementById('coursesContent');
    if (container) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-12 text-center">
            <i class="bi bi-exclamation-circle text-4xl mb-3 block text-gray-400"></i>
            <p class="text-gray-500">Could not load courses.</p>
          </td>
        </tr>
      `;
    }
  });
})();
