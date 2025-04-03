import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'dat.gui';
import { SimplexNoise } from './SimplexNoise.js';

export class CurlNoiseParticleSystem {
  constructor(options = {}) {
    // Default settings
    this.settings = {
      particleCount: options.particleCount || (this.isMobile() ? 2000 : 15000),
      width: options.width || 2000,
      height: options.height || 2000,
      depth: options.depth || 8000, // Make tunnel longer
      speed: options.speed || 4,
      step: options.step || 1500,
      size: options.size || (this.isMobile() ? 150 : 25),
      color: options.color || 0xEA368E, // Fuschia default color
      rotate: options.rotate !== undefined ? options.rotate : true,
      oldMethod: options.oldMethod !== undefined ? options.oldMethod : false,
      // Tunnel specific settings
      tunnelRadius: options.tunnelRadius || 400,  // Default tunnel radius
      tunnelForceStrength: options.tunnelForceStrength || 0.1, // Strength of force keeping particles in tunnel
      flowSpeed: options.flowSpeed || 1.0, // Speed particles flow through the tunnel
      spiralFactor: options.spiralFactor || 0.2, // How much spiral motion to add
      // Scroll settings
      scrollSpeed: options.scrollSpeed || 1.0, // How fast to move through tunnel when scrolling
      scrollSmoothing: options.scrollSmoothing || 0.1, // How much to smooth scroll movements
      // Color settings
      backgroundColor: options.backgroundColor || 0x000000, // Black background color
      ambientLightColor: options.ambientLightColor || 0xEA368E, // Fuschia ambient light
      pointLightColor: options.pointLightColor || 0xffffff, // White endoscope light
      pointLightIntensity: options.pointLightIntensity || 1.5, // Endoscope light intensity
      // Visibility settings
      fogDistance: options.fogDistance || 1500, // Distance at which particles start to fade in
      fogDensity: options.fogDensity || 0.001, // How quickly particles fade in with distance
      // Ulcer settings
      enableUlcers: options.enableUlcers !== undefined ? options.enableUlcers : true,
      ulcerCount: options.ulcerCount || 8, // Number of ulcers to create
      ulcerSize: options.ulcerSize || 150, // Size of ulcers
      ulcerColor: options.ulcerColor || 0x00FF00, // Bright green color for ulcers
      ulcerIntensity: options.ulcerIntensity || 1.2, // Brightness multiplier for ulcers
      ulcerSizeMultiplier: options.ulcerSizeMultiplier || 2.0, // How much larger ulcer particles should be
    };

    this.particles = [];
    this.velocities = [];
    this.times = [];
    this.lifetimes = [];
    this.positions = [];
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.geometry = null;
    this.material = null;
    this.points = null;
    this.stats = null;
    this.gui = null;
    this.lastFrame = Date.now();
    this.time = 0;
    
    // Scroll-related properties
    this.scrollProgress = 0; // 0 to 1 indicating position in tunnel
    this.targetScrollProgress = 0; // Target value to smoothly approach
    this.maxScrollDistance = 8000; // How far in document user can scroll
    
    // Initialize noise
    this.simplex = new SimplexNoise();
    this.simplex.seed(Math.random());

    // Add path-related properties
    this.tunnelPath = null;
    this.pathPoints = [];

    this.alphas = []; // Array to store alpha values for particles
    
    // Array to store ulcer positions and properties
    this.ulcers = [];
  }

