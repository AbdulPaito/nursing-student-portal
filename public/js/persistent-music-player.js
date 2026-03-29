/**
 * Persistent Music Player System
 * Maintains music playback across all pages using localStorage
 * Music continues playing when navigating between pages
 */

(function() {
  'use strict';

  const STORAGE_KEYS = {
    MUSIC_URL: 'nursing_portal_music_url',
    MUSIC_TIME: 'nursing_portal_music_time',
    MUSIC_VOLUME: 'nursing_portal_music_volume',
    MUSIC_MUTED: 'nursing_portal_music_muted',
    MUSIC_PLAYING: 'nursing_portal_music_playing',
    MUSIC_ID: 'nursing_portal_music_id'
  };

  let audio = null;
  let isPlaying = false;
  let isMuted = false;
  let currentVolume = 0.5;
  let updateInterval = null;
  let pageType = 'portal'; // Can be 'portal' or 'login'

  /**
   * Wait for navbar to be available (for dynamically loaded navbars)
   */
  async function waitForNavbar(maxWait = 5000) {
    const startTime = Date.now();
    while (!document.querySelector('nav') && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Additional wait for content to settle
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Wait for mobile menu button to be available
   */
  async function waitForMobileMenuBtn(maxWait = 3000) {
    const startTime = Date.now();
    while (!document.getElementById('mobileMenuBtn') && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Detect page type
  if (window.location.pathname.includes('login.html')) {
    pageType = 'login';
  }

  /**
   * Save current playback state to localStorage
   */
  function saveState() {
    if (!audio || !audio.src) return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.MUSIC_URL, audio.src);
      localStorage.setItem(STORAGE_KEYS.MUSIC_TIME, audio.currentTime.toString());
      localStorage.setItem(STORAGE_KEYS.MUSIC_VOLUME, audio.volume.toString());
      localStorage.setItem(STORAGE_KEYS.MUSIC_MUTED, audio.muted.toString());
      localStorage.setItem(STORAGE_KEYS.MUSIC_PLAYING, isPlaying.toString());
    } catch (e) {
      console.warn('Could not save music state:', e);
    }
  }

  /**
   * Load playback state from localStorage
   */
  function loadState() {
    try {
      return {
        url: localStorage.getItem(STORAGE_KEYS.MUSIC_URL),
        time: parseFloat(localStorage.getItem(STORAGE_KEYS.MUSIC_TIME)) || 0,
        volume: parseFloat(localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME)) || 0.5,
        muted: localStorage.getItem(STORAGE_KEYS.MUSIC_MUTED) === 'true',
        playing: localStorage.getItem(STORAGE_KEYS.MUSIC_PLAYING) === 'true'
      };
    } catch (e) {
      console.warn('Could not load music state:', e);
      return null;
    }
  }

  /**
   * Create minimalist music control UI integrated into navbar
   */
  async function createMusicUI() {
    // Wait for navbar to be loaded if using dynamic loading
    await waitForNavbar();

    // Find navbar to inject music control
    const navbar = document.querySelector('nav');
    if (!navbar) {
      console.warn('Navbar not found, music control not added');
      return;
    }

    // Find the navbar container (the div with flex items)
    const navContainer = navbar.querySelector('.flex.items-center.justify-between');
    if (!navContainer) {
      console.warn('Navbar container not found');
      return;
    }

    // Create music control HTML (inline in navbar)
    const musicControl = document.createElement('div');
    musicControl.id = 'persistentMusicControl';
    musicControl.className = 'relative flex items-center';
    musicControl.innerHTML = `
      <!-- Music Icon Button (Navbar Integrated) -->
      <button id="musicIconBtn" class="navbar-music-btn" title="Background Music" aria-label="Music controls">
        <i class="fa-solid fa-music"></i>
      </button>
      
      <!-- Volume Controls Dropdown -->
      <div id="volumeControlDropdown" class="navbar-music-dropdown">
        <div class="p-3">
          <p class="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="fa-solid fa-music text-primary-600"></i>
            Background Music
          </p>
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-volume-low text-gray-500 text-sm"></i>
            <input type="range" id="volumeSliderControl" class="volume-slider-control" min="0" max="100" value="50">
            <button id="muteToggleBtn" class="mute-btn-control">
              <i class="fa-solid fa-volume-high"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // Insert after Contact link (data-page="about") or before mobile menu button as fallback
    await waitForMobileMenuBtn();
    const contactLink = document.querySelector('a[data-page="about"]');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    if (contactLink && contactLink.parentElement) {
      // Insert after the Contact link in the nav
      contactLink.parentElement.insertBefore(musicControl, contactLink.nextSibling);
    } else if (mobileMenuBtn && mobileMenuBtn.parentNode) {
      // Fallback: insert before mobile menu button
      mobileMenuBtn.parentNode.insertBefore(musicControl, mobileMenuBtn);
    } else {
      // Final fallback: append to nav container
      const existingControl = document.getElementById('persistentMusicControl');
      if (!existingControl) {
        navContainer.appendChild(musicControl);
      }
    }

    // Add styles
    addStyles();
    setupEventListeners();
  }

  /**
   * Add CSS styles for navbar-integrated music control
   */
  function addStyles() {
    if (document.getElementById('persistent-music-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'persistent-music-styles';
    style.textContent = `
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes pulseRing {
        0%, 100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(124, 58, 237, 0.4); }
        50% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 6px rgba(124, 58, 237, 0); }
      }
      
      /* Navbar Music Button */
      .navbar-music-btn {
        width: 35px;
        height: 35px;
        border-radius: 10px;
        background: white;
        border: 2px solid #7c3aed;
        color: #7c3aed;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-right: 15px;
        flex-shrink: 0;
      }
      
      .navbar-music-btn:hover {
        background: #f9fafb;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .navbar-music-btn:active {
        transform: translateY(0);
      }
      
      .navbar-music-btn.playing {
        animation: pulseRing 2s ease-in-out infinite;
      }
      
      .navbar-music-btn.muted {
        border-color: #ef4444;
        color: #ef4444;
      }
      
      .navbar-music-btn i {
        font-size: 16px;
      }
      
      /* Desktop: Larger button */
      @media (min-width: 768px) {
        .navbar-music-btn {
          width: 40px;
          height: 40px;
          margin-right: 20px;
        }
        
        .navbar-music-btn i {
          font-size: 17px;
        }
      }
      
      /* Volume Dropdown */
      .navbar-music-dropdown {
        position: absolute;
        top: 52px;
        right: 0;
        background: white;
        backdrop-filter: blur(20px);
        border: 2px solid #e5e7eb;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        min-width: 200px;
        display: none;
        animation: slideDown 0.3s ease;
        z-index: 1000;
      }
      
      .navbar-music-dropdown.show {
        display: block;
      }
      
      /* Volume Slider */
      .volume-slider-control {
        flex: 1;
        height: 6px;
        border-radius: 3px;
        background: #e5e7eb;
        outline: none;
        -webkit-appearance: none;
        cursor: pointer;
      }
      
      .volume-slider-control::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #7c3aed;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(124, 58, 237, 0.4);
        transition: transform 0.2s ease;
      }
      
      .volume-slider-control::-webkit-slider-thumb:hover {
        transform: scale(1.1);
      }
      
      .volume-slider-control::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #7c3aed;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 6px rgba(124, 58, 237, 0.4);
        transition: transform 0.2s ease;
      }
      
      .volume-slider-control::-moz-range-thumb:hover {
        transform: scale(1.1);
      }
      
      /* Mute Button */
      .mute-btn-control {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        color: #6b7280;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .mute-btn-control:hover {
        background: #e5e7eb;
        color: #374151;
      }
      
      .mute-btn-control.muted {
        background: #fee2e2;
        border-color: #fecaca;
        color: #ef4444;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Setup UI event listeners
   */
  function setupEventListeners() {
    const musicBtn = document.getElementById('musicIconBtn');
    const dropdown = document.getElementById('volumeControlDropdown');
    const muteBtn = document.getElementById('muteToggleBtn');
    const volumeSlider = document.getElementById('volumeSliderControl');

    if (!musicBtn || !dropdown || !muteBtn || !volumeSlider) return;

    // Toggle dropdown only (mute button controls audio)
    musicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !musicBtn.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    // Mute toggle
    muteBtn.addEventListener('click', () => {
      if (!audio) return;
      audio.muted = !audio.muted;
      isMuted = audio.muted;
      saveState();
      updateUI();
    });

    // Volume slider
    volumeSlider.addEventListener('input', (e) => {
      if (!audio) return;
      const volume = e.target.value / 100;
      audio.volume = volume;
      currentVolume = volume;
      
      if (isMuted && volume > 0) {
        audio.muted = false;
        isMuted = false;
      }
      
      saveState();
      updateUI();
    });
  }

  /**
   * Update UI based on player state
   */
  function updateUI() {
    const musicBtn = document.getElementById('musicIconBtn');
    const muteBtn = document.getElementById('muteToggleBtn');
    const volumeSlider = document.getElementById('volumeSliderControl');
    
    if (!musicBtn || !muteBtn) return;

    // Update main music button
    if (isMuted) {
      musicBtn.classList.add('muted');
      musicBtn.classList.remove('playing');
      musicBtn.querySelector('i').className = 'fa-solid fa-volume-xmark text-xl';
    } else if (isPlaying) {
      musicBtn.classList.add('playing');
      musicBtn.classList.remove('muted');
      musicBtn.querySelector('i').className = 'fa-solid fa-music text-xl';
    } else {
      musicBtn.classList.remove('playing', 'muted');
      musicBtn.querySelector('i').className = 'fa-solid fa-music text-xl';
    }

    // Update mute button
    if (isMuted) {
      muteBtn.classList.add('muted');
      muteBtn.querySelector('i').className = 'fa-solid fa-volume-xmark';
    } else {
      muteBtn.classList.remove('muted');
      muteBtn.querySelector('i').className = 'fa-solid fa-volume-high';
    }

    // Update volume slider
    if (volumeSlider && audio) {
      volumeSlider.value = audio.volume * 100;
    }
  }

  /**
   * Initialize or restore audio playback
   */
  async function initMusic() {
    // First, try to restore existing playback state
    const savedState = loadState();
    
    if (savedState && savedState.url && savedState.playing) {
      // Restore existing music
      console.log('🎵 Restoring music from previous session');
      audio = new Audio(savedState.url);
      audio.volume = savedState.volume;
      audio.loop = true;
      currentVolume = savedState.volume;
      
      // Set muted initially for autoplay
      audio.muted = true;
      
      try {
        // Try to resume from saved time
        audio.currentTime = savedState.time;
        await audio.play();
        
        // Unmute after playback starts
        setTimeout(() => {
          audio.muted = savedState.muted;
          isMuted = savedState.muted;
          isPlaying = true;
          updateUI();
          startPeriodicSave();
          console.log('✅ Music restored and playing');
        }, 100);
        
        return; // Successfully restored
      } catch (error) {
        console.log('⚠️ Could not restore music, loading new track');
      }
    }
    
    // Load new music from API
    try {
      const endpoint = pageType === 'login' ? '/api/music/active/login' : '/api/music/active/portal';
      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok && data._id) {
        audio = new Audio(data.filePath);
        audio.volume = currentVolume;
        audio.loop = true;
        audio.muted = true; // Start muted for autoplay
        
        try {
          await audio.play();
          
          setTimeout(() => {
            audio.muted = false;
            isMuted = false;
            isPlaying = true;
            saveState();
            updateUI();
            startPeriodicSave();
            console.log('✅ New music auto-playing');
          }, 100);
          
        } catch (error) {
          console.log('⚠️ Autoplay blocked, will start on user interaction');
          setupAutoplayFallback();
        }
      } else {
        console.log('No active music found');
      }
    } catch (error) {
      console.error('Music initialization error:', error);
    }
  }

  /**
   * Setup fallback for autoplay restrictions
   */
  function setupAutoplayFallback() {
    // Show visual notification to user
    showAutoplayNotification();
    
    const startOnInteraction = () => {
      if (!audio) return;
      
      // Hide notification
      hideAutoplayNotification();
      
      audio.muted = false;
      audio.play().then(() => {
        isMuted = false;
        isPlaying = true;
        saveState();
        updateUI();
        startPeriodicSave();
        console.log('✅ Music started after user interaction');
      }).catch(e => console.error('Play failed:', e));
      
      // Remove listeners
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
    };
    
    document.addEventListener('click', startOnInteraction, { once: true });
    document.addEventListener('keydown', startOnInteraction, { once: true });
    document.addEventListener('touchstart', startOnInteraction, { once: true });
  }

  /**
   * Show autoplay notification overlay
   */
  function showAutoplayNotification() {
    if (document.getElementById('autoplayNotification')) return;
    
    const notification = document.createElement('div');
    notification.id = 'autoplayNotification';
    notification.innerHTML = `
      <div class="autoplay-notification">
        <div class="autoplay-content">
          <i class="fa-solid fa-music"></i>
          <span>Click anywhere to enable background music</span>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .autoplay-notification {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);
        z-index: 9999;
        animation: slideUp 0.5s ease, pulse 2s infinite;
        cursor: pointer;
      }
      
      .autoplay-content {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
      }
      
      .autoplay-content i {
        font-size: 18px;
        animation: bounce 1s infinite;
      }
      
      @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      
      @keyframes pulse {
        0%, 100% { box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4); }
        50% { box-shadow: 0 10px 40px rgba(124, 58, 237, 0.6); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Auto-hide after 10 seconds if not clicked
    setTimeout(() => {
      hideAutoplayNotification();
    }, 10000);
  }

  /**
   * Hide autoplay notification
   */
  function hideAutoplayNotification() {
    const notification = document.getElementById('autoplayNotification');
    if (notification) {
      notification.style.animation = 'slideUp 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }

  /**
   * Periodically save playback position
   */
  function startPeriodicSave() {
    if (updateInterval) clearInterval(updateInterval);
    
    updateInterval = setInterval(() => {
      if (audio && isPlaying) {
        saveState();
      }
    }, 2000); // Save every 2 seconds
  }

  /**
   * Save state before page unload
   */
  window.addEventListener('beforeunload', () => {
    saveState();
  });

  /**
   * Pause other audio when page visibility changes
   */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveState();
    }
  });

  /**
   * Initialize when DOM is ready
   */
  function init() {
    createMusicUI();
    setTimeout(initMusic, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for debugging
  window.persistentMusicPlayer = {
    getState: loadState,
    saveState: saveState,
    getAudio: () => audio
  };
})();
