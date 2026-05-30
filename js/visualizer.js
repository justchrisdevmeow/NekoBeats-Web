function applyLinearScale(data, count) {
  const result = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const index = Math.floor(i * data.length / count);
    result[i] = data[Math.min(index, data.length - 1)];
  }
  return result;
}

function drawWatermark(ctx, W, H) {
  const baseSize = Math.max(11, Math.min(W, H) * 0.025);
  ctx.save();
  ctx.font = `${baseSize}px monospace`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.shadowBlur = 2;
  ctx.shadowColor = 'black';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const padding = 8;
  const lineHeight = baseSize + 3;
  
  // Emoji on left
  ctx.fillText('🐱', padding, padding);
  
  // Text next to emoji (shorter version)
  ctx.fillText('NekoBeats', padding + 22, padding);
  
  // URL below (shorter)
  ctx.font = `${Math.max(9, baseSize - 2)}px monospace`;
  ctx.fillText('sides.catsdevs.online/NekoBeats-Web', padding + 22, padding + lineHeight);
  
  ctx.restore();
}

function draw() {
  NB.animId = requestAnimationFrame(draw);
  if (!NB.analyser) return;

  updateProgress();

  // Update current lyric
  if (NB.buffer && NB.playing) {
    const elapsed = NB.audioCtx.currentTime - NB.startTime + NB.startOffset;
    const newLyric = getCurrentLyric(elapsed);
    if (newLyric !== NB.currentLyric) {
      NB.currentLyric = newLyric;
      NB.lyricChangedAt = Date.now();
    }
  } else if (NB.pausedAt > 0) {
    const newLyric = getCurrentLyric(NB.pausedAt);
    if (newLyric !== NB.currentLyric) {
      NB.currentLyric = newLyric;
      NB.lyricChangedAt = Date.now();
    }
  }

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const s = NB.settings;
  const bt = BarThemes.current();

  if (s.effects.space || bt.space) {
    Effects.drawSpace(ctx, W, H);
  } else if (!(s.effects.fade || bt.fade)) {
    ctx.clearRect(0, 0, W, H);
  }

  if (s.colorMode === 'rainbow' || s.colorMode === 'rainbow_multi') {
    Effects.tickRainbow();
  }

  const freqData = new Uint8Array(NB.analyser.frequencyBinCount);
  NB.analyser.getByteFrequencyData(freqData);

  let rawData = new Uint8Array(freqData.length);
  for (let i = 0; i < freqData.length; i++) {
    let val = freqData[i] * s.sensitivity * 2;
    rawData[i] = Math.min(255, val);
  }
  
  const data = applyLinearScale(rawData, s.barCount);

  switch (s.mode) {
    case 'bars':   drawBars(ctx, data, W, H, bt); break;
    case 'wave':   drawWave(ctx, data, W, H);  break;
    case 'mirror': drawMirror(ctx, data, W, H, bt); break;
    case 'circle': drawCircle(ctx, data, W, H, bt); break;
  }

  if (s.effects.particles || bt.particles) {
    const count = s.barCount;
    const gap = bt.gap !== undefined ? bt.gap : 2;
    const barW = (W - gap * (count - 1)) / count;
    Effects.updateParticles(ctx, data, barW, gap, H, count);
  }

  if (s.effects.bloom || bt.bloom) {
    Effects.applyBloom(ctx, canvas);
  }

  if (s.effects.fade || bt.fade) {
    Effects.applyFade(ctx, canvas);
  }

  if (window.isRecording) {
    drawWatermark(ctx, W, H);
  }

  if (NB.showLyrics && NB.currentLyric) {
    drawLyrics(ctx, W, H, NB.currentLyric);
  }
}

window.draw = draw;

function drawLyrics(ctx, W, H, lyricText) {
  const baseSize = Math.max(16, Math.min(W, H) * 0.045);
  const fadeInDuration = 200;   // ms
  const stayDuration = 2500;    // ms
  const fadeOutDuration = 200;  // ms
  const totalDuration = fadeInDuration + stayDuration + fadeOutDuration;
  
  const timeSinceChange = Date.now() - NB.lyricChangedAt;
  const cycleTime = timeSinceChange % totalDuration;
  
  let alpha = 0;
  if (cycleTime < fadeInDuration) {
    alpha = cycleTime / fadeInDuration;
  } else if (cycleTime < fadeInDuration + stayDuration) {
    alpha = 1;
  } else {
    alpha = 1 - ((cycleTime - fadeInDuration - stayDuration) / fadeOutDuration);
  }
  
  alpha = Math.max(0, Math.min(1, alpha));
  
  const padding = 20;
  const lineHeight = baseSize + 8;
  const boxWidth = W - padding * 2;
  const boxHeight = lineHeight + padding;
  const boxY = H * 0.7;
  
  ctx.save();
  ctx.font = `${baseSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Background box with fade
  ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect((W - boxWidth) / 2, boxY, boxWidth, boxHeight, 8);
  } else {
    ctx.rect((W - boxWidth) / 2, boxY, boxWidth, boxHeight);
  }
  ctx.fill();
  
  // Lyric text with glow and fade
  ctx.shadowColor = `rgba(0, 207, 209, ${0.6 * alpha})`;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalAlpha = alpha;
  
  ctx.fillStyle = '#00cfd1';
  ctx.fillText(lyricText, W / 2, boxY + boxHeight / 2);
  
  ctx.restore();
}


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
    const color = Effects.resolveColor(ctx, i, count, x, barW, barH, W, H, 0.4 + val * 0.6);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    drawShape(ctx, shape, x, y, barW, barH, radius, val, bt);
  }
}

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

function drawWave(ctx, data, W, H) {
  const s = NB.settings;
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = Effects.resolveColor(ctx, 0, 1, 0, W, H, W, H, s.opacityVal);
  const step = W / data.length;
  for (let i = 0; i < data.length; i++) {
    const y = (data[i] / 255) * H;
    i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * step, y);
  }
  ctx.stroke();
}

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
