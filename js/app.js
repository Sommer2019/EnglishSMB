const YOUTUBE_VIDEO_ID = 'rEfDmlBKDmk';
const MUSIC_PREF_KEY = 'bgMusicEnabled';
const MUSIC_VOLUME = 45; // Feinjustierte Lautstärke

let player = null;
let isPlayerReady = false;
let musicEnabled = localStorage.getItem(MUSIC_PREF_KEY) !== 'false';

const musicButton = document.getElementById('bg-music-toggle');
const iconSpan = musicButton?.querySelector('.bg-music-icon');
const textSpan = musicButton?.querySelector('.bg-music-text');

function updateButtonUI() {
  if (!musicButton || !iconSpan || !textSpan) {
    return;
  }

  if (!isPlayerReady) {
    iconSpan.textContent = '⏳';
    textSpan.textContent = 'Lädt...';
    musicButton.classList.remove('playing', 'paused');
    return;
  }

  if (musicEnabled) {
    iconSpan.textContent = '🎵';
    textSpan.textContent = 'PLAY';
    musicButton.classList.add('playing');
    musicButton.classList.remove('paused');
  } else {
    iconSpan.textContent = '⏸';
    textSpan.textContent = 'PAUSE';
    musicButton.classList.remove('playing');
    musicButton.classList.add('paused');
  }
}

function persistPreference() {
  localStorage.setItem(MUSIC_PREF_KEY, String(musicEnabled));
}

function ensurePlayback() {
  if (!isPlayerReady || !player || !musicEnabled) {
    return;
  }

  // Try to keep playback alive when the browser pauses background media.
  try {
    const state = player.getPlayerState();
    if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
      player.playVideo();
    }
  } catch (error) {
    // Ignore transient player errors; retry on next cycle.
  }
}

function applyMusicState() {
  if (!isPlayerReady || !player) {
    return;
  }

  if (musicEnabled) {
    player.unMute();
    player.setVolume(MUSIC_VOLUME);
    player.playVideo();
  } else {
    player.mute();
    player.pauseVideo();
  }

  persistPreference();
  updateButtonUI();
}

if (musicButton) {
  musicButton.addEventListener('click', function () {
    musicEnabled = !musicEnabled;
    applyMusicState();
  });
}

document.addEventListener('click', function () {
  if (!isPlayerReady || !player || !musicEnabled) {
    return;
  }

  // First user interaction lifts autoplay restrictions in most browsers.
  player.unMute();
  player.playVideo();
}, { once: true });

window.onYouTubeIframeAPIReady = function () {
  player = new window.YT.Player('youtube-bg-player', {
    height: '1',
    width: '1',
    videoId: YOUTUBE_VIDEO_ID,
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      loop: 1,
      modestbranding: 1,
      playlist: YOUTUBE_VIDEO_ID,
      rel: 0,
    },
    events: {
      onReady: function () {
        isPlayerReady = true;

        // Start muted to comply with autoplay policies.
        player.mute();
        player.playVideo();

        applyMusicState();
      },
      onStateChange: function (event) {
        if (event.data === window.YT.PlayerState.ENDED) {
          player.seekTo(0);
          player.playVideo();
        }
      },
    },
  });
};

updateButtonUI();
window.setInterval(ensurePlayback, 15000);

