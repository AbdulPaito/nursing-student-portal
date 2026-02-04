/**
 * Minimalist Music Player - Student Portal Version
 * Top-right floating music icon with volume controls dropdown
 * Auto-plays music immediately on page load
 */

(function() {
  let audio = null;
  let isPlaying = false;
  let isMuted = false;
  let currentVolume = 0.5;

  // Create minimalist music control UI
  function createMusicUI() {
    const musicHTML = `
      <!-- Minimalist Music Control - Top Right Corner -->
      <div id="minimalistMusicControl" class="fixed top-6 right-6 z-50" style="animation: fadeInDown 0.6s ease-out;">
        <!-- Music Icon Button -->
        <button id="musicIconBtn" class="music-icon-btn" title="Background Music" aria-label="Music controls">
          <i class="fa-solid fa-music text-xl"></i>
        </button>
        
        <!-- Volume Controls Dropdown -->
        <div id="volumeControlDropdown" class="volume-dropdown">
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
      </div>
      
      <style>
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseRing {
          0%, 100% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(124, 58, 237, 0.4);
          }
          50% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 8px rgba(124, 58, 237, 0);
          }
        }
        
        .music-icon-btn {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: white;
          border: 2px solid #7c3aed;
          color: #7c3aed;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(124, 58, 237, 0.15);
        }
        
        .music-icon-btn:hover {
          background: #f9fafb;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(124, 58, 237, 0.25);
        }
        
        .music-icon-btn.playing {
          background: white;
          animation: pulseRing 2s ease-in-out infinite;
        }
        
        .music-icon-btn.muted {
          background: white;
          border-color: #ef4444;
          color: #ef4444;
        }
        
        .volume-dropdown {
          position: absolute;
          top: 66px;
          right: 0;
          background: white;
          backdrop-filter: blur(20px);
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          display: none;
          animation: slideDown 0.3s ease;
        }
        
        .volume-dropdown.show {
          display: block;
        }
        
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
      </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', musicHTML);
    setupEventListeners();
  }

  // Setup all event listeners
  function setupEventListeners() {
    const musicBtn = document.getElementById('musicIconBtn');
    const dropdown = document.getElementById('volumeControlDropdown');
    const muteBtn = document.getElementById('muteToggleBtn');
    const volumeSlider = document.getElementById('volumeSliderControl');

    // Toggle dropdown on button click
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
      updateUI();
    });

    // Volume slider
    volumeSlider.addEventListener('input', (e) => {
      if (!audio) return;
      
      const volume = e.target.value / 100;
      audio.volume = volume;
      currentVolume = volume;
      
      // Unmute if volume is adjusted
      if (isMuted && volume > 0) {
        audio.muted = false;
        isMuted = false;
        updateUI();
      }
    });
  }

  // Update UI based on player state
  function updateUI() {
    const musicBtn = document.getElementById('musicIconBtn');
    const muteBtn = document.getElementById('muteToggleBtn');
    
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

    // Update mute button in dropdown
    if (isMuted) {
      muteBtn.classList.add('muted');
      muteBtn.querySelector('i').className = 'fa-solid fa-volume-xmark';
    } else {
      muteBtn.classList.remove('muted');
      muteBtn.querySelector('i').className = 'fa-solid fa-volume-high';
    }
  }

  // Load and initialize music
  async function initMusic() {
    try {
      const response = await fetch('/api/music/active/portal');
      const data = await response.json();

      if (response.ok && data._id) {
        // Create audio element
        audio = new Audio(data.filePath);
        audio.volume = currentVolume;
        audio.loop = true;

        // CRITICAL FIX: Start muted, then unmute after playback begins
        audio.muted = true;
        
        try {
          // Start playing muted
          await audio.play();
          
          // Immediately unmute after play starts
          setTimeout(() => {
            audio.muted = false;
            isMuted = false;
            isPlaying = true;
            updateUI();
            console.log('✅ Music auto-playing (unmuted after start)');
          }, 100);
          
        } catch (error) {
          console.log('⚠️ Autoplay blocked, will start on user interaction');
          
          // Fallback: Start on any user interaction
          const startOnInteraction = () => {
            audio.muted = false;
            audio.play().then(() => {
              isMuted = false;
              isPlaying = true;
              updateUI();
              console.log('✅ Music started after user interaction');
            }).catch(e => console.error('Play failed:', e));
            
            // Remove listeners after first interaction
            document.removeEventListener('click', startOnInteraction);
            document.removeEventListener('keydown', startOnInteraction);
            document.removeEventListener('touchstart', startOnInteraction);
          };
          
          document.addEventListener('click', startOnInteraction, { once: true });
          document.addEventListener('keydown', startOnInteraction, { once: true });
          document.addEventListener('touchstart', startOnInteraction, { once: true });
        }
      } else {
        console.log('No active music found for student portal');
      }
    } catch (error) {
      console.error('Music initialization error:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createMusicUI();
      // Delay music init slightly to ensure page is fully loaded
      setTimeout(initMusic, 300);
    });
  } else {
    createMusicUI();
    setTimeout(initMusic, 300);
  }
})();
