const NB = {
  audioCtx: null,
  analyser: null,
  source: null,
  buffer: null,
  animId: null,
  startTime: 0,
  startOffset: 0,
  playing: false,
  loop: false,
  lyrics: [],
  showLyrics: true,
  currentLyric: '',
  lyricChangedAt: 0,
  pausedAt: 0,
  cachedBackgroundImage: null,

  settings: {
    barCount: 64,
    heightScale: 1.5,
    sensitivity: 0.3,
    opacityVal: 1.0,
    smoothing: 0.8,
    rainbowSpeed: 1.0,
    bloomIntensity: 0.8,
    fadeSpeed: 0.05,
    particleCount: 50,
    mode: 'bars',
    colorMode: 'solid',
    barColor: '#00cfd1',
    gradStart: '#00cfd1',
    gradEnd: '#ff006e',
    is3D: false,
    customBackground: null,
    soundReactiveGlow: false,
    soundReactiveColorShift: false,
    soundReactiveBurst: false,
    effects: {
      bloom: false,
      fade: false,
      particles: false,
      space: false
    },
    barTheme: 'default'
  }
};

window.NB = NB;
window.isRecording = false;

function parseLRC(text) {
  const lines = text.split('\n');
  const lyrics = [];
  
  for (const line of lines) {
    const match = line.match(/\[(\d+):(\d+)\.?(\d+)?\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centiseconds = match[3] ? parseInt(match[3].padEnd(2, '0')) : 0;
      const time = minutes * 60 + seconds + centiseconds / 100;
      const text = match[4].trim();
      if (text) {
        lyrics.push({ time, text });
      }
    }
  }
  
  return lyrics.sort((a, b) => a.time - b.time);
}

function getCurrentLyric(elapsed) {
  if (!NB.lyrics.length) return '';
  
  for (let i = NB.lyrics.length - 1; i >= 0; i--) {
    if (elapsed >= NB.lyrics[i].time) {
      return NB.lyrics[i].text;
    }
  }
  return '';
}

function setStatus(text, icon) {
  const statusText = document.getElementById('status-text');
  const statusIcon = document.getElementById('status-icon');
  if (statusText) statusText.textContent = text;
  if (icon && statusIcon) statusIcon.textContent = icon;
}

window.setStatus = setStatus;

function formatTime(s) {
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function initAudioCtx() {
  if (!NB.audioCtx) {
    NB.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function setupAnalyser() {
  NB.analyser = NB.audioCtx.createAnalyser();
  NB.analyser.fftSize = NB.settings.barCount * 2;
  NB.analyser.smoothingTimeConstant = NB.settings.smoothing;
}

function play(offset) {
  if (!NB.buffer) return;
  
  if (NB.source) {
    try { NB.source.stop(); } catch(e) {}
    NB.source.disconnect();
    NB.source = null;
  }

  initAudioCtx();
  setupAnalyser();

  NB.source = NB.audioCtx.createBufferSource();
  NB.source.buffer = NB.buffer;
  NB.source.loop = NB.loop;
  NB.source.connect(NB.analyser);
  NB.analyser.connect(NB.audioCtx.destination);

  NB.startOffset = offset;
  NB.startTime = NB.audioCtx.currentTime;
  const currentSource = NB.source;
  
  try {
    NB.source.start(0, offset);
    NB.playing = true;
    NB.pausedAt = 0;
  } catch(e) {
    console.error('Play failed:', e);
    return;
  }

  if (!window.isRecording) {
    const idleScreen = document.getElementById('idle-screen');
    if (idleScreen) idleScreen.style.display = 'none';
  }
  setStatus('playing: ' + (document.getElementById('track-name')?.textContent || 'track'), '▶');

  const playPauseBtn = document.getElementById('play-pause-btn');
  if (playPauseBtn) playPauseBtn.textContent = '⏸';

  updateProgress();

  currentSource.onended = () => {
    if (NB.source === currentSource && !NB.loop && NB.pausedAt === 0 && NB.playing) {
      NB.playing = false;
      if (!window.isRecording) {
        const idleScreen = document.getElementById('idle-screen');
        if (idleScreen) idleScreen.style.display = 'flex';
      }
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) progressBar.style.width = '0%';
      const timeCurrent = document.getElementById('time-current');
      if (timeCurrent) timeCurrent.textContent = '0:00';
      setStatus('ready', '🐱');
      if (playPauseBtn) playPauseBtn.textContent = '▶';
    }
  };

  if (!NB.animId) {
    draw();
  }
}

function pause() {
  if (!NB.playing || !NB.source || !NB.buffer) return;
  
  const elapsed = NB.audioCtx.currentTime - NB.startTime + NB.startOffset;
  NB.pausedAt = Math.min(elapsed, NB.buffer.duration);
  
  try {
    NB.source.stop();
  } catch(e) {}
  
  NB.playing = false;
  setStatus('paused', '⏸');
  const playPauseBtn = document.getElementById('play-pause-btn');
  if (playPauseBtn) playPauseBtn.textContent = '▶';
}

function togglePlayPause() {
  if (!NB.buffer) return;
  
  if (NB.playing) {
    pause();
  } else {
    if (NB.pausedAt > 0) {
      play(NB.pausedAt);
    } else if (NB.buffer) {
      play(0);
    }
  }
}

window.play = play;
window.pause = pause;
window.togglePlayPause = togglePlayPause;

function loadFile(file) {
  setStatus('loading: ' + file.name, '⏳');
  const trackName = document.getElementById('track-name');
  if (trackName) trackName.textContent = file.name;

  initAudioCtx();

  const reader = new FileReader();
  reader.onload = ev => {
    NB.audioCtx.decodeAudioData(ev.target.result, buf => {
      NB.buffer = buf;
      NB.pausedAt = 0;
      const timeTotal = document.getElementById('time-total');
      if (timeTotal) timeTotal.textContent = formatTime(buf.duration);
      play(0);
    }, err => {
      setStatus('error: could not decode audio', '❌');
      console.error(err);
    });
  };
  reader.onerror = () => setStatus('error: could not read file', '❌');
  reader.readAsArrayBuffer(file);
}

function updateProgress() {
  if (!NB.buffer) return;
  
  let elapsed;
  if (NB.playing && NB.source && NB.audioCtx) {
    elapsed = NB.audioCtx.currentTime - NB.startTime + NB.startOffset;
  } else if (NB.pausedAt > 0) {
    elapsed = NB.pausedAt;
  } else {
    return;
  }
  
  elapsed = Math.min(elapsed, NB.buffer.duration);
  const pct = (elapsed / NB.buffer.duration) * 100;
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) progressBar.style.width = pct + '%';
  const timeCurrent = document.getElementById('time-current');
  if (timeCurrent) timeCurrent.textContent = formatTime(elapsed);
}

window.updateProgress = updateProgress;

// Video recording
let mediaRecorder = null;
let recordedChunks = [];
let recordingStream = null;
let canvasStream = null;
let audioStream = null;
let isRecording = false;
let originalCanvasSize = { width: 0, height: 0 };

async function startRecording() {
  const canvas = document.getElementById('canvas');
  const wrap = document.getElementById('canvas-wrap');
  const audioCtx = NB.audioCtx;
  
  if (!NB.buffer) {
    setStatus('No audio loaded', '❌');
    return;
  }
  
  const trackName = document.getElementById('track-name')?.textContent || 'visualization';
  const safeName = trackName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  
  setStatus(`Exporting: ${trackName}`, '📹');
  
  const exportBtn = document.getElementById('export-video-btn');
  if (exportBtn) {
    exportBtn.classList.add('recording');
    exportBtn.textContent = 'recording...';
  }
  
  window.isRecording = true;
  
  originalCanvasSize.width = canvas.width;
  originalCanvasSize.height = canvas.height;
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 32;
  
  if (NB.analyser) draw();
  
  let currentPos = 0;
  if (NB.playing) {
    currentPos = NB.audioCtx.currentTime - NB.startTime + NB.startOffset;
    pause();
  } else if (NB.pausedAt > 0) {
    currentPos = NB.pausedAt;
  }
  
  play(0);
  
  await new Promise(r => setTimeout(r, 100));
  
  canvasStream = canvas.captureStream(60);
  
  const dest = audioCtx.createMediaStreamDestination();
  NB.analyser.connect(dest);
  
  audioStream = dest.stream;
  
  recordingStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioStream.getAudioTracks()
  ]);
  
  mediaRecorder = new MediaRecorder(recordingStream, {
    mimeType: 'video/webm'
  });
  
  recordedChunks = [];
  
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nekobeats_${safeName}_${new Date().toISOString().slice(0,19)}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Saved: ${trackName}`, '💾');
    
    canvas.width = originalCanvasSize.width;
    canvas.height = originalCanvasSize.height;
    draw();
    
    window.isRecording = false;
    isRecording = false;
    
    if (recordingStream) recordingStream.getTracks().forEach(t => t.stop());
    NB.analyser.disconnect(dest);
    isRecording = false;
    window.isRecording = false;
    
    if (exportBtn) {
      exportBtn.classList.remove('recording');
      exportBtn.textContent = 'export video';
    }
    
    setTimeout(() => {
      if (!isRecording) setStatus('ready', '🐱');
    }, 3000);
  };
  
  mediaRecorder.start();
  isRecording = true;
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
  }
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const wrap = document.getElementById('canvas-wrap');

  function resizeCanvas() {
    if (canvas && wrap) {
      canvas.width = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
      // Update size indicator
      const windowSizeSpan = document.getElementById('window-size');
      if (windowSizeSpan) {
        windowSizeSpan.textContent = `${canvas.width}×${canvas.height}`;
      }
    }
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const fileBtn = document.getElementById('file-btn');
  const fileInput = document.getElementById('file-input');
  if (fileBtn && fileInput) {
    fileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) loadFile(file);
    });
  }

  const lrcBtn = document.getElementById('lrc-btn');
  const lrcInput = document.getElementById('lrc-input');
  if (lrcBtn && lrcInput) {
    lrcBtn.addEventListener('click', () => lrcInput.click());
    lrcInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        setStatus('loading lyrics: ' + file.name, '⏳');
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            NB.lyrics = parseLRC(ev.target.result);
            setStatus('lyrics loaded: ' + NB.lyrics.length + ' lines', '🎵');
            setTimeout(() => setStatus('ready', '🐱'), 2000);
          } catch (err) {
            setStatus('error loading lyrics', '❌');
            console.error(err);
          }
        };
        reader.readAsText(file);
      }
    });
  }

  const showLyricsToggle = document.getElementById('show-lyrics-toggle');
  if (showLyricsToggle) {
    showLyricsToggle.addEventListener('change', e => {
      NB.showLyrics = e.target.checked;
    });
  }

  const loopToggle = document.getElementById('loop-toggle');
  if (loopToggle) {
    loopToggle.addEventListener('change', e => {
      NB.loop = e.target.checked;
      if (NB.source) NB.source.loop = NB.loop;
      setStatus(NB.loop ? 'loop enabled' : 'loop disabled', '🔁');
      setTimeout(() => setStatus(NB.playing ? 'playing: ' + (document.getElementById('track-name')?.textContent || 'track') : 'ready', NB.playing ? '▶' : '🐱'), 1500);
    });
  }

  const progressWrap = document.getElementById('progress-wrap');
  if (progressWrap) {
    progressWrap.addEventListener('click', e => {
      if (!NB.buffer) return;
      const rect = progressWrap.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      play(ratio * NB.buffer.duration);
    });
  }

  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (fullscreenBtn && wrap) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        wrap.requestFullscreen().catch(err => console.error(err));
      } else {
        document.exitFullscreen();
      }
    });
  }

  const playPauseBtn = document.getElementById('play-pause-btn');
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
  }

  const exportVideoBtn = document.getElementById('export-video-btn');
  if (exportVideoBtn) {
    exportVideoBtn.addEventListener('click', toggleRecording);
  }

  // Background upload
  const bgUploadBtn = document.getElementById('bg-upload-btn');
  const bgUploadInput = document.getElementById('bg-upload-input');
  const bgSizeIndicator = document.getElementById('bg-size-indicator');
  if (bgUploadBtn && bgUploadInput) {
    bgUploadBtn.addEventListener('click', () => bgUploadInput.click());
    bgUploadInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        setStatus('loading background: ' + file.name, '⏳');
        const reader = new FileReader();
        reader.onload = ev => {
          const img = new Image();
          img.onload = () => {
            NB.settings.customBackground = true;
            NB.cachedBackgroundImage = img;
            if (bgSizeIndicator) bgSizeIndicator.style.display = 'block';
            setStatus('background loaded: ' + file.name, '🖼');
            setTimeout(() => setStatus('ready', '🐱'), 2000);
          };
          img.onerror = () => {
            setStatus('error loading background image', '❌');
          };
          img.src = ev.target.result;
        };
        reader.onerror = () => setStatus('error: could not read file', '❌');
        reader.readAsDataURL(file);
      }
    });
  }

  const bgClearBtn = document.getElementById('bg-clear-btn');
  if (bgClearBtn) {
    bgClearBtn.addEventListener('click', () => {
      NB.settings.customBackground = false;
      NB.cachedBackgroundImage = null;
      if (bgSizeIndicator) bgSizeIndicator.style.display = 'none';
      setStatus('background cleared', '🗑');
      setTimeout(() => setStatus('ready', '🐱'), 1500);
    });
  }

  setStatus('ready', '🐱');
});
