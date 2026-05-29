function draw() {
  NB.animId = requestAnimationFrame(draw);
  if (!NB.analyser) return;

  updateProgress();

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const s = NB.settings;
  const bt = BarThemes.current();

  // Space background or clear
  if (s.effects.space || bt.space) {
    Effects.drawSpace(ctx, W, H);
  } else if (s.effects.fade || bt.fade) {
    // fade handles its own clear via trail
  } else {
    ctx.clearRect(0, 0, W, H);
  }

  // Tick rainbow hue each frame
  if (s.colorMode === 'rainbow' || s.colorMode === 'rainbow_multi') {
    Effects.tickRainbow();
  }

  const freqData = new Uint8Array(NB.analyser.frequencyBinCount);
  const timeData = new Uint8Array(NB.analyser.fftSize);
  NB.analyser.getByteFrequencyData(freqData);
  NB.analyser.getByteTimeDomainData(timeData);

  // Apply sensitivity to freq data
  const data = new Uint8Array(freqData.length);
  for (let i = 0; i < freqData.length; i++) {
    data[i] = Math.min(255, freqData[i] * s.sensitivity);
  }

  switch (s.mode) {
    case 'bars':   drawBars(ctx, data, W, H, bt); break;
    case 'wave':   drawWave(ctx, timeData, W, H);  break;
    case 'mirror': drawMirror(ctx, data, W, H, bt); break;
    case 'circle': drawCircle(ctx, data, W, H, bt); break;
  }

  // Particles
  if (s.effects.particles || bt.particles) {
    const count = s.barCount;
    const gap = bt.gap !== undefined ? bt.gap : 2;
    const barW = (W - gap * (count - 1)) / count;
    Effects.updateParticles(ctx, data, barW, gap, H, count);
  }

  // Bloom
  if (s.effects.bloom || bt.bloom) {
    Effects.applyBloom(ctx, canvas);
  }

  // Fade trail
  if (s.effects.fade || bt.fade) {
    Effects.applyFade(ctx, canvas);
  }
}

window.draw = draw;

// ── Bars ──
function drawBars(ctx, data, W, H, bt) {
  const s = NB.settings;
  const count = s.barCount;
  const gap = bt.gap !== undefined ? bt.gap : 2;
  const widthMul = bt.width_multiplier !== undefined ? bt.width_multiplier : 1;
  const barW = ((W - gap * (count - 1)) / count) * widthMul;
  const shape = bt.shape || 'rect';
  const radius = bt.corner_radius !== undefined ? bt.corner_radius : 0;

  for (let i = 0; i < count; i++) {
    const val = data[i] / 255;
    const barH = Math.max(val * H * s.heightScale, 1);
    const x = i * (barW + gap) + ((barW / widthMul) - barW) / 2;
    const y = H - barH;
    const alpha = s.opacityVal * (0.4 + val * 0.6);
    const color = Effects.resolveColor(ctx, i, count, x, barW, barH, W, H, 0.4 + val * 0.6);

    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    drawShape(ctx, shape, x, y, barW, barH, radius, val, bt);
  }
}

// ── Mirror ──
function drawMirror(ctx, data, W, H, bt) {
  const s = NB.settings;
  const count = s.barCount;
  const gap = bt.gap !== undefined ? bt.gap : 2;
  const widthMul = bt.width_multiplier !== undefined ? bt.width_multiplier : 1;
  const barW = ((W - gap * (count - 1)) / count) * widthMul;
  const shape = bt.shape || 'rect';
  const radius = bt.corner_radius !== undefined ? bt.corner_radius : 0;

  for (let i = 0; i < count; i++) {
    const val = data[i] / 255;
    const barH = Math.max(val * H * s.heightScale, 1);
    const x = i * (barW + gap) + ((barW / widthMul) - barW) / 2;
    const y = H / 2 - barH / 2;
    const color = Effects.resolveColor(ctx, i, count, x, barW, barH, W, H, s.opacityVal);

    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    drawShape(ctx, shape, x, y, barW, barH, radius, val, bt);
  }
}

// ── Wave ──
function drawWave(ctx, timeData, W, H) {
  const s = NB.settings;
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = Effects.resolveColor(ctx, 0, 1, 0, W, H, W, H, s.opacityVal);

  const step = W / timeData.length;
  for (let i = 0; i < timeData.length; i++) {
    const y = (timeData[i] / 128.0) * (H / 2);
    i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * step, y);
  }
  ctx.stroke();
}

// ── Circle ──
function drawCircle(ctx, data, W, H, bt) {
  const s = NB.settings;
  const count = s.barCount;
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(W, H) * 0.22;
  const shape = bt.shape || 'line';

  for (let i = 0; i < count; i++) {
    const val = data[i] / 255;
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const len = val * radius * s.heightScale;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * (radius + len);
    const y2 = cy + Math.sin(angle) * (radius + len);

    const color = Effects.resolveColor(ctx, i, count, x1, 2, len, W, H, s.opacityVal * (0.3 + val * 0.7));
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    if (shape === 'dot') {
      ctx.beginPath();
      ctx.arc(x2, y2, Math.max(val * 4, 1), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.lineWidth = bt.width_multiplier ? bt.width_multiplier * 2 : 2;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}

// ── Shape Renderer ──
function drawShape(ctx, shape, x, y, w, h, radius, val, bt) {
  switch (shape) {
    case 'rounded':
      ctx.beginPath();
      const r = Math.min(radius || 4, w / 2, h / 2);
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.fill();
      break;

    case 'line':
      ctx.beginPath();
      ctx.lineWidth = Math.max(w * 0.4, 1);
      ctx.moveTo(x + w / 2, y + h);
      ctx.lineTo(x + w / 2, y);
      ctx.stroke();
      break;

    case 'hollow':
      ctx.beginPath();
      ctx.lineWidth = bt.stroke_width || 1.5;
      ctx.strokeRect(x, y, w, h);
      break;

    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
      break;

    case 'dot':
      const dotR = Math.max(w / 2, 1);
      ctx.beginPath();
      ctx.arc(x + w / 2, y + dotR, dotR, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
      ctx.fill();
      break;

    default:
      ctx.fillRect(x, y, w, h);
      break;
  }
}
