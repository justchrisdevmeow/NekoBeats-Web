const Visualizer3D = (() => {
  let scene, camera, renderer;
  let bars = [];
  let particles = [];
  let initialized = false;
  let particleGeometry, particleMaterial, particleSystem;
  
  function init() {
    if (initialized) return;
    
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    // Check if WebGL is actually supported
    try {
      const testCanvas = document.createElement('canvas');
      const webglContext = testCanvas.getContext('webgl') || testCanvas.getContext('webgl2');
      if (!webglContext) {
        throw new Error('WebGL context not available');
      }
    } catch (e) {
      console.error('WebGL not supported on this browser');
      NB.settings.is3D = false;
      const btn = document.getElementById('3d-mode-toggle');
      if (btn) btn.classList.remove('active');
      return;
    }
    
    const W = canvas.width;
    const H = canvas.height;
    
    try {
      // Scene setup
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      scene.fog = new THREE.Fog(0x000000, 2000, 3000);
      
      // Camera
      camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 10000);
      camera.position.set(0, 0, 100);
      
      // Renderer - let Three.js create the WebGL context
      renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      renderer.setSize(W, H);
      renderer.setPixelRatio(window.devicePixelRatio);
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      if (typeof window.setStatus !== 'undefined') {
        window.setStatus('WebGL not supported - 3D disabled', '❌');
      }
      NB.settings.is3D = false;
      const btn = document.getElementById('3d-mode-toggle');
      if (btn) btn.classList.remove('active');
      return;
    }
    
    // Lighting
    const light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(100, 100, 100);
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    
    // Create bar geometries in circle
    const barCount = NB.settings.barCount;
    const radius = 80;
    const barGeometry = new THREE.BoxGeometry(8, 20, 8);
    
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const material = new THREE.MeshPhongMaterial({ 
        color: Math.random() * 0xffffff,
        emissive: 0x000000
      });
      const bar = new THREE.Mesh(barGeometry, material);
      bar.position.set(x, 0, z);
      bar.lookAt(0, 0, 0);
      bar.baseHeight = 20;
      bar.angle = angle;
      bar.baseColor = new THREE.Color().setHSL(i / barCount, 0.8, 0.6);
      
      scene.add(bar);
      bars.push(bar);
    }
    
    // Particle system
    const particleCount = 1000;
    particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
      
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.userData.velocities = velocities;
    
    particleMaterial = new THREE.PointsMaterial({
      color: 0x00cfd1,
      size: 2,
      sizeAttenuation: true
    });
    
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    initialized = true;
  }
  
  function onWindowResize() {
    const canvas = document.getElementById('canvas');
    if (!canvas || !renderer || !camera) return;
    
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }
  
  function updateBars(data) {
    const s = NB.settings;
    
    bars.forEach((bar, i) => {
      const val = data[i % data.length] / 255;
      const newHeight = val * 100 * s.heightScale;
      
      // Smooth interpolation
      bar.scale.y += (newHeight / bar.baseHeight - bar.scale.y) * 0.1;
      
      // Color based on height
      const hue = (i / bars.length + val * 0.3) % 1;
      bar.material.color.setHSL(hue, 0.8, 0.5 + val * 0.3);
      bar.material.emissive.setHSL(hue, 0.8, val * 0.2);
    });
  }
  
  function updateParticles(freqData) {
    const positions = particleGeometry.attributes.position.array;
    const velocities = particleGeometry.userData.velocities;
    
    let avgFreq = 0;
    for (let i = 0; i < freqData.length; i++) {
      avgFreq += freqData[i];
    }
    avgFreq /= freqData.length;
    
    const speedBoost = 1 + (avgFreq / 255) * 0.5;
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i] * speedBoost;
      positions[i + 1] += velocities[i + 1] * speedBoost;
      positions[i + 2] += velocities[i + 2] * speedBoost;
      
      // Wrap around bounds
      const bound = 200;
      if (Math.abs(positions[i]) > bound) {
        positions[i] = -Math.sign(positions[i]) * bound;
        velocities[i] *= -1;
      }
      if (Math.abs(positions[i + 1]) > bound) {
        positions[i + 1] = -Math.sign(positions[i + 1]) * bound;
        velocities[i + 1] *= -1;
      }
      if (Math.abs(positions[i + 2]) > bound) {
        positions[i + 2] = -Math.sign(positions[i + 2]) * bound;
        velocities[i + 2] *= -1;
      }
    }
    
    particleGeometry.attributes.position.needsUpdate = true;
  }
  
  function render() {
    if (!initialized) init();
    if (!scene || !camera || !renderer) return;
    
    updateProgress();
    
    const freqData = new Uint8Array(NB.analyser.frequencyBinCount);
    NB.analyser.getByteFrequencyData(freqData);
    
    // Scale frequency data
    let rawData = new Uint8Array(freqData.length);
    for (let i = 0; i < freqData.length; i++) {
      let val = freqData[i] * NB.settings.sensitivity * 2;
      rawData[i] = Math.min(255, val);
    }
    
    const data = applyLinearScale(rawData, NB.settings.barCount);
    
    updateBars(data);
    updateParticles(freqData);
    
    // Rotation
    bars.forEach((bar, i) => {
      const rotSpeed = 0.001 + (data[i] / 255) * 0.005;
      bar.rotation.y += rotSpeed;
    });
    
    // Apply sound-reactive effects
    if (NB.settings.soundReactiveGlow) {
      let bassAvg = 0;
      const bassRange = Math.floor(freqData.length * 0.2);
      for (let i = 0; i < bassRange; i++) {
        bassAvg += freqData[i];
      }
      bassAvg /= bassRange;
      const intensity = Math.min(1, bassAvg / 200);
      
      bars.forEach(bar => {
        bar.material.emissive.multiplyScalar(1 + intensity * 0.5);
      });
    }
    
    if (NB.settings.soundReactiveColorShift) {
      let avgFreq = 0;
      for (let i = 0; i < freqData.length; i++) {
        avgFreq += freqData[i];
      }
      avgFreq /= freqData.length;
      
      const hueShift = (avgFreq / 255) * 0.3;
      bars.forEach((bar, i) => {
        const hue = (i / bars.length + hueShift) % 1;
        bar.material.color.setHSL(hue, 0.8, 0.5);
      });
    }
    
    renderer.render(scene, camera);
    NB.animId = requestAnimationFrame(render);
  }
  
  return {
    render,
    init
  };
})();

window.Visualizer3D = Visualizer3D;
