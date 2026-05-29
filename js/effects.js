const Effects = (() => {
  const particles = [];
  const stars = [];
  let rainbowHue = 0;
  let starsInit = false;

  // ── Rainbow ──
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

  // ── Gradient ──
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

  // ── Resolve bar color ──
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

  // ── Bloom (fixed) ──
  function applyBloom(ctx, canvas) {
    const intensity = NB.settings.bloomIntensity;
    if (intensity <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = `blur(${Math.round(intensity * 8)}px)`;
    ctx.globalAlpha = intensity * 0.4;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  // ── Fade (fixed - simple trail) ──
  function applyFade(ctx, canvas) {
    const speed = NB.settings.fadeSpeed;
    ctx.fillStyle = `rgba(0, 0, 0, ${speed * 0.6})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ── Particles ──
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

    for (let i = 0; i < total; i++) {
      if (particles.length < maxParticles && Math.random() < 0.08) {
        const val = data[i] / 255;
        if (val > 0.6) {
          const x = i * (barW + gap) + barW / 2;
          const barH = val * canvasH * s.heightScale * s.sensitivity;
          const y = canvasH - barH;
          const color = resolveColor(ctx, i, total, x, barW, barH, canvasH * 2, canvasH, 1);
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

  // ── Space background ──
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
    ctx.fillStyle = '#030308';
    ctx.fillRect(0, 0, W, H);

    const nebula = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.5);
    nebula.addColorStop(0, 'rgba(0,50,80,0.15)');
    nebula.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, W, H);

    const nebula2 = ctx.createRadialGradient(W * 0.7, H * 0.6, 0, W * 0.7, H * 0.6, W * 0.4);
    nebula2.addColorStop(0, 'rgba(80,0,80,0.1)');
    nebula2.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula2;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) { s.x = W; s.y = Math.random() * H; }
      const flicker = 0.5 + Math.sin(Date.now() * 0.003 * s.speed) * 0.5;
      ctx.globalAlpha = s.brightness * flicker * 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Helpers ──
  function hexAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function resetTrail() {
    // Nothing to reset now
  }

  return {
    resolveColor,
    applyBloom,
    applyFade,
    updateParticles,
    drawSpace,
    tickRainbow,
    hexAlpha,
    resetTrail,
    initStars
  };
})();

window.Effects = Effects;
