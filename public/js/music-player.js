/**
 * Floating Music Player Component
 * Auto-loads and plays background music based on page location
 */

class MusicPlayer {
  constructor(location) {
    this.location = location; // 'login' or 'portal'
    this.audio = null;
    this.currentMusic = null;
    this.isPlaying = false;
    this.volume = 0.5;
    
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
        // Force auto-play - Music active by default
        setTimeout(() => this.forcePlay(), 500);
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
    if (document.getElementById('floatingMusicPlayer')) {
      return;
    }

    const playerHTML = `
      <div id="floatingMusicPlayer" class="fixed bottom-6 right-6 z-50 animate-fade-in-up">
        <div class="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden" style="width: 320px;">
          <!-- Player Header -->
          <div class="bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-music text-white text-sm"></i>
              <span class="text-white font-semibold text-sm">Background Music</span>
            </div>
            <button id="closeMusicPlayer" class="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
              <i class="fa-solid fa-times text-white text-xs"></i>
            </button>
          </div>
          
          <!-- Player Body -->
          <div class="p-4">
            <!-- Song Info -->
            <div class="mb-4">
              <h3 id="musicTitle" class="font-bold text-gray-800 text-sm mb-1 truncate">${this.currentMusic.title}</h3>
              <p class="text-xs text-gray-500">
                <i class="fa-solid fa-map-marker-alt"></i>
                <span id="musicLocation">${this.getLocationLabel(this.currentMusic.location)}</span>
              </p>
            </div>
            
            <!-- Progress Bar -->
            <div class="mb-4">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span id="currentTime">0:00</span>
                <span id="totalTime">0:00</span>
              </div>
              <div class="relative h-2 bg-gray-200 rounded-full cursor-pointer" id="progressBarContainer">
                <div id="progressBar" class="absolute h-full bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full" style="width: 0%"></div>
              </div>
            </div>
            
            <!-- Controls -->
            <div class="flex items-center justify-center gap-4 mb-4">
              <button id="playPauseBtn" class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-white flex items-center justify-center hover:shadow-lg transition-all">
                <i class="fa-solid fa-play"></i>
              </button>
              <button id="muteBtn" class="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-all">
                <i class="fa-solid fa-volume-high"></i>
              </button>
            </div>
            
            <!-- Volume Control -->
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-volume-low text-gray-500 text-sm"></i>
              <input type="range" id="volumeSlider" min="0" max="100" value="50" class="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer">
              <i class="fa-solid fa-volume-high text-gray-500 text-sm"></i>
            </div>
          </div>
        </div>
        
        <!-- Minimized Toggle Button (hidden by default) -->
        <button id="showMusicPlayer" class="hidden w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-2xl hover:scale-110 transition-all items-center justify-center">
          <i class="fa-solid fa-music"></i>
        </button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', playerHTML);
    this.setupEventListeners();
  }

  setupAudio() {
    this.audio = new Audio(this.currentMusic.filePath);
    this.audio.volume = this.volume;
    this.audio.loop = true; // Loop the music

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
    });

    // Handle errors
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.showError('Failed to load music');
    });
  }

  setupEventListeners() {
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

    // Close button
    document.getElementById('closeMusicPlayer').addEventListener('click', () => {
      this.minimize();
    });

    // Show button (when minimized)
    document.getElementById('showMusicPlayer').addEventListener('click', () => {
      this.maximize();
    });
  }

  play() {
    if (this.audio) {
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.updatePlayPauseButton();
      }).catch(error => {
        console.error('Play error:', error);
        // Some browsers require user interaction before playing audio
      });
    }
  }

  forcePlay() {
    if (this.audio) {
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.updatePlayPauseButton();
        console.log('Background music auto-playing');
      }).catch(error => {
        console.log('Autoplay blocked by browser, will retry on user interaction');
        // Retry on first user interaction (click anywhere)
        const retryPlay = () => {
          this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayPauseButton();
            console.log('Background music started after user interaction');
            document.removeEventListener('click', retryPlay);
            document.removeEventListener('keydown', retryPlay);
          }).catch(e => console.log('Play retry failed:', e));
        };
        
        document.addEventListener('click', retryPlay, { once: true });
        document.addEventListener('keydown', retryPlay, { once: true });
      });
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
      this.updatePlayPauseButton();
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
      const muteBtn = document.getElementById('muteBtn');
      const icon = muteBtn.querySelector('i');
      
      if (this.audio.muted) {
        icon.className = 'fa-solid fa-volume-xmark';
        muteBtn.classList.add('bg-red-100', 'text-red-700');
        muteBtn.classList.remove('bg-gray-100', 'text-gray-700');
      } else {
        icon.className = 'fa-solid fa-volume-high';
        muteBtn.classList.remove('bg-red-100', 'text-red-700');
        muteBtn.classList.add('bg-gray-100', 'text-gray-700');
      }
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
    if (this.audio) {
      const percentage = (this.audio.currentTime / this.audio.duration) * 100;
      document.getElementById('progressBar').style.width = percentage + '%';
      document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
    }
  }

  updatePlayPauseButton() {
    const btn = document.getElementById('playPauseBtn');
    const icon = btn.querySelector('i');
    
    if (this.isPlaying) {
      icon.className = 'fa-solid fa-pause';
    } else {
      icon.className = 'fa-solid fa-play';
    }
  }

  minimize() {
    document.querySelector('#floatingMusicPlayer > div').classList.add('hidden');
    document.getElementById('showMusicPlayer').classList.remove('hidden');
    document.getElementById('showMusicPlayer').classList.add('flex');
  }

  maximize() {
    document.querySelector('#floatingMusicPlayer > div').classList.remove('hidden');
    document.getElementById('showMusicPlayer').classList.add('hidden');
    document.getElementById('showMusicPlayer').classList.remove('flex');
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

  showError(message) {
    console.error(message);
    // Could show a notification here
  }

  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    const player = document.getElementById('floatingMusicPlayer');
    if (player) {
      player.remove();
    }
  }
}

// Auto-initialize music player when script loads
// The page should set window.musicPlayerLocation before loading this script
if (typeof window.musicPlayerLocation !== 'undefined') {
  window.musicPlayer = new MusicPlayer(window.musicPlayerLocation);
}
