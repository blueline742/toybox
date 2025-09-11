// ThreeParticleSystem.js - GPU-accelerated particle system using Three.js Points
import * as THREE from 'three';

class ThreeParticleSystem {
  constructor(containerId, maxParticles = 5000) {
    // Detect mobile and reduce particle count for performance
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;
    
    if (isMobile || isLowEnd) {
      maxParticles = Math.min(maxParticles, 500); // Cap at 500 for mobile/low-end
      console.log('Mobile/Low-end device detected: Limiting particles to', maxParticles);
    }
    
    this.maxParticles = maxParticles;
    this.activeParticles = 0;
    this.particlePool = [];
    this.systems = new Map();
    this.isMobile = isMobile;
    
    // FPS monitoring
    this.fps = 60;
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    
    // Initialize Three.js scene
    this.init(containerId);
  }

  init(containerId) {
    // Get container element
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      -aspect * 100, aspect * 100,
      100, -100,
      0.1, 1000
    );
    this.camera.position.z = 100;

    // Create renderer with optimizations
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false, // Disable for performance
      powerPreference: 'high-performance',
      stencil: false,
      depth: false
    });
    
    // Optimize renderer settings
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2 for mobile
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    
    // Add canvas to container
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.pointerEvents = 'none';
    this.renderer.domElement.style.zIndex = '9999';
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Start render loop
    this.animate();
  }

  handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = -aspect * 100;
    this.camera.right = aspect * 100;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  createParticleSystem(name, config = {}) {
    const {
      maxParticles = 1000,
      texture = null,
      color = 0xffffff,
      size = 10,
      blending = THREE.AdditiveBlending,
      transparent = true,
      opacity = 1
    } = config;

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    
    // Create arrays for particle attributes
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const alphas = new Float32Array(maxParticles);
    const velocities = new Float32Array(maxParticles * 3);
    
    // Initialize arrays
    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
      
      sizes[i] = 0;
      alphas[i] = 0;
      
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    
    // Create material with vertex shader for size and alpha
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture ? new THREE.TextureLoader().load(texture) : null },
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vAlpha = alpha;
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vec2 uv = gl_PointCoord;
          
          // Create circular particle
          float dist = length(uv - vec2(0.5));
          if (dist > 0.5) discard;
          
          vec4 color = vec4(vColor, vAlpha);
          
          // Apply texture if available
          if (uTexture != null) {
            vec4 texColor = texture2D(uTexture, uv);
            color *= texColor;
          }
          
          // Soft edges
          color.a *= smoothstep(0.5, 0.3, dist);
          
          gl_FragColor = color;
        }
      `,
      blending: blending,
      depthTest: false,
      depthWrite: false,
      transparent: transparent
    });
    
    // Create points
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    
    // Store system
    const system = {
      points,
      geometry,
      material,
      positions: geometry.attributes.position.array,
      colors: geometry.attributes.color.array,
      sizes: geometry.attributes.size.array,
      alphas: geometry.attributes.alpha.array,
      velocities,
      particles: [],
      maxParticles,
      activeCount: 0
    };
    
    this.systems.set(name, system);
    return system;
  }

  emit(systemName, config = {}) {
    const system = this.systems.get(systemName);
    if (!system) {
      console.error(`Particle system ${systemName} not found`);
      return;
    }

    const {
      position = { x: 0, y: 0, z: 0 },
      velocity = { x: 0, y: 0, z: 0 },
      color = { r: 1, g: 1, b: 1 },
      size = 10,
      life = 1000,
      count = 1,
      spread = 0,
      gravity = 0,
      fadeOut = true
    } = config;

    for (let i = 0; i < count; i++) {
      if (system.activeCount >= system.maxParticles) break;
      
      // Find inactive particle slot
      let index = -1;
      for (let j = 0; j < system.maxParticles; j++) {
        if (system.alphas[j] <= 0) {
          index = j;
          break;
        }
      }
      
      if (index === -1) continue;
      
      // Set particle properties
      const i3 = index * 3;
      
      // Position with spread
      system.positions[i3] = position.x + (Math.random() - 0.5) * spread;
      system.positions[i3 + 1] = position.y + (Math.random() - 0.5) * spread;
      system.positions[i3 + 2] = position.z;
      
      // Velocity with randomization
      system.velocities[i3] = velocity.x + (Math.random() - 0.5) * spread * 0.1;
      system.velocities[i3 + 1] = velocity.y + (Math.random() - 0.5) * spread * 0.1;
      system.velocities[i3 + 2] = velocity.z;
      
      // Color
      system.colors[i3] = color.r;
      system.colors[i3 + 1] = color.g;
      system.colors[i3 + 2] = color.b;
      
      // Size and alpha
      system.sizes[index] = size + Math.random() * size * 0.5;
      system.alphas[index] = 1;
      
      // Store particle data
      system.particles[index] = {
        life,
        maxLife: life,
        gravity,
        fadeOut,
        startTime: performance.now()
      };
      
      system.activeCount++;
    }
    
    // Mark attributes as needing update
    system.geometry.attributes.position.needsUpdate = true;
    system.geometry.attributes.color.needsUpdate = true;
    system.geometry.attributes.size.needsUpdate = true;
    system.geometry.attributes.alpha.needsUpdate = true;
  }

  update(deltaTime) {
    // Update all particle systems
    this.systems.forEach((system) => {
      const now = performance.now();
      
      for (let i = 0; i < system.maxParticles; i++) {
        const particle = system.particles[i];
        if (!particle || system.alphas[i] <= 0) continue;
        
        const age = now - particle.startTime;
        const lifeRatio = 1 - (age / particle.maxLife);
        
        if (lifeRatio <= 0) {
          // Reset particle
          system.alphas[i] = 0;
          system.sizes[i] = 0;
          system.particles[i] = null;
          system.activeCount--;
          continue;
        }
        
        const i3 = i * 3;
        
        // Update position based on velocity
        system.positions[i3] += system.velocities[i3] * deltaTime * 0.001;
        system.positions[i3 + 1] += system.velocities[i3 + 1] * deltaTime * 0.001;
        system.positions[i3 + 2] += system.velocities[i3 + 2] * deltaTime * 0.001;
        
        // Apply gravity
        if (particle.gravity) {
          system.velocities[i3 + 1] -= particle.gravity * deltaTime * 0.001;
        }
        
        // Fade out
        if (particle.fadeOut) {
          system.alphas[i] = lifeRatio;
        }
      }
      
      // Update attributes
      if (system.activeCount > 0) {
        system.geometry.attributes.position.needsUpdate = true;
        system.geometry.attributes.alpha.needsUpdate = true;
      }
      
      // Update material uniforms
      system.material.uniforms.uTime.value = now * 0.001;
    });
  }

  animate() {
    const now = performance.now();
    const deltaTime = now - (this.lastTime || now);
    this.lastTime = now;
    
    // Update particles
    this.update(deltaTime);
    
    // Render
    this.renderer.render(this.scene, this.camera);
    
    // Continue loop
    requestAnimationFrame(() => this.animate());
  }

  // Preset effects
  createExplosion(position, color = { r: 1, g: 0.5, b: 0 }) {
    if (!this.systems.has('explosion')) {
      this.createParticleSystem('explosion', {
        maxParticles: 500,
        blending: THREE.AdditiveBlending
      });
    }
    
    this.emit('explosion', {
      position,
      color,
      count: 50,
      spread: 30,
      size: 15,
      life: 1000,
      velocity: { x: 0, y: 20, z: 0 },
      gravity: -50,
      fadeOut: true
    });
  }

  createSparkle(position, color = { r: 1, g: 1, b: 0 }) {
    if (!this.systems.has('sparkle')) {
      this.createParticleSystem('sparkle', {
        maxParticles: 200,
        blending: THREE.AdditiveBlending
      });
    }
    
    this.emit('sparkle', {
      position,
      color,
      count: 10,
      spread: 20,
      size: 5,
      life: 500,
      fadeOut: true
    });
  }

  createHeal(position) {
    if (!this.systems.has('heal')) {
      this.createParticleSystem('heal', {
        maxParticles: 300,
        blending: THREE.AdditiveBlending
      });
    }
    
    this.emit('heal', {
      position,
      color: { r: 0, g: 1, b: 0.5 },
      count: 20,
      spread: 10,
      size: 8,
      life: 1500,
      velocity: { x: 0, y: 10, z: 0 },
      fadeOut: true
    });
  }

  createHit(position) {
    if (!this.systems.has('hit')) {
      this.createParticleSystem('hit', {
        maxParticles: 100,
        blending: THREE.NormalBlending
      });
    }
    
    this.emit('hit', {
      position,
      color: { r: 1, g: 0, b: 0 },
      count: 15,
      spread: 15,
      size: 12,
      life: 300,
      velocity: { x: 0, y: -5, z: 0 },
      gravity: -20,
      fadeOut: true
    });
  }

  dispose() {
    // Clean up Three.js resources
    this.systems.forEach((system) => {
      system.geometry.dispose();
      system.material.dispose();
      this.scene.remove(system.points);
    });
    
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

// Create singleton instance
let particleSystemInstance = null;

export const getParticleSystem = () => {
  if (!particleSystemInstance) {
    particleSystemInstance = new ThreeParticleSystem('particle-container', 5000);
  }
  return particleSystemInstance;
};

export default ThreeParticleSystem;