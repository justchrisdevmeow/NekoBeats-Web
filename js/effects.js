const Effects = (() => {
  const particles = [];
  const stars = [];
  let rainbowHue = 0;
  let starsInit = false;

  function getRainbowColor(offset, alpha) {
    rainbowHue = (rainbowHue + NB.settings.rainbowSpeed * 0.5) % 360;
    const h = (rainbowHue + offset) % 360;
    return `hsla(${h},100%,60%,${alpha})`;
  }

  function getRainbowMultiColor(index, total, alpha) {
    const h = ((index / total) * 360 + rainbowHue) % 360;
    return `hsla(${h},100%,60%,${alpha})`;
  }

  function tickRainbow() {
    rainbowHue = (rainbowHue + NB.settings.rainbowSpeed * 0.5) % 360;
  }

  function getBarGradient(ctx, x, y, w, h, startHex, endHex) {
    const grad = ctx.createLinearGradient(x, y + h, x, y);
    grad.addColorStop(0, startHex);
    grad.addColorStop(1, endHex);
    return grad;
  }

  function getGlobalGradient(ctx, W, H, startHex, endHex) {
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, startHex);
    grad.addColorStop(1, endHex);
    return grad;
  }

  function resolveColor(ctx, index, total, x, barW, barH, canvasW, canvasH, baseAlpha) {
    const s = NB.settings;
    const alpha = s.opacityVal * baseAlpha;

    switch (s.colorMode) {
      case 'rainbow':
        return getRainbowColor(0, alpha);
      case 'rainbow_multi':
        return getRainbowMultiColor(index, total, alpha);
      case 'gradient_bar':
        return getBarGradient(ctx, x, canvasH - barH, barW, barH, s.gradStart, s.gradEnd);
      case 'gradient_global':
        return getGlobalGradient(ctx, canvasW, canvasH, s.gradStart, s.gradEnd);
      default:
        return hexAlpha(s.barColor, alpha);
    }
  }

  function applyBloom(ctx, canvas) {
    const intensity = NB.settings.bloomIntensity;
    if (intensity <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = `blur(${Math.round(intensity * 25)}px)`;
    ctx.globalAlpha = intensity * 0.8;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function applyFade(ctx, canvas) {
    const speed = NB.settings.fadeSpeed;
    if (speed <= 0) return;
    ctx.fillStyle = `rgba(0, 0, 0, ${speed * 0.08})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function spawnParticle(x, y, color) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 2,
      vy: -(Math.random() * 2 + 0.5),
      life: 1.0,
      decay: Math.random() * 0.02 + 0.01,
      size: Math.random() * 3 + 1,
      color
    });
  }

  function updateParticles(ctx, data, barW, gap, canvasH, total) {
    const maxParticles = NB.settings.particleCount;
    const s = NB.settings;
    const barCount = s.barCount;

    for (let i = 0; i < barCount; i++) {
      if (particles.length < maxParticles && Math.random() < 0.5) {
        const val = data[i] / 255;
        if (val > 0.2) {
          const x = i * (barW + gap) + barW / 2;
          const barH = val * canvasH * s.heightScale;
          const y = canvasH - barH;
          const color = resolveColor(ctx, i, barCount, x, barW, barH, canvasH * 2, canvasH, 1);
          spawnParticle(x, y, typeof color === 'string' ? color : s.barColor);
        }
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.life * s.opacityVal;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function initStars(W, H) {
    stars.length = 0;
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 1.5 + 0.2,
        speed: Math.random() * 0.3 + 0.05,
        brightness: Math.random()
      });
    }
    starsInit = true;
  }

  function drawSpace(ctx, W, H) {
    if (!starsInit || stars.length === 0) initStars(W, H);
    ctx.save();
    
    // Draw nebula overlays instead of filling background
    const nebula = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.5);
    nebula.addColorStop(0, 'rgba(0,50,80,0.08)');
    nebula.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, W, H);

    const nebula2 = ctx.createRadialGradient(W * 0.7, H * 0.6, 0, W * 0.7, H * 0.6, W * 0.4);
    nebula2.addColorStop(0, 'rgba(80,0,80,0.06)');
    nebula2.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula2;
    ctx.fillRect(0, 0, W, H);

    // Draw scrolling stars
    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) { s.x = W; s.y = Math.random() * H; }
      const flicker = 0.5 + Math.sin(Date.now() * 0.003 * s.speed) * 0.5;
      ctx.globalAlpha = s.brightness * flicker * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function hexAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function applyGlowPulse(ctx, data, freqData) {
    // Get average of bass frequencies (first 20%)
    const bassRange = Math.floor(freqData.length * 0.2);
    let bassAvg = 0;
    for (let i = 0; i < bassRange; i++) {
      bassAvg += freqData[i];
    }
    bassAvg /= bassRange;
    
    // Normalize to 0-1
    const bassNorm = Math.min(1, bassAvg / 255);
    
    // Apply glow based on bass intensity
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = bassNorm * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }

  function applyColorShift(ctx, data, freqData) {
    // Get average frequency across spectrum
    let avgFreq = 0;
    for (let i = 0; i < freqData.length; i++) {
      avgFreq += freqData[i];
    }
    avgFreq /= freqData.length;
    
    // Map frequency to hue (0-360)
    const hue = (avgFreq / 255) * 360;
    
    // Apply subtle color tint
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }

  function applyParticleBurst(ctx, data, freqData, canvasW, canvasH) {
    // Detect beat in bass frequencies
    let bassEnergy = 0;
    const bassRange = Math.floor(freqData.length * 0.15);
    for (let i = 0; i < bassRange; i++) {
      bassEnergy += freqData[i];
    }
    bassEnergy /= bassRange;
    
    // Burst if beat detected (high bass energy)
    if (bassEnergy > 180) {
      const burstCount = Math.floor((bassEnergy / 255) * 8);
      for (let i = 0; i < burstCount; i++) {
        const x = Math.random() * canvasW;
        const y = Math.random() * canvasH;
        const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        spawnParticle(x, y, color);
      }
    }
  }

  function resetTrail() {
    particles.length = 0;
  }

  return {
    resolveColor,
    applyBloom,
    applyFade,
    applyGlowPulse,
    applyColorShift,
    applyParticleBurst,
    updateParticles,
    drawSpace,
    tickRainbow,
    hexAlpha,
    resetTrail,
    initStars
  };
})();

window.Effects = Effects;