  isMobile() {
    return (
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i)
    );
  }

  init(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      canvas: canvas 
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.setClearColor(this.settings.backgroundColor);

    // Setup scene
    this.scene = new THREE.Scene();

    // Setup camera for tunnel view
    const ratio = window.innerWidth / window.innerHeight;
    const tunnelRadius = this.settings.tunnelRadius;
    const tunnelLength = this.settings.depth;
    const FOV = 60;
    
    this.camera = new THREE.PerspectiveCamera(FOV, ratio, 1, 20000);
    
    // Position camera at beginning of tunnel - this will be controlled by scrolling
    this.camera.position.set(0, 0, -tunnelLength/2 - tunnelRadius * 2);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(this.camera);

    // Setup controls - we'll disable these for scroll navigation
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.maxDistance = this.settings.depth;
    this.controls.minDistance = tunnelRadius;
    this.controls.autoRotate = false; // Disabled for scroll navigation
    this.controls.enabled = false; // Disable controls for scroll-based navigation
    this.controls.autoRotateSpeed = 0.5;
    this.controls.target = new THREE.Vector3(0, 0, 0);

    // Setup stats
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.domElement.style.position = 'relative';
    this.stats.domElement.style.bottom = '48px';
    
    const container = document.getElementById('canvas_container');
    if (container) {
      container.appendChild(this.stats.domElement);
    } else {
      // If container doesn't exist, create one
      const newContainer = document.createElement('div');
      newContainer.id = 'canvas_container';
      newContainer.style.position = 'absolute';
      newContainer.style.bottom = '0';
      newContainer.style.left = '0';
      document.body.appendChild(newContainer);
      newContainer.appendChild(this.stats.domElement);
    }

    // Event listener for window resize
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    
    // Generate our endoscopy tunnel path
    this.tunnelPath = this.createTunnelPath();
    
    // Store path for camera movement
    this.pathPoints = this.tunnelPath.getPoints(1000);
    
    // Generate ulcers
    this.generateUlcers();

    // Initialize particles
    this.initParticles();
    
    // Setup GUI controls
    this.setupGUI();

    // Add scroll event listener
    this.setupScrollHandler();

    // Create a taller document to allow scrolling
    this.createScrollableDocument();
  }

  initParticles() {
    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    
    // Generate particles in an endoscopic tunnel shape
    const tunnelRadius = this.settings.tunnelRadius;
    const tunnelLength = this.settings.depth;
    
    // Increase particle count for a longer tunnel
    const particleCount = this.settings.particleCount;
    
    // Arrays for vertex attributes
    this.particles = [];
    this.positions = [];
    this.velocities = [];
    this.times = [];
    this.lifetimes = [];
    this.alphas = []; // Store alpha values for each particle
    this.sizes = []; // Store sizes for each particle
    
    // Array for colors
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color(this.settings.color);
    
    // Create the regular tunnel particles
    for (let i = 0; i < particleCount; i++) {
      // Random position along the path
      const pathPos = Math.random();
      const pathPoint = this.tunnelPath.getPointAt(pathPos);
      
      // Create a tunnel by placing particles in a cylindrical shape
      // around the path point
      const theta = Math.random() * Math.PI * 2;
      
      // Random radius with variation (70-100% of tunnel radius)
      // More particles closer to the walls creates the organic tissue look
      const radiusVariation = Math.pow(Math.random(), 0.5); // Non-linear distribution
      const radius = tunnelRadius * (0.7 + radiusVariation * 0.3);
      
      // Get direction at this point to orient the circle
      const tangent = this.tunnelPath.getTangentAt(pathPos).normalize();
      
      // Create a plane perpendicular to the tangent
      const up = Math.abs(tangent.y) > 0.9 ? 
        new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const upDir = new THREE.Vector3().crossVectors(right, tangent).normalize();
      
      // Position around the tunnel using the perpendicular plane
      const x = pathPoint.x + (right.x * radius * Math.cos(theta) + upDir.x * radius * Math.sin(theta));
      const y = pathPoint.y + (right.y * radius * Math.cos(theta) + upDir.y * radius * Math.sin(theta));
      const z = pathPoint.z + (right.z * radius * Math.cos(theta) + upDir.z * radius * Math.sin(theta));
      
      this.particles.push(x, y, z);
      this.positions.push(x, y, z);
      
      // Initialize with slight inward velocity to maintain tunnel shape
      const vx = (pathPoint.x - x) * 0.01 + (0.2 - Math.random() * 0.4);
      const vy = (pathPoint.y - y) * 0.01 + (0.2 - Math.random() * 0.4);
      const vz = (pathPoint.z - z) * 0.01 + (0.2 - Math.random() * 0.4);
      
      this.velocities.push(vx, vy, vz);
      
      this.times.push(0);
      this.lifetimes.push(3.0 * Math.random());
      
      // Initialize alpha to 0 - will be updated in updateParticleVisibility
      this.alphas.push(0);
      
      // Check if this particle should be part of an ulcer
      let isUlcerParticle = false;
      let ulcerColor = null;
      let ulcerIntensity = 0;
      
      if (this.settings.enableUlcers && this.ulcers.length > 0) {
        // Check each ulcer to see if this particle should be affected
        for (const ulcer of this.ulcers) {
          // Calculate distance from ulcer center
          const distance = new THREE.Vector3(x, y, z).distanceTo(ulcer.position);
          
          // If within ulcer radius, mark as an ulcer particle
          if (distance < ulcer.size) {
            isUlcerParticle = true;
            
            // Calculate intensity based on distance from center (stronger in middle)
            ulcerIntensity = 1 - (distance / ulcer.size);
            
            // Clone the ulcer color and adjust intensity
            ulcerColor = ulcer.color.clone();
            
            // Make particles closer to the center more intense
            if (ulcerIntensity > 0.7) {
              ulcerColor.multiplyScalar(this.settings.ulcerIntensity);
            }
            
            break;
          }
        }
      }
      
      // Set the particle color based on whether it's an ulcer
      if (isUlcerParticle && ulcerColor) {
        colors[i * 3] = ulcerColor.r;
        colors[i * 3 + 1] = ulcerColor.g;
        colors[i * 3 + 2] = ulcerColor.b;
        
        // Set ulcer particle size - larger for ulcer particles, 
        // and even larger for particles closer to the center of ulcers
        const sizeMultiplier = this.settings.ulcerSizeMultiplier * (0.8 + 0.4 * ulcerIntensity);
        this.sizes.push(this.settings.size * sizeMultiplier);
      } else {
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        // Normal particle size
        this.sizes.push(this.settings.size);
      }
    }
    
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.particles, 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Load texture
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = '';
    const texture = loader.load('https://al-ro.github.io/images/embers/ember_texture.png');
    
    // Create multiple point systems with different sizes instead of one with custom shaders
    this.createMultipleSizedParticleSystems(texture);
  }

  // Create separate particle systems for different size groups rather than using custom shaders
  createMultipleSizedParticleSystems(texture) {
    // Group particles by size to create distinct particle systems
    // Define size categories
    const sizeGroups = {
      normal: {
        size: this.settings.size,
        positions: [],
        colors: [],
        indices: []
      },
      ulcer: {
        size: this.settings.size * this.settings.ulcerSizeMultiplier,
        positions: [],
        colors: [],
        indices: []
      }
    };
    
    // Categorize particles
    for (let i = 0; i < this.settings.particleCount; i++) {
      const index = i * 3;
      const particleSize = this.sizes[i];
      
      // Determine which group this particle belongs to
      let group;
      if (particleSize > this.settings.size * 1.2) {
        group = sizeGroups.ulcer;
      } else {
        group = sizeGroups.normal;
      }
      
      // Add particle to appropriate group
      group.positions.push(
        this.particles[index], 
        this.particles[index+1], 
        this.particles[index+2]
      );
      
      // Get color from original color attribute
      const colorAttribute = this.geometry.getAttribute('color');
      const r = colorAttribute.array[index];
      const g = colorAttribute.array[index+1];
      const b = colorAttribute.array[index+2];
      group.colors.push(r, g, b);
      
      // Store mapping from original index to group index
      group.indices.push(i);
    }
    
    // Create particle systems for each group
    this.particleSystems = [];
    this.points = null; // Clear the main points reference
    
    // Process each size group
    for (const [groupName, group] of Object.entries(sizeGroups)) {
      // Skip empty groups
      if (group.positions.length === 0) continue;
      
      // Create geometry for this group
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(group.positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(group.colors, 3));
      
      // Create material for this group
      const material = new THREE.PointsMaterial({
        size: group.size,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        map: texture,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      
      // Create points object
      const points = new THREE.Points(geometry, material);
      this.scene.add(points);
      
      // Store the particle system with index mapping for updates
      this.particleSystems.push({
        points: points,
        material: material,
        originalIndices: group.indices,
        name: groupName
      });
    }

    // Add ambient lighting to enhance the tissue-like appearance
    if (!this.ambientLight) {
      this.ambientLight = new THREE.AmbientLight(this.settings.ambientLightColor, 0.5);
      this.scene.add(this.ambientLight);
    }

    // Add point light positioned at camera to simulate endoscope light
    if (!this.endoscopeLight) {
      this.endoscopeLight = new THREE.PointLight(
        this.settings.pointLightColor, 
        this.settings.pointLightIntensity, 
        50
      );
      this.camera.add(this.endoscopeLight);
      this.endoscopeLight.position.set(0, 0, -2); // Position light in front of camera
      this.scene.add(this.camera);
    }
  }

  setupGUI() {
    // Create GUI
    this.gui = new GUI({ autoPlace: false });
    
    // Create folders for organization
    const flowFolder = this.gui.addFolder('Flow Settings');
    const tunnelFolder = this.gui.addFolder('Tunnel Shape');
    const visualFolder = this.gui.addFolder('Visual Settings');
    const colorFolder = this.gui.addFolder('Color Settings');
    const ulcerFolder = this.gui.addFolder('Ulcer Settings');
    const fogFolder = this.gui.addFolder('Fog Settings');
    const miscFolder = this.gui.addFolder('Misc Settings');
    
    // Flow controls
    flowFolder.add(this.settings, 'speed', 0, 100, 1).name('Curl Speed');
    flowFolder.add(this.settings, 'step', 10, 3000, 10).name('Noise Scale');
    flowFolder.add(this.settings, 'flowSpeed', 0, 5, 0.1).name('Flow Speed');
    flowFolder.add(this.settings, 'spiralFactor', 0, 1, 0.05).name('Spiral Motion');
    
    // Tunnel shape controls
    tunnelFolder.add(this.settings, 'tunnelRadius', 200, 1000, 10).name('Tunnel Radius')
      .onChange(() => this.resetParticles());
    tunnelFolder.add(this.settings, 'tunnelForceStrength', 0, 0.5, 0.01).name('Tunnel Force');
    
    // Visual controls
    visualFolder.add(this.settings, 'size', 1, 300, 1).onChange(() => this.setSize()).name('Particle Size');
    
    // Fog controls
    fogFolder.add(this.settings, 'fogDistance', 500, 3000, 100)
      .name('Visibility Distance');
    fogFolder.add(this.settings, 'fogDensity', 0.0001, 0.01, 0.0001)
      .name('Fog Density');
    
    // Color controls
    if (!this.isMobile()) {
      colorFolder.addColor(this.settings, 'color').onChange(() => this.setColor()).name('Particle Color');
      colorFolder.addColor(this.settings, 'backgroundColor').onChange(() => this.setBackgroundColor()).name('Background');
      colorFolder.addColor(this.settings, 'ambientLightColor').onChange(() => this.setAmbientLightColor()).name('Ambient Light');
      colorFolder.addColor(this.settings, 'pointLightColor').onChange(() => this.setPointLightColor()).name('Endoscope Light');
      colorFolder.add(this.settings, 'pointLightIntensity', 0, 5, 0.1).onChange(() => this.setPointLightIntensity()).name('Light Intensity');
    }
    
    // Ulcer controls
    ulcerFolder.add(this.settings, 'enableUlcers').onChange(() => {
      this.regenerateUlcers();
    }).name('Show Ulcers');
    
    ulcerFolder.add(this.settings, 'ulcerCount', 0, 20, 1).onChange(() => {
      this.regenerateUlcers();
    }).name('Ulcer Count');
    
    ulcerFolder.add(this.settings, 'ulcerSize', 50, 300, 10).onChange(() => {
      this.regenerateUlcers();
    }).name('Ulcer Size');
    
    ulcerFolder.addColor(this.settings, 'ulcerColor').onChange(() => {
      this.regenerateUlcers();
    }).name('Ulcer Color');
    
    ulcerFolder.add(this.settings, 'ulcerIntensity', 0.5, 2, 0.1).name('Color Intensity');
    
    ulcerFolder.add(this.settings, 'ulcerSizeMultiplier', 1, 4, 0.1).onChange(() => {
      this.updateUlcerSizes();
    }).name('Size Multiplier');
    
    // Add reset button
    const resetButton = { 
      reset: () => {
        this.resetParticles();
      }
    };
    miscFolder.add(resetButton, 'reset').name('Reset Particles');
    
    // Auto-rotate is disabled for scroll experience
    // miscFolder.add(this.settings, 'rotate').onChange(() => {
    //   this.controls.autoRotate = this.settings.rotate;
    // }).name('Auto Rotate');
    
    miscFolder.add(this.settings, 'oldMethod').name('Alt Curl Method');
    
    // Open folders by default
    flowFolder.open();
    visualFolder.open();
    colorFolder.open();
    ulcerFolder.open();
    fogFolder.open();
    
    // Add GUI to container
    const guiContainer = document.getElementById('gui_container');
    if (guiContainer) {
      guiContainer.appendChild(this.gui.domElement);
    } else {
      // If container doesn't exist, create one
      const newContainer = document.createElement('div');
      newContainer.id = 'gui_container';
      newContainer.style.position = 'absolute';
      newContainer.style.top = '0';
      newContainer.style.right = '0';
      document.body.appendChild(newContainer);
      newContainer.appendChild(this.gui.domElement);
    }
  }

  setSize() {
    for (const system of this.particleSystems) {
      if (system.name === 'normal') {
        system.material.size = this.settings.size;
      } else if (system.name === 'ulcer') {
        system.material.size = this.settings.size * this.settings.ulcerSizeMultiplier;
      }
    }
  }

  setColor() {
    // The color is now handled by updateParticleVisibility per-vertex
    // We don't need to do anything here
  }
  
  setBackgroundColor() {
    this.renderer.setClearColor(this.settings.backgroundColor);
  }
  
  setAmbientLightColor() {
    if (this.ambientLight) {
      this.ambientLight.color.setHex(this.settings.ambientLightColor);
    }
  }
  
  setPointLightColor() {
    if (this.endoscopeLight) {
      this.endoscopeLight.color.setHex(this.settings.pointLightColor);
    }
  }
  
  setPointLightIntensity() {
    if (this.endoscopeLight) {
      this.endoscopeLight.intensity = this.settings.pointLightIntensity;
    }
  }

  normalize(v) {
    const length = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / length, v[1] / length, v[2] / length];
  }

  cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  noise3D(x, y, z) {
    return [
      this.simplex.simplex3(x, y, z), 
      this.simplex.simplex3(x, y, z + 1000.0), 
      this.simplex.simplex3(x + 1000.0, y, z)
    ];
  }

  computeCurl(x, y, z) {
    const eps = 1e-4;
    let curl = [0, 0, 0];

    if (!this.settings.oldMethod) {
      // Find rate of change in X plane
      const n1 = this.simplex.simplex3(x + eps, y, z); 
      const n2 = this.simplex.simplex3(x - eps, y, z); 
      // Average to find approximate derivative
      const a = (n1 - n2) / (2 * eps);
    
      // Find rate of change in Y plane
      const n3 = this.simplex.simplex3(x, y + eps, z); 
      const n4 = this.simplex.simplex3(x, y - eps, z); 
      // Average to find approximate derivative
      const b = (n3 - n4) / (2 * eps);
    
      // Find rate of change in Z plane
      const n5 = this.simplex.simplex3(x, y, z + eps); 
      const n6 = this.simplex.simplex3(x, y, z - eps); 
      // Average to find approximate derivative
      const c = (n5 - n6) / (2 * eps);
    
      const noiseGrad0 = [a, b, c];
    
      // Offset position for second noise read
      x += 10.5;
      y += 10.5;
      z += 10.5;
    
      // Find rate of change in X
      const n7 = this.simplex.simplex3(x + eps, y, z); 
      const n8 = this.simplex.simplex3(x - eps, y, z); 
      // Average to find approximate derivative
      const a2 = (n7 - n8) / (2 * eps);
    
      // Find rate of change in Y
      const n9 = this.simplex.simplex3(x, y + eps, z); 
      const n10 = this.simplex.simplex3(x, y - eps, z); 
      // Average to find approximate derivative
      const b2 = (n9 - n10) / (2 * eps);
    
      // Find rate of change in Z
      const n11 = this.simplex.simplex3(x, y, z + eps); 
      const n12 = this.simplex.simplex3(x, y, z - eps); 
      // Average to find approximate derivative
      const c2 = (n11 - n12) / (2 * eps);
    
      const noiseGrad1 = [a2, b2, c2];
    
      const normGrad0 = this.normalize(noiseGrad0);
      const normGrad1 = this.normalize(noiseGrad1);
      curl = this.cross(normGrad0, normGrad1);
    } else {
      // Find rate of change in X
      const n1 = this.noise3D(x + eps, y, z); 
      const n2 = this.noise3D(x - eps, y, z);
      const dx = [n1[0] - n2[0], n1[1] - n2[1], n1[2] - n2[2]];

      // Find rate of change in Y
      const n3 = this.noise3D(x, y + eps, z); 
      const n4 = this.noise3D(x, y - eps, z);
      const dy = [n3[0] - n4[0], n3[1] - n4[1], n3[2] - n4[2]];

      // Find rate of change in Z
      const n5 = this.noise3D(x, y, z + eps); 
      const n6 = this.noise3D(x, y, z - eps);
      const dz = [n5[0] - n6[0], n5[1] - n6[1], n5[2] - n6[2]];

      curl[0] = (dy[2] - dz[1]) / (2.0 * eps);
      curl[1] = (dz[0] - dx[2]) / (2.0 * eps);
      curl[2] = (dx[1] - dy[0]) / (2.0 * eps);
    }
    
    return this.normalize(curl);
  }

  move(dT) {
    const tunnelRadius = this.settings.tunnelRadius;
    const tunnelLength = this.settings.depth;
    const tunnelForceStrength = this.settings.tunnelForceStrength;
    const flowSpeed = this.settings.flowSpeed;
    const spiralFactor = this.settings.spiralFactor;
    
    for (let i = 0; i < this.settings.particleCount * 3; i += 3) {
      // Find curl value at particle location
      const curl = this.computeCurl(
        this.particles[i] / this.settings.step, 
        this.particles[i+1] / this.settings.step, 
        this.particles[i+2] / this.settings.step
      );

      // Check for NaN values
      if (isNaN(curl[0]) || isNaN(curl[1]) || isNaN(curl[2])) {
        curl[0] = 1;
        curl[1] = 0;
        curl[2] = 0;
      }
      
      // Get the closest path point and its tangent
      const particlePos = new THREE.Vector3(
        this.particles[i],
        this.particles[i+1],
        this.particles[i+2]
      );
      
      // Find approximate position along path based on z coordinate
      const zProgress = (particlePos.z + tunnelLength/2) / tunnelLength;
      const clampedProgress = Math.max(0, Math.min(1, zProgress));
      
      // Get point on path
      const pathPoint = this.tunnelPath.getPointAt(clampedProgress);
      
      // Calculate vector from particle to path center
      const toCenter = new THREE.Vector3(
        pathPoint.x - particlePos.x,
        pathPoint.y - particlePos.y,
        pathPoint.z - particlePos.z
      );
      
      // Calculate distance from tunnel center axis (excluding z component)
      const xyDistance = Math.sqrt(
        toCenter.x * toCenter.x + 
        toCenter.y * toCenter.y
      );
      
      // Add a force to maintain the tunnel shape around the path
      let tunnelForceX = 0;
      let tunnelForceY = 0;
      let tunnelForceZ = 0;
      
      if (xyDistance > 0) {
        // Normalize the direction vector in the xy plane
        const dirX = toCenter.x / xyDistance;
        const dirY = toCenter.y / xyDistance;
        
        // If too far from the tunnel center, add an inward force
        if (xyDistance > tunnelRadius * 1.2) {
          tunnelForceX = dirX * (xyDistance - tunnelRadius) * tunnelForceStrength;
          tunnelForceY = dirY * (xyDistance - tunnelRadius) * tunnelForceStrength;
        } 
        // If too close to the tunnel center, add an outward force
        else if (xyDistance < tunnelRadius * 0.8) {
          tunnelForceX = -dirX * (tunnelRadius - xyDistance) * tunnelForceStrength;
          tunnelForceY = -dirY * (tunnelRadius - xyDistance) * tunnelForceStrength;
        }
        
        // Add spiral motion around the tunnel
        if (spiralFactor > 0) {
          // Tangent vector (perpendicular to radial direction)
          const tangentX = -dirY;
          const tangentY = dirX;
          tunnelForceX += tangentX * spiralFactor;
          tunnelForceY += tangentY * spiralFactor;
        }
      }
      
      // Add forward flow through the tunnel
      const tunnelFlowZ = flowSpeed * 5;
      
      // Update particle velocity according to curl value, tunnel force, and speed
      this.velocities[i] = this.settings.speed * curl[0] * 0.5 + tunnelForceX;
      this.velocities[i+1] = this.settings.speed * curl[1] * 0.5 + tunnelForceY;
      this.velocities[i+2] = this.settings.speed * curl[2] * 0.5 + tunnelFlowZ;

      // Update particle position based on velocity
      this.particles[i] += this.velocities[i];
      this.particles[i+1] += this.velocities[i+1];
      this.particles[i+2] += this.velocities[i+2];

      // Update time
      const particleIndex = Math.floor(i / 3);
      this.times[particleIndex] += dT;

      // Calculate particle's distance from the path
      const distFromPath = new THREE.Vector3(
        this.particles[i] - pathPoint.x,
        this.particles[i+1] - pathPoint.y,
        this.particles[i+2] - pathPoint.z
      ).length();
      
      // Get camera position to determine where to respawn particles
      const cameraZ = this.camera.position.z;
      
      // Check if outside tunnel bounds or lifetime exceeded
      if (distFromPath > tunnelRadius * 2 || 
          this.particles[i+2] < -tunnelLength/2 - tunnelRadius || 
          this.particles[i+2] > tunnelLength/2 + tunnelRadius ||
          this.times[particleIndex] > this.lifetimes[particleIndex]) {
          
        // Reset particle position along the path
        const newPathPos = Math.random();
        const newPathPoint = this.tunnelPath.getPointAt(newPathPos);
        
        // Get direction at this point to orient the circle
        const tangent = this.tunnelPath.getTangentAt(newPathPos).normalize();
        
        // Create a plane perpendicular to the tangent
        const up = Math.abs(tangent.y) > 0.9 ? 
          new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
        const upDir = new THREE.Vector3().crossVectors(right, tangent).normalize();
        
        // Random angle around the circle
        const newTheta = Math.random() * Math.PI * 2;
        
        // Random radius with variation
        const newRadius = tunnelRadius * (0.7 + Math.random() * 0.3);
        
        // Position around the tunnel using the perpendicular plane
        const newX = newPathPoint.x + (right.x * newRadius * Math.cos(newTheta) + upDir.x * newRadius * Math.sin(newTheta));
        const newY = newPathPoint.y + (right.y * newRadius * Math.cos(newTheta) + upDir.y * newRadius * Math.sin(newTheta));
        const newZ = newPathPoint.z + (right.z * newRadius * Math.cos(newTheta) + upDir.z * newRadius * Math.sin(newTheta));
        
        this.particles[i] = newX;
        this.particles[i+1] = newY;
        this.particles[i+2] = newZ;
        
        // Store original position
        this.positions[i] = this.particles[i];
        this.positions[i+1] = this.particles[i+1];
        this.positions[i+2] = this.particles[i+2];
        
        // Reset time
        this.times[particleIndex] = 0.0;
      }
    }
    
    // No need to update the geometry here, as it will be updated in updateParticleVisibility
  }

  onWindowResize() {
    // Get window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update camera
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer
    this.renderer.setSize(width, height, false);
  }

  isInFullscreen() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  animate() {
    // Start stats measurement
    this.stats.begin();
    
    // Calculate delta time
    const thisFrame = Date.now();
    const dT = (thisFrame - this.lastFrame) / 1000;
    this.time += dT;
    this.lastFrame = thisFrame;
    
    // Update camera position based on scroll
    this.updateCameraFromScroll(dT);
    
    // Update particle positions
    this.move(dT);
    
    // Update particle visibility based on distance from camera
    this.updateParticleVisibility();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
    
    // End stats measurement
    this.stats.end();
    
    // Request next frame
    requestAnimationFrame(this.animate.bind(this));
  }
  
  start() {
    // Start animation loop
    this.animate();
  }

  // New method to reset all particles to tunnel positions
  resetParticles() {
    this.simplex.seed(Math.random());
    
    // Regenerate tunnel path
    this.tunnelPath = this.createTunnelPath();
    this.pathPoints = this.tunnelPath.getPoints(1000);
    
    // Regenerate ulcers
    this.generateUlcers();
    
    // Reset original particle arrays
    for (let i = 0; i < this.settings.particleCount; i++) {
      const particleIndex = i * 3;
      
      // Random position along the path
      const pathPos = Math.random();
      const pathPoint = this.tunnelPath.getPointAt(pathPos);
      
      // Create a tunnel by placing particles in a cylindrical shape
      const theta = Math.random() * Math.PI * 2;
      
      // Random radius with variation
      const radiusVariation = Math.pow(Math.random(), 0.5);
      const radius = this.settings.tunnelRadius * (0.7 + radiusVariation * 0.3);
      
      // Get direction at this point to orient the circle
      const tangent = this.tunnelPath.getTangentAt(pathPos).normalize();
      
      // Create a plane perpendicular to the tangent
      const up = Math.abs(tangent.y) > 0.9 ? 
        new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const upDir = new THREE.Vector3().crossVectors(right, tangent).normalize();
      
      // Position around the tunnel using the perpendicular plane
      const x = pathPoint.x + (right.x * radius * Math.cos(theta) + upDir.x * radius * Math.sin(theta));
      const y = pathPoint.y + (right.y * radius * Math.cos(theta) + upDir.y * radius * Math.sin(theta));
      const z = pathPoint.z + (right.z * radius * Math.cos(theta) + upDir.z * radius * Math.sin(theta));
      
      // Set particle position
      this.particles[particleIndex] = x;
      this.particles[particleIndex+1] = y;
      this.particles[particleIndex+2] = z;
      
      // Store original position
      this.positions[particleIndex] = x;
      this.positions[particleIndex+1] = y;
      this.positions[particleIndex+2] = z;
      
      // Initialize with slight inward velocity to maintain tunnel shape
      const vx = (pathPoint.x - x) * 0.01 + (0.2 - Math.random() * 0.4);
      const vy = (pathPoint.y - y) * 0.01 + (0.2 - Math.random() * 0.4);
      const vz = (pathPoint.z - z) * 0.01 + (0.2 - Math.random() * 0.4);
      
      this.velocities[particleIndex] = vx;
      this.velocities[particleIndex+1] = vy;
      this.velocities[particleIndex+2] = vz;
      
      // Reset time and alpha
      this.times[i] = 0;
      this.alphas[i] = 0;
      
      // Check if this particle should be part of an ulcer
      let isUlcerParticle = false;
      
      if (this.settings.enableUlcers && this.ulcers.length > 0) {
        for (const ulcer of this.ulcers) {
          const distance = new THREE.Vector3(x, y, z).distanceTo(ulcer.position);
          if (distance < ulcer.size) {
            isUlcerParticle = true;
            break;
          }
        }
      }
      
      // Update size value in our array
      if (isUlcerParticle) {
        this.sizes[i] = this.settings.size * this.settings.ulcerSizeMultiplier;
      } else {
        this.sizes[i] = this.settings.size;
      }
    }
    
    // Re-create the particle systems with the new data
    this.rebuildParticleSystems();
  }

  // Create a taller document to allow scrolling
  createScrollableDocument() {
    // Create or update scroll container
    let scrollContainer = document.getElementById('scroll_container');
    if (!scrollContainer) {
      scrollContainer = document.createElement('div');
      scrollContainer.id = 'scroll_container';
      scrollContainer.style.position = 'absolute';
      scrollContainer.style.top = '0';
      scrollContainer.style.left = '0';
      scrollContainer.style.width = '100%';
      scrollContainer.style.height = `${this.maxScrollDistance}px`;
      scrollContainer.style.zIndex = '-1';
      document.body.appendChild(scrollContainer);
    } else {
      scrollContainer.style.height = `${this.maxScrollDistance}px`;
    }
    
    // We're no longer creating journey markers here - they are created in main.js
  }
  
  // Setup scroll handler
  setupScrollHandler() {
    window.addEventListener('scroll', () => {
      // Calculate progress based on scroll position
      const scrollPosition = window.scrollY;
      this.targetScrollProgress = Math.min(scrollPosition / this.maxScrollDistance, 1);
    });
  }
  
  // Update camera position based on scroll
  updateCameraFromScroll(dT) {
    // Smoothly approach target scroll position
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * this.settings.scrollSmoothing;
    
    // Get position on the curved path
    const pathPosition = this.tunnelPath.getPointAt(this.scrollProgress);
    
    // Get direction at this point
    const tangent = this.tunnelPath.getTangentAt(this.scrollProgress);
    
    // Calculate look-ahead point
    const lookAheadAmount = 0.05; // How far ahead to look
    const lookAtPosition = this.tunnelPath.getPointAt(
      Math.min(this.scrollProgress + lookAheadAmount, 1.0)
    );
    
    // Add slight camera shake for endoscope realism
    const shakeAmount = 0.5;
    const oscillationX = Math.sin(this.time * 1.5) * shakeAmount;
    const oscillationY = Math.cos(this.time * 1.7) * shakeAmount;
    
    // Update camera position with slight offset from center and shake
    this.camera.position.set(
      pathPosition.x + oscillationX,
      pathPosition.y + oscillationY,
      pathPosition.z
    );
    
    // Look toward the look-ahead point
    this.camera.lookAt(lookAtPosition);
    
    // Slight rotation for more realism
    this.camera.rotateZ(Math.sin(this.time * 0.2) * 0.01);
    
    return this.scrollProgress;
  }

  createTunnelPath() {
    // Create a curved path with anatomical twists
    const curvePoints = [];
    const segments = 20;
    const tunnelLength = this.settings.depth;
    
    // Create a series of control points for a curve
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const z = -tunnelLength/2 + tunnelLength * t;
      
      // Add anatomical twists and turns
      // The sin/cos functions create organic-looking curves
      const amplitude = this.settings.tunnelRadius * 3;
      const frequency = 0.5;
      
      // Create more dramatic curves in the middle sections
      const xOffset = amplitude * Math.sin(t * Math.PI * frequency) * Math.sin(t * 5);
      const yOffset = amplitude * Math.cos(t * Math.PI * frequency) * Math.sin(t * 4);
      
      // Add some smaller undulations for realism
      const smallWaves = this.settings.tunnelRadius * Math.sin(t * 20) * 0.2;
      
      curvePoints.push(new THREE.Vector3(
        xOffset + smallWaves,
        yOffset + smallWaves,
        z
      ));
    }
    
    // Create a smooth curve from the points
    return new THREE.CatmullRomCurve3(curvePoints);
  }

  // Update particle visibility based on distance from camera
  updateParticleVisibility() {
    const cameraPos = this.camera.position.clone();
    const fogDistance = this.settings.fogDistance;
    const fogDensity = this.settings.fogDensity;
    
    // Get look direction (where the camera is facing)
    const lookAtPos = new THREE.Vector3();
    this.camera.getWorldDirection(lookAtPos);
    lookAtPos.normalize();
    
    // Update alpha values for each particle
    for (let i = 0; i < this.settings.particleCount; i++) {
      const index = i * 3;
      
      // Get particle position
      const particlePos = new THREE.Vector3(
        this.particles[index],
        this.particles[index + 1],
        this.particles[index + 2]
      );
      
      // Calculate vector from camera to particle
      const toParticle = particlePos.clone().sub(cameraPos);
      
      // Calculate distance from camera
      const distance = toParticle.length();
      
      // Check if particle is in front of camera (dot product > 0)
      const inFrontOfCamera = toParticle.dot(lookAtPos) > 0;
      
      // Calculate opacity based on distance
      let opacity = 0;
      
      if (inFrontOfCamera) {
        // Start fading particles in at fogDistance
        if (distance < fogDistance) {
          // Full opacity for close particles
          opacity = 1.0;
        } else {
          // Fade out with distance using exponential falloff
          const falloffFactor = Math.exp(-(distance - fogDistance) * fogDensity);
          opacity = Math.max(0, falloffFactor);
        }
        
        // Apply smoothing to avoid popping
        this.alphas[i] = this.alphas[i] * 0.9 + opacity * 0.1;
      } else {
        // Behind camera - fade out
        this.alphas[i] *= 0.9;
      }
    }
    
    // Update each particle system
    for (const system of this.particleSystems) {
      const positions = system.points.geometry.getAttribute('position').array;
      const colors = system.points.geometry.getAttribute('color').array;
      
      // Update positions and colors for each particle in this system
      for (let i = 0; i < system.originalIndices.length; i++) {
        const originalIndex = system.originalIndices[i];
        const originalPosition = originalIndex * 3;
        const positionInGroup = i * 3;
        
        // Update position
        positions[positionInGroup] = this.particles[originalPosition];
        positions[positionInGroup + 1] = this.particles[originalPosition + 1];
        positions[positionInGroup + 2] = this.particles[originalPosition + 2];
        
        // Check if this particle is part of an ulcer
        let isUlcerParticle = false;
        let ulcerColor = null;
        
        const particlePos = new THREE.Vector3(
          this.particles[originalPosition],
          this.particles[originalPosition + 1],
          this.particles[originalPosition + 2]
        );
        
        if (this.settings.enableUlcers && this.ulcers.length > 0) {
          for (const ulcer of this.ulcers) {
            const distanceToUlcer = particlePos.distanceTo(ulcer.position);
            
            if (distanceToUlcer < ulcer.size) {
              isUlcerParticle = true;
              
              // Calculate intensity based on distance from center
              const ulcerIntensity = 1 - (distanceToUlcer / ulcer.size);
              
              // Clone the ulcer color and adjust intensity
              ulcerColor = ulcer.color.clone();
              
              // Make particles closer to the center more intense
              if (ulcerIntensity > 0.7) {
                ulcerColor.multiplyScalar(this.settings.ulcerIntensity);
              }
              break;
            }
          }
        }
        
        // Update color with opacity
        if (isUlcerParticle && ulcerColor) {
          const particleColor = ulcerColor.clone();
          particleColor.multiplyScalar(this.alphas[originalIndex]);
          colors[positionInGroup] = particleColor.r;
          colors[positionInGroup + 1] = particleColor.g;
          colors[positionInGroup + 2] = particleColor.b;
        } else {
          const baseColor = new THREE.Color(this.settings.color);
          const particleColor = baseColor.clone();
          particleColor.multiplyScalar(this.alphas[originalIndex]);
          colors[positionInGroup] = particleColor.r;
          colors[positionInGroup + 1] = particleColor.g;
          colors[positionInGroup + 2] = particleColor.b;
        }
      }
      
      // Mark attributes as needing update
      system.points.geometry.getAttribute('position').needsUpdate = true;
      system.points.geometry.getAttribute('color').needsUpdate = true;
    }
  }

  // Add this new method to generate ulcers
  generateUlcers() {
    this.ulcers = [];
    
    if (!this.settings.enableUlcers) return;
    
    // Create ulcers at random positions along the tunnel
    for (let i = 0; i < this.settings.ulcerCount; i++) {
      // Random position along the path (avoid very beginning and end)
      const pathPos = 0.1 + Math.random() * 0.8;
      const pathPoint = this.tunnelPath.getPointAt(pathPos);
      
      // Random angle around the tunnel
      const theta = Math.random() * Math.PI * 2;
      
      // Get direction at this point to orient correctly
      const tangent = this.tunnelPath.getTangentAt(pathPos).normalize();
      
      // Create a plane perpendicular to the tangent
      const up = Math.abs(tangent.y) > 0.9 ? 
        new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const upDir = new THREE.Vector3().crossVectors(right, tangent).normalize();
      
      // Position on the tunnel wall
      const radius = this.settings.tunnelRadius * 0.98; // Slightly inside the tunnel wall
      
      const x = pathPoint.x + (right.x * radius * Math.cos(theta) + upDir.x * radius * Math.sin(theta));
      const y = pathPoint.y + (right.y * radius * Math.cos(theta) + upDir.y * radius * Math.sin(theta));
      const z = pathPoint.z + (right.z * radius * Math.cos(theta) + upDir.z * radius * Math.sin(theta));
      
      // Random size variation (50-150% of base size)
      const sizeVariation = 0.5 + Math.random();
      
      // Create an ulcer object
      const ulcer = {
        position: new THREE.Vector3(x, y, z),
        size: this.settings.ulcerSize * sizeVariation,
        pathPosition: pathPos,
        theta: theta,
        color: new THREE.Color(this.settings.ulcerColor)
      };
      
      // Randomly vary the color for more realism
      // Some ulcers can be darker, more reddish, or yellowish
      if (Math.random() < 0.3) {
        // More yellowish
        ulcer.color.offsetHSL(0.05, 0.3, 0);
      } else if (Math.random() < 0.5) {
        // More reddish and darker
        ulcer.color.offsetHSL(-0.05, 0.2, -0.1);
      }
      
      this.ulcers.push(ulcer);
    }
  }

  // Method to regenerate ulcers when settings change
  regenerateUlcers() {
    this.generateUlcers();
    this.resetParticles();
  }

  // Add a new method to update ulcer particle sizes
  updateUlcerSizes() {
    if (!this.geometry || !this.ulcers || !this.settings.enableUlcers) return;
    
    const sizeAttribute = this.geometry.getAttribute('size');
    if (!sizeAttribute) return;
    
    // For each particle
    for (let i = 0; i < this.settings.particleCount; i++) {
      const index = i * 3;
      
      // Get particle position
      const particlePos = new THREE.Vector3(
        this.particles[index],
        this.particles[index + 1],
        this.particles[index + 2]
      );
      
      // Check if this particle is part of an ulcer
      let isUlcerParticle = false;
      let ulcerIntensity = 0;
      
      if (this.settings.enableUlcers && this.ulcers.length > 0) {
        for (const ulcer of this.ulcers) {
          const distanceToUlcer = particlePos.distanceTo(ulcer.position);
          
          if (distanceToUlcer < ulcer.size) {
            isUlcerParticle = true;
            
            // Calculate intensity based on distance from center
            ulcerIntensity = 1 - (distanceToUlcer / ulcer.size);
            break;
          }
        }
      }
      
      // Update particle size
      if (isUlcerParticle) {
        const sizeMultiplier = this.settings.ulcerSizeMultiplier * (0.8 + 0.4 * ulcerIntensity);
        sizeAttribute.array[i] = this.settings.size * sizeMultiplier;
      } else {
        sizeAttribute.array[i] = this.settings.size;
      }
    }
    
    sizeAttribute.needsUpdate = true;
  }

  // Method to rebuild particle systems after major changes
  rebuildParticleSystems() {
    // Remove existing particle systems
    if (this.particleSystems) {
      for (const system of this.particleSystems) {
        this.scene.remove(system.points);
      }
    }
    
    // Load texture
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = '';
    const texture = loader.load('https://al-ro.github.io/images/embers/ember_texture.png');
    
    // Create new particle systems
    this.createMultipleSizedParticleSystems(texture);
  }
} 