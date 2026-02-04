/**
 * Minimalist Floating Music Player Component
 * Auto-loads and plays background music based on page location
 * Features: Icon button at top-right, expandable panel, smooth animations
 */

class MinimalistMusicPlayer {
  constructor(location) {
    this.location = location; // 'login' or 'portal'
    this.audio = null;
    this.currentMusic = null;
    this.isPlaying = false;
    this.volume = 0.5;
    this.isExpanded = false;
    this.isMuted = false;
    
    this.init();
  }

  async init() {
    try {
      // Load active music for this location
      const music = await this.loadMusic();
      
      if (music && music._id) {
        this.currentMusic = music;
        this.createPlayer();
        this.setupAudio();
        // Auto-play after a short delay
        setTimeout(() => this.play(), 1000);
      }
    } catch (error) {
      console.error('Music player initialization error:', error);
    }
  }

  async loadMusic() {
    try {
      const response = await fetch(`/api/music/active/${this.location}`);
      const data = await response.json();
      
      if (response.ok && data._id) {
        return data;
      }
      return null;
    } catch (error) {
      console.error('Load music error:', error);
      return null;
    }
  }

  createPlayer() {
    // Check if player already exists
    if (document.getElementById('minimalistMusicPlayer')) {
      return;
    }

    const playerHTML = `
      <div id="minimalistMusicPlayer" class="fixed top-4 right-4 z-50">
        <!-- Icon Button (Always Visible) -->
        <div class="relative">
          <button 
            id="musicIconBtn" 
            class="music-icon-btn group"
            aria-label="Music Control"
          >
            <!-- Animated Icon -->
            <svg class="music-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
            
            <!-- Muted Icon (Hidden by default) -->
            <svg class="muted-icon hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
            
            <!-- Tooltip -->
            <span class="music-tooltip">
              <span id="tooltipText">Play Background Music</span>
            </span>
            
            <!-- Playing Indicator -->
            <span id="playingIndicator" class="playing-indicator hidden">
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
            </span>
          </button>

          <!-- Expanded Panel (Hidden by default) -->
          <div id="musicPanel" class="music-panel hidden">
            <div class="music-panel-content">
              <!-- Track Title -->
              <div class="track-info">
                <div class="track-title" id="trackTitle">${this.currentMusic.title}</div>
                <div class="track-location" id="trackLocation">
                  <i class="fa-solid fa-map-marker-alt"></i>
                  ${this.getLocationLabel(this.currentMusic.location)}
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress-section">
                <div class="time-display">
                  <span id="currentTime">0:00</span>
                  <span id="totalTime">0:00</span>
                </div>
                <div class="progress-bar-container" id="progressBarContainer">
                  <div class="progress-bar" id="progressBar"></div>
                  <div class="progress-handle" id="progressHandle"></div>
                </div>
              </div>

              <!-- Controls -->
              <div class="controls-section">
                <button id="playPauseBtn" class="control-btn play-pause-btn" aria-label="Play/Pause">
                  <i class="fa-solid fa-play"></i>
                </button>
                <button id="muteBtn" class="control-btn mute-btn" aria-label="Mute/Unmute">
                  <i class="fa-solid fa-volume-high"></i>
                </button>
                <div class="volume-control">
                  <i class="fa-solid fa-volume-low"></i>
                  <input type="range" id="volumeSlider" min="0" max="100" value="50" aria-label="Volume">
                  <i class="fa-solid fa-volume-high"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        /* Minimalist Music Player Styles */
        #minimalistMusicPlayer {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Icon Button */
        .music-icon-btn {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .music-icon-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }

        .music-icon-btn:active {
          transform: translateY(0);
        }

        .music-icon,
        .muted-icon {
          width: 24px;
          height: 24px;
          transition: all 0.3s ease;
        }

        .music-icon-btn:hover .music-icon,
        .music-icon-btn:hover .muted-icon {
          transform: scale(1.1);
        }

        .music-icon.hidden,
        .muted-icon.hidden {
          display: none;
        }

        /* Tooltip */
        .music-tooltip {
          position: absolute;
          top: 50%;
          right: 60px;
          transform: translateY(-50%);
          background: rgba(30, 30, 30, 0.95);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .music-tooltip::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -6px;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid rgba(30, 30, 30, 0.95);
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
        }

        .music-icon-btn:hover .music-tooltip {
          opacity: 1;
        }

        /* Playing Indicator */
        .playing-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 3px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .playing-indicator.hidden {
          display: none;
        }

        .wave-bar {
          width: 2px;
          height: 8px;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          border-radius: 2px;
          animation: wave 0.6s ease-in-out infinite;
        }

        .wave-bar:nth-child(2) {
          animation-delay: 0.2s;
        }

        .wave-bar:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes wave {
          0%, 100% {
            transform: scaleY(0.5);
          }
          50% {
            transform: scaleY(1);
          }
        }

        /* Expanded Panel */
        .music-panel {
          position: absolute;
          top: 60px;
          right: 0;
          width: 320px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(124, 58, 237, 0.1);
          overflow: hidden;
          transform-origin: top right;
          animation: expandPanel 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .music-panel.hidden {
          display: none;
        }

        @keyframes expandPanel {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .music-panel-content {
          padding: 20px;
        }

        /* Track Info */
        .track-info {
          margin-bottom: 16px;
        }

        .track-title {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-location {
          font-size: 12px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .track-location i {
          font-size: 10px;
        }

        /* Progress Section */
        .progress-section {
          margin-bottom: 16px;
        }

        .time-display {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .progress-bar-container {
          position: relative;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          cursor: pointer;
          overflow: visible;
        }

        .progress-bar {
          position: absolute;
          height: 100%;
          background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%);
          border-radius: 3px;
          width: 0%;
          transition: width 0.1s linear;
        }

        .progress-handle {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 14px;
          height: 14px;
          background: white;
          border: 2px solid #7c3aed;
          border-radius: 50%;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s ease;
          left: 0%;
        }

        .progress-bar-container:hover .progress-handle {
          opacity: 1;
        }

        /* Controls Section */
        .controls-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .control-btn {
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .play-pause-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .play-pause-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
        }

        .play-pause-btn:active {
          transform: scale(0.95);
        }

        .mute-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          font-size: 14px;
        }

        .mute-btn:hover {
          background: #e2e8f0;
          color: #475569;
        }

        .mute-btn.muted {
          background: #fee2e2;
          color: #dc2626;
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 8px;
        }

        .volume-control i {
          color: #94a3b8;
          font-size: 12px;
        }

        .volume-control input[type="range"] {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: #e2e8f0;
          outline: none;
          -webkit-appearance: none;
        }

        .volume-control input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(124, 58, 237, 0.3);
        }

        .volume-control input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(124, 58, 237, 0.3);
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .music-panel {
            width: 280px;
          }

          .music-tooltip {
            display: none;
          }

          .music-icon-btn {
            width: 44px;
            height: 44px;
          }

          .music-icon,
          .muted-icon {
            width: 22px;
            height: 22px;
          }
        }

        /* Click outside to close */
        .music-panel-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 40;
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', playerHTML);
    this.setupEventListeners();
  }

  setupAudio() {
    this.audio = new Audio(this.currentMusic.filePath);
    this.audio.volume = this.volume;
    this.audio.loop = true;

    // Update progress bar as audio plays
    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    // Update duration when loaded
    this.audio.addEventListener('loadedmetadata', () => {
      document.getElementById('totalTime').textContent = this.formatTime(this.audio.duration);
    });

    // Handle audio end
    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updatePlayPauseButton();
      this.updateIconButton();
    });

    // Handle errors
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
    });
  }

  setupEventListeners() {
    // Icon button click - toggle expand/collapse
    document.getElementById('musicIconBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePanel();
    });

    // Play/Pause button
    document.getElementById('playPauseBtn').addEventListener('click', () => {
      this.togglePlayPause();
    });

    // Mute button
    document.getElementById('muteBtn').addEventListener('click', () => {
      this.toggleMute();
    });

    // Volume slider
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
      this.setVolume(e.target.value / 100);
    });

    // Progress bar click
    document.getElementById('progressBarContainer').addEventListener('click', (e) => {
      this.seek(e);
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('musicPanel');
      const iconBtn = document.getElementById('musicIconBtn');
      
      if (this.isExpanded && !panel.contains(e.target) && !iconBtn.contains(e.target)) {
        this.collapsePanel();
      }
    });
  }

  togglePanel() {
    if (this.isExpanded) {
      this.collapsePanel();
    } else {
      this.expandPanel();
    }
  }

  expandPanel() {
    const panel = document.getElementById('musicPanel');
    panel.classList.remove('hidden');
    this.isExpanded = true;
  }

  collapsePanel() {
    const panel = document.getElementById('musicPanel');
    panel.classList.add('hidden');
    this.isExpanded = false;
  }

  play() {
    if (this.audio) {
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.updatePlayPauseButton();
        this.updateIconButton();
        this.updateTooltip();
      }).catch(error => {
        console.error('Play error:', error);
      });
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
      this.updatePlayPauseButton();
      this.updateIconButton();
      this.updateTooltip();
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  toggleMute() {
    if (this.audio) {
      this.audio.muted = !this.audio.muted;
      this.isMuted = this.audio.muted;
      
      const muteBtn = document.getElementById('muteBtn');
      const icon = muteBtn.querySelector('i');
      
      if (this.isMuted) {
        icon.className = 'fa-solid fa-volume-xmark';
        muteBtn.classList.add('muted');
      } else {
        icon.className = 'fa-solid fa-volume-high';
        muteBtn.classList.remove('muted');
      }
      
      this.updateIconButton();
      this.updateTooltip();
    }
  }

  setVolume(value) {
    this.volume = value;
    if (this.audio) {
      this.audio.volume = value;
    }
  }

  seek(event) {
    if (this.audio) {
      const progressBar = document.getElementById('progressBarContainer');
      const clickX = event.offsetX;
      const width = progressBar.offsetWidth;
      const percentage = clickX / width;
      this.audio.currentTime = this.audio.duration * percentage;
    }
  }

  updateProgress() {
    if (this.audio && this.audio.duration) {
      const percentage = (this.audio.currentTime / this.audio.duration) * 100;
      const progressBar = document.getElementById('progressBar');
      const progressHandle = document.getElementById('progressHandle');
      
      progressBar.style.width = percentage + '%';
      progressHandle.style.left = percentage + '%';
      
      document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
    }
  }

  updatePlayPauseButton() {
    const btn = document.getElementById('playPauseBtn');
    if (!btn) return;
    
    const icon = btn.querySelector('i');
    
    if (this.isPlaying) {
      icon.className = 'fa-solid fa-pause';
    } else {
      icon.className = 'fa-solid fa-play';
    }
  }

  updateIconButton() {
    const musicIcon = document.querySelector('.music-icon');
    const mutedIcon = document.querySelector('.muted-icon');
    const playingIndicator = document.getElementById('playingIndicator');
    
    if (this.isMuted || !this.isPlaying) {
      musicIcon.classList.add('hidden');
      mutedIcon.classList.remove('hidden');
      playingIndicator.classList.add('hidden');
    } else {
      musicIcon.classList.remove('hidden');
      mutedIcon.classList.add('hidden');
      playingIndicator.classList.remove('hidden');
    }
  }

  updateTooltip() {
    const tooltipText = document.getElementById('tooltipText');
    
    if (this.isMuted) {
      tooltipText.textContent = 'Unmute Background Music';
    } else if (this.isPlaying) {
      tooltipText.textContent = 'Pause Background Music';
    } else {
      tooltipText.textContent = 'Play Background Music';
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getLocationLabel(location) {
    const labels = {
      'login': 'Login Page',
      'portal': 'Student Portal',
      'both': 'Both Pages'
    };
    return labels[location] || location;
  }

  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    const player = document.getElementById('minimalistMusicPlayer');
    if (player) {
      player.remove();
    }
  }
}

// Auto-initialize music player when script loads
if (typeof window.musicPlayerLocation !== 'undefined') {
  window.minimalistMusicPlayer = new MinimalistMusicPlayer(window.musicPlayerLocation);
}
