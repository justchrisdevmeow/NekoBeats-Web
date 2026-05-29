const BarThemes = (() => {
  const builtins = {
    default: {
      name: 'default',
      shape: 'rect',
      width_multiplier: 1,
      corner_radius: 0,
      gap: 2,
      stroke_width: 1.5,
      bloom: false,
      bloom_intensity: 0.5,
      fade: false,
      fade_speed: 0.05,
      particles: false,
      particle_count: 50,
      particle_size: 2,
      particle_speed: 1,
      space: false,
      color_mode: null,
      gradient_start: null,
      gradient_end: null,
      rainbow_speed: 1
    },

    rounded: {
      name: 'rounded',
      shape: 'rounded',
      width_multiplier: 0.85,
      corner_radius: 6,
      gap: 3,
      stroke_width: 1.5,
      bloom: false,
      bloom_intensity: 0.4,
      fade: false,
      fade_speed: 0.05,
      particles: false,
      particle_count: 30,
      particle_size: 2,
      particle_speed: 1,
      space: false,
      color_mode: null,
      gradient_start: null,
      gradient_end: null,
      rainbow_speed: 1
    },

    thin: {
      name: 'thin',
      shape: 'line',
      width_multiplier: 0.3,
      corner_radius: 0,
      gap: 2,
      stroke_width: 1,
      bloom: true,
      bloom_intensity: 0.4,
      fade: false,
      fade_speed: 0.05,
      particles: false,
      particle_count: 20,
      particle_size: 1,
      particle_speed: 0.8,
      space: false,
      color_mode: null,
      gradient_start: null,
      gradient_end: null,
      rainbow_speed: 1
    },

    hollow: {
      name: 'hollow',
      shape: 'hollow',
      width_multiplier: 1,
      corner_radius: 0,
      gap: 2,
      stroke_width: 1.5,
      bloom: false,
      bloom_intensity: 0.3,
      fade: false,
      fade_speed: 0.05,
      particles: false,
      particle_count: 30,
      particle_size: 2,
      particle_speed: 1,
      space: false,
      color_mode: null,
      gradient_start: null,
      gradient_end: null,
      rainbow_speed: 1
    },

    triangles: {
      name: 'triangles',
      shape: 'triangle',
      width_multiplier: 1,
      corner_radius: 0,
      gap: 3,
      stroke_width: 1,
      bloom: false,
      bloom_intensity: 0.3,
      fade: false,
      fade_speed: 0.05,
      particles: true,
      particle_count: 40,
      particle_size: 2,
      particle_speed: 1.2,
      space: false,
      color_mode: null,
      gradient_start: null,
      gradient_end: null,
      rainbow_speed: 1
    },

    dots: {
      name: 'dots',
      shape: 'dot',
      width_multiplier: 0.7,
      corner_radius: 0,
      gap: 4,
      stroke_width: 1,
      bloom: false,
      bloom_intensity: 0.6,
      fade: false,
      fade_speed: 0.08,
      particles: false,
      particle_count: 20,
      particle_size: 3,
      particle_speed: 0.8,
      space: false,
      color_mode: null,
      gradient_start: null,
      gradient_end: null,
      rainbow_speed: 1
    },

    space: {
      name: 'space',
      shape: 'line',
      width_multiplier: 0.4,
      corner_radius: 0,
      gap: 2,
      stroke_width: 1,
      bloom: true,
      bloom_intensity: 0.7,
      fade: true,
      fade_speed: 0.04,
      particles: true,
      particle_count: 80,
      particle_size: 1.5,
      particle_speed: 0.6,
      space: true,
      color_mode: 'rainbow_multi',
      gradient_start: null,
      gradient_end: null,
      rainbow_speed: 0.5
    }
  };

  let activeTheme = 'default';
  let customThemes = {};

  const SCHEMA_KEYS = [
    'name', 'author', 'description',
    'shape', 'width_multiplier', 'corner_radius', 'gap', 'stroke_width',
    'bloom', 'bloom_intensity', 'fade', 'fade_speed',
    'particles', 'particle_count', 'particle_size', 'particle_speed',
    'space', 'color_mode', 'gradient_start', 'gradient_end', 'rainbow_speed'
  ];

  const VALID_SHAPES = ['rect', 'rounded', 'line', 'hollow', 'triangle', 'dot', 'diamond'];

  function validate(json) {
    const errors = [];
    if (typeof json !== 'object' || json === null) return ['invalid json object'];
    if (!json.name || typeof json.name !== 'string') errors.push('missing or invalid "name" (string)');
    if (json.shape && !VALID_SHAPES.includes(json.shape)) errors.push(`invalid shape "${json.shape}". valid: ${VALID_SHAPES.join(', ')}`);
    if (json.width_multiplier !== undefined && (typeof json.width_multiplier !== 'number' || json.width_multiplier <= 0)) errors.push('"width_multiplier" must be a positive number');
    if (json.corner_radius !== undefined && typeof json.corner_radius !== 'number') errors.push('"corner_radius" must be a number');
    if (json.bloom_intensity !== undefined && (json.bloom_intensity < 0 || json.bloom_intensity > 1)) errors.push('"bloom_intensity" must be 0-1');
    if (json.fade_speed !== undefined && (json.fade_speed < 0 || json.fade_speed > 1)) errors.push('"fade_speed" must be 0-1');
    if (json.particle_count !== undefined && (typeof json.particle_count !== 'number' || json.particle_count < 0)) errors.push('"particle_count" must be a non-negative number');
    return errors;
  }

  function merge(theme) {
    return Object.assign({}, builtins.default, theme);
  }

  function current() {
    const all = Object.assign({}, builtins, customThemes);
    return merge(all[activeTheme] || builtins.default);
  }

  function resetEffects() {
    NB.settings.effects = {
      bloom: false,
      fade: false,
      particles: false,
      space: false
    };
    const effectBtns = document.querySelectorAll('.effect-btn');
    effectBtns.forEach(btn => btn.classList.remove('active'));
  }

  function setTheme(name) {
    const all = Object.assign({}, builtins, customThemes);
    if (!all[name]) return false;
    
    resetEffects();
    activeTheme = name;
    const theme = current();

    if (theme.color_mode) NB.settings.colorMode = theme.color_mode;
    if (theme.fade_speed) NB.settings.fadeSpeed = theme.fade_speed;
    if (theme.bloom_intensity) NB.settings.bloomIntensity = theme.bloom_intensity;
    if (theme.particle_count) NB.settings.particleCount = theme.particle_count;
    if (theme.rainbow_speed) NB.settings.rainbowSpeed = theme.rainbow_speed;
    
    if (theme.bloom) NB.settings.effects.bloom = true;
    if (theme.fade) NB.settings.effects.fade = true;
    if (theme.particles) NB.settings.effects.particles = true;
    if (theme.space) NB.settings.effects.space = true;
    
    Object.keys(NB.settings.effects).forEach(effect => {
      if (NB.settings.effects[effect]) {
        const btn = document.querySelector(`.effect-btn[data-effect="${effect}"]`);
        if (btn) btn.classList.add('active');
      }
    });

    Effects.resetTrail();
    return true;
  }

  function importTheme(json) {
    const errors = validate(json);
    if (errors.length > 0) {
      throw new Error('Bar theme validation failed:\n' + errors.join('\n'));
    }
    const key = json.name.toLowerCase().replace(/\s+/g, '_');
    customThemes[key] = json;
    return key;
  }

  function addToUI(key, theme) {
    const list = document.getElementById('bartheme-list');
    if (!list) return;
    if (document.querySelector(`.bartheme-btn[data-theme="${key}"]`)) return;
    const btn = document.createElement('button');
    btn.className = 'bartheme-btn';
    btn.dataset.theme = key;
    btn.textContent = theme.name || key;
    if (theme.author) btn.title = `by ${theme.author}`;
    list.appendChild(btn);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bartheme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setTheme(key);
      if (typeof setStatus === 'function') setStatus('bar theme: ' + (theme.name || key), '🎨');
    });
  }

  function getSchema() {
    return {
      _comment: 'NekoBeats bar theme schema. all fields optional except name.',
      name: 'string — required. display name',
      author: 'string — optional. your name',
      description: 'string — optional.',
      shape: `string — one of: ${VALID_SHAPES.join(', ')}`,
      width_multiplier: 'number — bar width scale. 1 = default, 0.5 = half width',
      corner_radius: 'number — rounding radius for rounded shape',
      gap: 'number — pixels between bars',
      stroke_width: 'number — line width for hollow/line shapes',
      bloom: 'boolean — enable bloom glow effect',
      bloom_intensity: 'number 0-1 — bloom strength',
      fade: 'boolean — enable trail/fade effect',
      fade_speed: 'number 0-1 — how fast trail fades (lower = longer trail)',
      particles: 'boolean — enable particle emitters on loud bars',
      particle_count: 'number — max particles on screen',
      particle_size: 'number — particle radius in px',
      particle_speed: 'number — particle velocity multiplier',
      space: 'boolean — enable space/star background',
      color_mode: `string or null — override color mode: solid, rainbow, rainbow_multi, gradient_bar, gradient_global`,
      gradient_start: 'hex string or null — gradient start color e.g. "#00cfd1"',
      gradient_end: 'hex string or null — gradient end color e.g. "#ff006e"',
      rainbow_speed: 'number — rainbow cycle speed multiplier'
    };
  }

  return {
    current,
    setTheme,
    importTheme,
    addToUI,
    getSchema,
    resetEffects,
    builtins: () => Object.keys(builtins),
    custom: () => Object.keys(customThemes)
  };
})();

