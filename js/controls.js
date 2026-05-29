(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const s = NB.settings;
    
    function syncRangeAndNumber(rangeId, numberId, settingKey) {
      const range = document.getElementById(rangeId);
      const number = document.getElementById(numberId);
      if (!range || !number) return;
      
      const update = () => {
        let val = parseFloat(range.value);
        number.value = val;
        s[settingKey] = val;
        if (settingKey === 'barCount' && NB.analyser) {
          NB.analyser.fftSize = s.barCount * 2;
        }
        if (settingKey === 'smoothing' && NB.analyser) {
          NB.analyser.smoothingTimeConstant = s.smoothing;
        }
        if (settingKey === 'fadeSpeed') {
          Effects.resetTrail();
        }
        const outEl = document.getElementById(settingKey + '-out');
        if (outEl) {
          if (settingKey === 'opacityVal') outEl.textContent = Math.round(s.opacityVal * 100);
          else if (settingKey === 'heightScale') outEl.textContent = s.heightScale.toFixed(1);
          else if (settingKey === 'sensitivity') outEl.textContent = s.sensitivity.toFixed(2);
          else if (settingKey === 'smoothing') outEl.textContent = s.smoothing.toFixed(2);
          else if (settingKey === 'rainbowSpeed') outEl.textContent = s.rainbowSpeed.toFixed(1);
          else if (settingKey === 'bloomIntensity') outEl.textContent = s.bloomIntensity.toFixed(2);
          else if (settingKey === 'fadeSpeed') outEl.textContent = s.fadeSpeed.toFixed(2);
          else if (settingKey === 'particleCount') outEl.textContent = s.particleCount;
          else outEl.textContent = s[settingKey];
        }
      };
      
      const updateFromNumber = () => {
        let val = parseFloat(number.value);
        const min = parseFloat(range.min);
        const max = parseFloat(range.max);
        val = Math.min(max, Math.max(min, val));
        range.value = val;
        number.value = val;
        s[settingKey] = val;
        if (settingKey === 'barCount' && NB.analyser) {
          NB.analyser.fftSize = s.barCount * 2;
        }
        if (settingKey === 'smoothing' && NB.analyser) {
          NB.analyser.smoothingTimeConstant = s.smoothing;
        }
        if (settingKey === 'fadeSpeed') {
          Effects.resetTrail();
        }
        const outEl = document.getElementById(settingKey + '-out');
        if (outEl) {
          if (settingKey === 'opacityVal') outEl.textContent = Math.round(s.opacityVal * 100);
          else if (settingKey === 'heightScale') outEl.textContent = s.heightScale.toFixed(1);
          else if (settingKey === 'sensitivity') outEl.textContent = s.sensitivity.toFixed(2);
          else if (settingKey === 'smoothing') outEl.textContent = s.smoothing.toFixed(2);
          else if (settingKey === 'rainbowSpeed') outEl.textContent = s.rainbowSpeed.toFixed(1);
          else if (settingKey === 'bloomIntensity') outEl.textContent = s.bloomIntensity.toFixed(2);
          else if (settingKey === 'fadeSpeed') outEl.textContent = s.fadeSpeed.toFixed(2);
          else if (settingKey === 'particleCount') outEl.textContent = s.particleCount;
          else outEl.textContent = s[settingKey];
        }
      };
      
      range.addEventListener('input', update);
      number.addEventListener('input', updateFromNumber);
      range.value = s[settingKey];
      number.value = s[settingKey];
    }
    
    syncRangeAndNumber('bar-count', 'bar-count-num', 'barCount');
    syncRangeAndNumber('height-scale', 'height-scale-num', 'heightScale');
    syncRangeAndNumber('sensitivity', 'sensitivity-num', 'sensitivity');
    syncRangeAndNumber('opacity-val', 'opacity-val-num', 'opacityVal');
    syncRangeAndNumber('smooth-val', 'smooth-val-num', 'smoothing');
    syncRangeAndNumber('rainbow-speed', 'rainbow-speed-num', 'rainbowSpeed');
    syncRangeAndNumber('bloom-intensity', 'bloom-intensity-num', 'bloomIntensity');
    syncRangeAndNumber('fade-speed', 'fade-speed-num', 'fadeSpeed');
    syncRangeAndNumber('particle-count', 'particle-count-num', 'particleCount');
    
    document.getElementById('bar-color').addEventListener('input', e => s.barColor = e.target.value);
    document.getElementById('grad-start').addEventListener('input', e => s.gradStart = e.target.value);
    document.getElementById('grad-end').addEventListener('input', e => s.gradEnd = e.target.value);
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        s.mode = btn.dataset.mode;
      });
    });
    
    document.querySelectorAll('.color-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        s.colorMode = btn.dataset.cmode;
        document.getElementById('solid-color-wrap').style.display = s.colorMode === 'solid' ? 'block' : 'none';
        document.getElementById('gradient-color-wrap').style.display = (s.colorMode === 'gradient_bar' || s.colorMode === 'gradient_global') ? 'block' : 'none';
      });
    });
    
    document.querySelectorAll('.effect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const effect = btn.dataset.effect;
        s.effects[effect] = !s.effects[effect];
        btn.classList.toggle('active');
      });
    });
    
    function updateEffectControls() {
      document.getElementById('rainbow-speed-row').style.display = 
        (s.colorMode === 'rainbow' || s.colorMode === 'rainbow_multi') ? 'flex' : 'none';
      document.getElementById('bloom-intensity-row').style.display = 
        (s.effects.bloom || BarThemes.current().bloom) ? 'flex' : 'none';
      document.getElementById('fade-speed-row').style.display = 
        (s.effects.fade || BarThemes.current().fade) ? 'flex' : 'none';
      document.getElementById('particle-count-row').style.display = 
        (s.effects.particles || BarThemes.current().particles) ? 'flex' : 'none';
    }
    
    updateEffectControls();
    
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
    
    setInterval(updateEffectControls, 100);
  });
})();
