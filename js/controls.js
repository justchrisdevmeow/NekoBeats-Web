(function() {
  const s = NB.settings;
  const elements = {
    barCount: document.getElementById('bar-count'),
    barCountOut: document.getElementById('bar-count-out'),
    heightScale: document.getElementById('height-scale'),
    heightOut: document.getElementById('height-out'),
    sensitivity: document.getElementById('sensitivity'),
    sensitivityOut: document.getElementById('sensitivity-out'),
    opacityVal: document.getElementById('opacity-val'),
    opacityOut: document.getElementById('opacity-out'),
    smoothVal: document.getElementById('smooth-val'),
    smoothOut: document.getElementById('smooth-out'),
    rainbowSpeed: document.getElementById('rainbow-speed'),
    rainbowSpeedOut: document.getElementById('rainbow-speed-out'),
    bloomIntensity: document.getElementById('bloom-intensity'),
    bloomIntensityOut: document.getElementById('bloom-intensity-out'),
    fadeSpeed: document.getElementById('fade-speed'),
    fadeSpeedOut: document.getElementById('fade-speed-out'),
    particleCount: document.getElementById('particle-count'),
    particleCountOut: document.getElementById('particle-count-out'),
    barColor: document.getElementById('bar-color'),
    gradStart: document.getElementById('grad-start'),
    gradEnd: document.getElementById('grad-end')
  };

  // Update display values
  function updateDisplays() {
    elements.barCountOut.textContent = s.barCount;
    elements.heightOut.textContent = s.heightScale.toFixed(1);
    elements.sensitivityOut.textContent = s.sensitivity.toFixed(1);
    elements.opacityOut.textContent = Math.round(s.opacityVal * 100);
    elements.smoothOut.textContent = s.smoothing.toFixed(2);
    elements.rainbowSpeedOut.textContent = s.rainbowSpeed.toFixed(1);
    elements.bloomIntensityOut.textContent = s.bloomIntensity.toFixed(2);
    elements.fadeSpeedOut.textContent = s.fadeSpeed.toFixed(2);
    elements.particleCountOut.textContent = s.particleCount;
  }

  // Sliders
  elements.barCount.addEventListener('input', e => {
    s.barCount = parseInt(e.target.value);
    elements.barCountOut.textContent = s.barCount;
    if (NB.analyser) NB.analyser.fftSize = s.barCount * 2;
  });

  elements.heightScale.addEventListener('input', e => {
    s.heightScale = parseFloat(e.target.value);
    elements.heightOut.textContent = s.heightScale.toFixed(1);
  });

  elements.sensitivity.addEventListener('input', e => {
    s.sensitivity = parseFloat(e.target.value);
    elements.sensitivityOut.textContent = s.sensitivity.toFixed(1);
  });

  elements.opacityVal.addEventListener('input', e => {
    s.opacityVal = parseInt(e.target.value) / 100;
    elements.opacityOut.textContent = e.target.value;
  });

  elements.smoothVal.addEventListener('input', e => {
    s.smoothing = parseFloat(e.target.value);
    elements.smoothOut.textContent = s.smoothing.toFixed(2);
    if (NB.analyser) NB.analyser.smoothingTimeConstant = s.smoothing;
  });

  elements.rainbowSpeed.addEventListener('input', e => {
    s.rainbowSpeed = parseFloat(e.target.value);
    elements.rainbowSpeedOut.textContent = s.rainbowSpeed.toFixed(1);
  });

  elements.bloomIntensity.addEventListener('input', e => {
    s.bloomIntensity = parseFloat(e.target.value);
    elements.bloomIntensityOut.textContent = s.bloomIntensity.toFixed(2);
  });

  elements.fadeSpeed.addEventListener('input', e => {
    s.fadeSpeed = parseFloat(e.target.value);
    elements.fadeSpeedOut.textContent = s.fadeSpeed.toFixed(2);
    Effects.resetTrail();
  });

  elements.particleCount.addEventListener('input', e => {
    s.particleCount = parseInt(e.target.value);
    elements.particleCountOut.textContent = s.particleCount;
  });

  // Color pickers
  elements.barColor.addEventListener('input', e => {
    s.barColor = e.target.value;
  });

  elements.gradStart.addEventListener('input', e => {
    s.gradStart = e.target.value;
  });

  elements.gradEnd.addEventListener('input', e => {
    s.gradEnd = e.target.value;
  });

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      s.mode = btn.dataset.mode;
    });
  });

  // Color mode buttons
  document.querySelectorAll('.color-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      s.colorMode = btn.dataset.cmode;

      // Show/hide color sub-panels
      document.getElementById('solid-color-wrap').style.display = s.colorMode === 'solid' ? 'block' : 'none';
      document.getElementById('gradient-color-wrap').style.display = (s.colorMode === 'gradient_bar' || s.colorMode === 'gradient_global') ? 'block' : 'none';
    });
  });

  // Effect buttons
  document.querySelectorAll('.effect-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const effect = btn.dataset.effect;
      s.effects[effect] = !s.effects[effect];
      if (s.effects[effect]) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  });

  // Show/hide effect-specific controls
  function updateEffectControls() {
    document.getElementById('rainbow-speed-row').style.display = 
      (s.colorMode === 'rainbow' || s.colorMode === 'rainbow_multi') ? 'flex' : 'none';
    document.getElementById('bloom-intensity-row').style.display = 
      (s.effects.bloom || (BarThemes.current().bloom)) ? 'flex' : 'none';
    document.getElementById('fade-speed-row').style.display = 
      (s.effects.fade || (BarThemes.current().fade)) ? 'flex' : 'none';
    document.getElementById('particle-count-row').style.display = 
      (s.effects.particles || (BarThemes.current().particles)) ? 'flex' : 'none';
  }

  // Initial setup
  updateDisplays();
  updateEffectControls();

  // Watch for color mode changes from bar themes
  const origSetTheme = BarThemes.setTheme;
  BarThemes.setTheme = function(name) {
    origSetTheme(name);
    updateEffectControls();
    const theme = BarThemes.current();
    if (theme.color_mode) {
      const btn = document.querySelector(`.color-mode-btn[data-cmode="${theme.color_mode}"]`);
      if (btn) btn.click();
    }
  };

  // Watch settings for effect control visibility
  setInterval(updateEffectControls, 100);
})();
