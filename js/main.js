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

  settings: {
    barCount: 64,
    heightScale: 1.5,
    sensitivity: 1.0,
    opacityVal: 1.0,
    smoothing: 0.8,
    rainbowSpeed: 1.0,
    bloomIntensity: 0.5,
    fadeSpeed: 0.05,
    particleCount: 50,
    mode: 'bars',
    colorMode: 'solid',
    barColor: '#00cfd1',
    gradStart: '#00cfd1',
    gradEnd: '#ff006e',
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

function setStatus(text, icon) {
  document.getElementById('status-text').textContent = text;
  if (icon) document.getElementById('status-icon').textContent = icon;
}

window.setStatus = setStatus;

function formatTime(s) {
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
  if (NB.source) {
    try { NB.source.stop(); } catch(e) {}
    NB.source.disconnect();
  }

  setupAnalyser();

  NB.source = NB.audioCtx.createBufferSource();
  NB.source.buffer = NB.buffer;
  NB.source.loop = NB.loop;
  NB.source.connect(NB.analyser);
  NB.analyser.connect(NB.audioCtx.destination);

  NB.startOffset = offset;
  NB.startTime = NB.audioCtx.currentTime;
  NB.source.start(0, offset);
  NB.playing = true;

  document.getElementById('idle-screen').style.display = 'none';
  setStatus('playing: ' + document.getElementById('track-name').textContent, '▶');

  NB.source.onended = () => {
    if (!NB.loop) {
      NB.playing = false;
      document.getElementById('idle-screen').style.display = 'flex';
      document.getElementById('progress-bar').style.width = '0%';
      document.getElementById('time-current').textContent = '0:00';
      setStatus('ready', '🐱');
    }
  };

  if (!NB.animId) {
    draw();
  }
}

window.play = play;

function loadFile(file) {
  setStatus('loading: ' + file.name, '⏳');
  document.getElementById('track-name').textContent = file.name;

  initAudioCtx();

  const reader = new FileReader();
  reader.onload = ev => {
    NB.audioCtx.decodeAudioData(ev.target.result, buf => {
      NB.buffer = buf;
      document.getElementById('time-total').textContent = formatTime(buf.duration);
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
  if (!NB.playing || !NB.buffer) return;
  const elapsed = NB.audioCtx.currentTime - NB.startTime + NB.startOffset;
  const pct = Math.min((elapsed / NB.buffer.duration) * 100, 100);
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('time-current').textContent = formatTime(elapsed);
}

window.updateProgress = updateProgress;
window.formatTime = formatTime;

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const wrap = document.getElementById('canvas-wrap');

  function resizeCanvas() {
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  document.getElementById('file-btn').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });

  document.getElementById('file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) loadFile(file);
  });

  document.getElementById('loop-toggle').addEventListener('change', e => {
    NB.loop = e.target.checked;
    if (NB.source) NB.source.loop = NB.loop;
    setStatus(NB.loop ? 'loop enabled' : 'loop disabled', '🔁');
    setTimeout(() => setStatus(NB.playing ? 'playing: ' + document.getElementById('track-name').textContent : 'ready', NB.playing ? '▶' : '🐱'), 1500);
  });

  document.getElementById('progress-wrap').addEventListener('click', e => {
    if (!NB.buffer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    play(ratio * NB.buffer.duration);
  });

  document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      wrap.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  });

  setStatus('ready', '🐱');
});
