(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const s = NB.settings;
    
    function toPowerOfTwo(n) {
      n = Math.max(16, Math.min(16384, n));
      return Math.pow(2, Math.round(Math.log2(n)));
    }
    
    function syncRangeAndNumber(rangeId, numberId, settingKey, isPowerOfTwo = false, minVal = null, maxVal = null) {
      const range = document.getElementById(rangeId);
      const number = document.getElementById(numberId);
      if (!range || !number) return;
      
      const min = minVal !== null ? minVal : parseFloat(range.min);
      const max = maxVal !== null ? maxVal : parseFloat(range.max);
      
      const update = () => {
        let val = parseFloat(range.value);
        if (isNaN(val)) val = range.min;
        if (isPowerOfTwo) val = toPowerOfTwo(val);
        val = Math.min(max, Math.max(min, val));
        number.value = val;
        s[settingKey] = val;
        
        if (settingKey === 'barCount' && NB.analyser) {
          NB.analyser.fftSize = val * 2;
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
        if (isNaN(val)) val = range.value;
        if (isPowerOfTwo) val = toPowerOfTwo(val);
        val = Math.min(max, Math.max(min, val));
        range.value = val;
        number.value = val;
        s[settingKey] = val;
        
        if (settingKey === 'barCount' && NB.analyser) {
          NB.analyser.fftSize = val * 2;
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
      
      let initVal = s[settingKey];
      if (isPowerOfTwo) initVal = toPowerOfTwo(initVal);
      range.value = initVal;
      number.value = initVal;
    }
    
    syncRangeAndNumber('bar-count', 'bar-count-num', 'barCount', true, 16, 512);
    syncRangeAndNumber('height-scale', 'height-scale-num', 'heightScale', false);
    syncRangeAndNumber('sensitivity', 'sensitivity-num', 'sensitivity', false);
    syncRangeAndNumber('opacity-val', 'opacity-val-num', 'opacityVal', false, 0, 1);
    syncRangeAndNumber('smooth-val', 'smooth-val-num', 'smoothing', false, 0, 0.99);
    syncRangeAndNumber('rainbow-speed', 'rainbow-speed-num', 'rainbowSpeed', false, 0, 10);
    syncRangeAndNumber('bloom-intensity', 'bloom-intensity-num', 'bloomIntensity', false, 0, 2);
    syncRangeAndNumber('fade-speed', 'fade-speed-num', 'fadeSpeed', false, 0, 0.5);
    syncRangeAndNumber('particle-count', 'particle-count-num', 'particleCount', false, 0, 500);
    
    const barColor = document.getElementById('bar-color');
    if (barColor) barColor.addEventListener('input', e => s.barColor = e.target.value);
    const gradStart = document.getElementById('grad-start');
    if (gradStart) gradStart.addEventListener('input', e => s.gradStart = e.target.value);
    const gradEnd = document.getElementById('grad-end');
    if (gradEnd) gradEnd.addEventListener('input', e => s.gradEnd = e.target.value);
    
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
        const solidWrap = document.getElementById('solid-color-wrap');
        const gradWrap = document.getElementById('gradient-color-wrap');
        if (solidWrap) solidWrap.style.display = s.colorMode === 'solid' ? 'block' : 'none';
        if (gradWrap) gradWrap.style.display = (s.colorMode === 'gradient_bar' || s.colorMode === 'gradient_global') ? 'block' : 'none';
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
      const rainbowRow = document.getElementById('rainbow-speed-row');
      const bloomRow = document.getElementById('bloom-intensity-row');
      const fadeRow = document.getElementById('fade-speed-row');
      const particleRow = document.getElementById('particle-count-row');
      if (rainbowRow) rainbowRow.style.display = (s.colorMode === 'rainbow' || s.colorMode === 'rainbow_multi') ? 'flex' : 'none';
      if (bloomRow) bloomRow.style.display = (s.effects.bloom || (BarThemes.current && BarThemes.current().bloom)) ? 'flex' : 'none';
      if (fadeRow) fadeRow.style.display = (s.effects.fade || (BarThemes.current && BarThemes.current().fade)) ? 'flex' : 'none';
      if (particleRow) particleRow.style.display = (s.effects.particles || (BarThemes.current && BarThemes.current().particles)) ? 'flex' : 'none';
    }
    
    updateEffectControls();
    
    if (typeof BarThemes !== 'undefined' && BarThemes.setTheme) {
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
    }
    
    setInterval(updateEffectControls, 100);
  });
})();