window.BarThemes = BarThemes;

document.addEventListener('DOMContentLoaded', () => {
  const barthemeBtns = document.querySelectorAll('.bartheme-btn');
  barthemeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      barthemeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      BarThemes.setTheme(btn.dataset.theme);
      if (typeof setStatus === 'function') setStatus('bar theme: ' + btn.dataset.theme, '🎨');
    });
  });

  const importBarthemeBtn = document.getElementById('import-bartheme-btn');
  const importBarthemeInput = document.getElementById('import-bartheme-input');
  if (importBarthemeBtn && importBarthemeInput) {
    importBarthemeBtn.addEventListener('click', () => importBarthemeInput.click());
    importBarthemeInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (typeof setStatus === 'function') setStatus('importing bar theme: ' + file.name, '⏳');
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const json = JSON.parse(ev.target.result);
          const key = BarThemes.importTheme(json);
          BarThemes.addToUI(key, json);
          if (typeof setStatus === 'function') setStatus('bar theme imported: ' + json.name, '✅');
          setTimeout(() => {
            if (typeof setStatus === 'function') setStatus('ready', '🐱');
          }, 2000);
        } catch (err) {
          if (typeof setStatus === 'function') setStatus('import failed: ' + err.message, '❌');
          console.error(err);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }
});
