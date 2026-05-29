(function() {
  document.addEventListener('DOMContentLoaded', () => {
    function exportTheme() {
      const s = NB.settings;
      const theme = {
        version: 1,
        exported: new Date().toISOString(),
        settings: {
          barCount: s.barCount,
          heightScale: s.heightScale,
          sensitivity: s.sensitivity,
          opacityVal: s.opacityVal,
          smoothing: s.smoothing,
          rainbowSpeed: s.rainbowSpeed,
          bloomIntensity: s.bloomIntensity,
          fadeSpeed: s.fadeSpeed,
          particleCount: s.particleCount,
          mode: s.mode,
          colorMode: s.colorMode,
          barColor: s.barColor,
          gradStart: s.gradStart,
          gradEnd: s.gradEnd,
          effects: { ...s.effects },
          barTheme: s.barTheme
        }
      };
      const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nekobeats_theme_${new Date().toISOString().slice(0,19)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('theme exported', '💾');
    }

    function importTheme(json) {
      if (!json.version || !json.settings) {
        throw new Error('Invalid theme file: missing version or settings');
      }
      const s = json.settings;
      const NBset = NB.settings;

      if (s.barCount) NBset.barCount = s.barCount;
      if (s.heightScale) NBset.heightScale = s.heightScale;
      if (s.sensitivity) NBset.sensitivity = s.sensitivity;
      if (s.opacityVal) NBset.opacityVal = s.opacityVal;
      if (s.smoothing) NBset.smoothing = s.smoothing;
      if (s.rainbowSpeed) NBset.rainbowSpeed = s.rainbowSpeed;
      if (s.bloomIntensity) NBset.bloomIntensity = s.bloomIntensity;
      if (s.fadeSpeed) NBset.fadeSpeed = s.fadeSpeed;
      if (s.particleCount) NBset.particleCount = s.particleCount;
      if (s.mode) NBset.mode = s.mode;
      if (s.colorMode) NBset.colorMode = s.colorMode;
      if (s.barColor) NBset.barColor = s.barColor;
      if (s.gradStart) NBset.gradStart = s.gradStart;
      if (s.gradEnd) NBset.gradEnd = s.gradEnd;
      if (s.effects) NBset.effects = { ...s.effects };
      if (s.barTheme) NBset.barTheme = s.barTheme;

      const uiUpdates = {
        barCount: () => {
          const el = document.getElementById('bar-count');
          if (el) { el.value = NBset.barCount; el.dispatchEvent(new Event('input')); }
        },
        heightScale: () => {
          const el = document.getElementById('height-scale');
          if (el) { el.value = NBset.heightScale; el.dispatchEvent(new Event('input')); }
        },
        sensitivity: () => {
          const el = document.getElementById('sensitivity');
          if (el) { el.value = NBset.sensitivity; el.dispatchEvent(new Event('input')); }
        },
        opacityVal: () => {
          const el = document.getElementById('opacity-val');
          if (el) { el.value = NBset.opacityVal * 100; el.dispatchEvent(new Event('input')); }
        },
        smoothing: () => {
          const el = document.getElementById('smooth-val');
          if (el) { el.value = NBset.smoothing; el.dispatchEvent(new Event('input')); }
        },
        rainbowSpeed: () => {
          const el = document.getElementById('rainbow-speed');
          if (el) { el.value = NBset.rainbowSpeed; el.dispatchEvent(new Event('input')); }
        },
        bloomIntensity: () => {
          const el = document.getElementById('bloom-intensity');
          if (el) { el.value = NBset.bloomIntensity; el.dispatchEvent(new Event('input')); }
        },
        fadeSpeed: () => {
          const el = document.getElementById('fade-speed');
          if (el) { el.value = NBset.fadeSpeed; el.dispatchEvent(new Event('input')); }
        },
        particleCount: () => {
          const el = document.getElementById('particle-count');
          if (el) { el.value = NBset.particleCount; el.dispatchEvent(new Event('input')); }
        },
        mode: () => {
          const btn = document.querySelector(`.mode-btn[data-mode="${NBset.mode}"]`);
          if (btn) btn.click();
        },
        colorMode: () => {
          const btn = document.querySelector(`.color-mode-btn[data-cmode="${NBset.colorMode}"]`);
          if (btn) btn.click();
        },
        barColor: () => {
          const el = document.getElementById('bar-color');
          if (el) { el.value = NBset.barColor; el.dispatchEvent(new Event('input')); }
        },
        gradStart: () => {
          const el = document.getElementById('grad-start');
          if (el) { el.value = NBset.gradStart; el.dispatchEvent(new Event('input')); }
        },
        gradEnd: () => {
          const el = document.getElementById('grad-end');
          if (el) { el.value = NBset.gradEnd; el.dispatchEvent(new Event('input')); }
        },
        effects: () => {
          document.querySelectorAll('.effect-btn').forEach(btn => {
            const effect = btn.dataset.effect;
            if (NBset.effects[effect]) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
        },
        barTheme: () => {
          const btn = document.querySelector(`.bartheme-btn[data-theme="${NBset.barTheme}"]`);
          if (btn) btn.click();
        }
      };

      Object.keys(uiUpdates).forEach(key => uiUpdates[key]());
      Effects.resetTrail();
      setStatus('theme imported', '✅');
    }

    const exportBtn = document.getElementById('export-theme-btn');
    const importBtn = document.getElementById('import-theme-btn');
    const importInput = document.getElementById('import-theme-input');
    
    if (exportBtn) exportBtn.addEventListener('click', exportTheme);
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        setStatus('importing theme...', '⏳');
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const json = JSON.parse(ev.target.result);
            importTheme(json);
          } catch (err) {
            setStatus('import failed: ' + err.message, '❌');
            console.error(err);
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      });
    }
  });
})();
