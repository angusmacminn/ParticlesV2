/**
 * Stomach Tunnel Animation with Particle Effects
 * 
 * This file creates a 3D animation of a stomach tunnel with particle effects.
 * The animation includes stomach ulcers represented as depressions in the tunnel wall.
 * 
 * ULCER CONTROL PARAMETERS:
 * 
 * 1. ulcerDepthFactor (0.1-1.0): Controls how deep the ulcers appear. 
 *    Higher values = deeper depressions.
 * 
 * 2. ulcerCompactness (0.2-1.0): Controls how particles spread within ulcers.
 *    Higher values = more concentrated particles (smaller ulcer area).
 * 
 * 3. ulcerEdgeSoftness (0.1-1.0): Controls how gradually ulcers blend with tunnel walls.
 *    Higher values = more gradual blending (softer edges).
 * 
 * You can adjust these parameters using:
 * stomachAnimation.updateUlcerSettings({
 *   ulcerDepthFactor: 0.4,    // How deep ulcers appear (0.1-1.0)
 *   ulcerCompactness: 0.6,    // How concentrated particles are (0.2-1.0)
 *   ulcerEdgeSoftness: 0.3    // How gradually ulcers blend with walls (0.1-1.0)
 * });
 */

/**
 * Stomach Tunnel Particle Animation
 * 
 * This standalone file creates a stomach tunnel with ulcers using Three.js
 * It's designed to be used in Webflow without dependencies on any GUI library
 */

// Configuration settings - Edit these values to customize the animation
const ANIMATION_CONFIG = {
  // Animation settings
  particleCount: 25000,           // Number of particles (5000 on mobile)
  animationDuration: 20,          // Animation duration in seconds
  
  // Tunnel settings
  tunnelRadius: 400,              // Radius of the tunnel
  tunnelDepth: 8000,              // Length of the tunnel
  tunnelColor: 0xEA368E,          // Fuschia color for stomach tissue
  
  // Particle settings
  particleSize: 20,               // Size of regular particles
  particleSpeed: 3.5,             // Movement speed
  
  // Ulcer settings
  enableUlcers: true,             // Whether to show ulcers
  ulcerCount: 6,                  // Number of ulcers
  ulcerSize: 100,                 // Size of ulcers
  ulcerColor: 0x00FF00,           // Green color for ulcers
  ulcerSizeMultiplier: 1.0,       // How much larger ulcer particles are
  ulcerDepthFactor: 0.4,          // How deep ulcers appear (0.1-1.0, higher = deeper depression)
  ulcerCompactness: 0.6,          // How compact/spread ulcer particles are (0.2-1.0, higher = more compact)
  ulcerEdgeSoftness: 0.3,         // How softly ulcers blend with tunnel wall (0.1-1.0, higher = smoother blend)
  ulcerDistribution: 0.8,         // How much of tunnel length is used for ulcers (0.2-1.0)
  ulcerColorVariation: 0.0,       // Variation in ulcer color (0.0-0.3, adds slight variation for realism)
  
  // Visual settings
  fogDensity: 0.002,              // Fog density (0.0001-0.01 range, higher = foggier)
  fogEnabled: true,               // Whether to use fog for depth effect
  fogColor: 0x000000,             // Fog color (black)
  lightIntensity: 2.0,            // Point light intensity
  tunnelForceStrength: 0.18,      // How strongly particles stick to walls
  
  // Performance settings
  resetInterval: 1.0,             // Seconds between partial particle resets
  mobileParticleReduction: 0.2,   // Factor to reduce particles on mobile (0.2 = 20%)
  
  // Curl noise settings
  curlNoiseScale: 0.0001,         // Scale of curl noise (smaller = larger patterns)
  curlNoiseTimeScale: 0.15,       // How fast the curl noise changes over time
  curlNoiseStrength: 1.2,         // Strength of curl noise influence
  velocityDamping: 0.95           // Damping factor for velocity (higher = more movement)
};

// SimplexNoise implementation
class SimplexNoise {
  constructor(random = Math) {
    this.grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0], 
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1], 
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    
    this.p = [];
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(random.random() * 256);
    }
    
    this.perm = [];
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }
  
  dot(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }
  
  simplex3(xin, yin, zin) {
    let n0, n1, n2, n3;
    
    const F3 = 1.0 / 3.0;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const G3 = 1.0 / 6.0;
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;
    
    let i1, j1, k1;
    let i2, j2, k2;
    
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;
    
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
    const gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
    const gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;
    
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0);
    }
    
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1);
    }
    
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2);
    }
    
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
      t3 *= t3;
      n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3);
    }
    
    return 32.0 * (n0 + n1 + n2 + n3);
  }
  
  seed(seed) {
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(random() * 256);
    }
    
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }
}

// Main particle system class
class StomachTunnelAnimation {
  constructor(options = {}) {
    // Default settings that can be overridden
    this.settings = {
      containerId: options.containerId || 'animation-container',
      particleCount: options.particleCount || (this.isMobile() ? Math.floor(ANIMATION_CONFIG.particleCount * ANIMATION_CONFIG.mobileParticleReduction) : ANIMATION_CONFIG.particleCount),
      width: options.width || 2000,
      height: options.height || 2000,
      depth: options.depth || ANIMATION_CONFIG.tunnelDepth,
      speed: options.speed || ANIMATION_CONFIG.particleSpeed,
      step: options.step || 1500,
      animationDuration: options.animationDuration || ANIMATION_CONFIG.animationDuration,
      size: options.size || (this.isMobile() ? 120 : ANIMATION_CONFIG.particleSize),
      color: options.color || ANIMATION_CONFIG.tunnelColor,
      // Tunnel specific settings
      tunnelRadius: options.tunnelRadius || ANIMATION_CONFIG.tunnelRadius,
      tunnelForceStrength: options.tunnelForceStrength || ANIMATION_CONFIG.tunnelForceStrength,
      flowSpeed: options.flowSpeed || 5.0,
      spiralFactor: options.spiralFactor || 0.2,
      // Color settings
      backgroundColor: options.backgroundColor || 0x000000,
      ambientLightColor: options.ambientLightColor || ANIMATION_CONFIG.tunnelColor,
      pointLightColor: options.pointLightColor || 0xffffff,
      pointLightIntensity: options.pointLightIntensity || ANIMATION_CONFIG.lightIntensity,
      // Fog settings for depth perception
      fogDistance: options.fogDistance || 5000,
      fogDensity: options.fogDensity || ANIMATION_CONFIG.fogDensity,
      fogEnabled: options.fogEnabled !== undefined ? options.fogEnabled : ANIMATION_CONFIG.fogEnabled,
      fogColor: options.fogColor || ANIMATION_CONFIG.fogColor,
      // Ulcer settings
      enableUlcers: options.enableUlcers !== undefined ? options.enableUlcers : ANIMATION_CONFIG.enableUlcers,
      ulcerCount: options.ulcerCount || ANIMATION_CONFIG.ulcerCount,
      ulcerSize: options.ulcerSize || ANIMATION_CONFIG.ulcerSize,
      ulcerColor: options.ulcerColor || ANIMATION_CONFIG.ulcerColor,
      ulcerIntensity: options.ulcerIntensity || 2,
      ulcerSizeMultiplier: options.ulcerSizeMultiplier || ANIMATION_CONFIG.ulcerSizeMultiplier,
      ulcerDepthFactor: options.ulcerDepthFactor || ANIMATION_CONFIG.ulcerDepthFactor,
      ulcerCompactness: options.ulcerCompactness || ANIMATION_CONFIG.ulcerCompactness,
      ulcerEdgeSoftness: options.ulcerEdgeSoftness || ANIMATION_CONFIG.ulcerEdgeSoftness,
      ulcerDistribution: options.ulcerDistribution || ANIMATION_CONFIG.ulcerDistribution,
      ulcerColorVariation: options.ulcerColorVariation || ANIMATION_CONFIG.ulcerColorVariation,
      // Loop settings
      resetInterval: options.resetInterval || ANIMATION_CONFIG.resetInterval,
      // New curl noise specific settings
      curlNoiseScale: options.curlNoiseScale || ANIMATION_CONFIG.curlNoiseScale,
      curlNoiseTimeScale: options.curlNoiseTimeScale || ANIMATION_CONFIG.curlNoiseTimeScale,
      curlNoiseStrength: options.curlNoiseStrength || ANIMATION_CONFIG.curlNoiseStrength,
      velocityDamping: options.velocityDamping || ANIMATION_CONFIG.velocityDamping
    };

    // Animation progress (0 to 1)
    this.progress = 0;
    this.startTime = null;
    
    // Initialize properties
    this.particles = [];
    this.velocities = [];
    this.times = [];
    this.lifetimes = [];
    this.positions = [];
    this.alphas = [];
    this.colors = [];
    this.sizes = [];
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.geometry = null;
    this.material = null;
    this.points = null;
    this.lastFrame = Date.now();
    this.time = 0;
    
    // Initialize noise generator
    this.simplex = new SimplexNoise();
    this.simplex.seed(Math.random());

    // Path for the camera to follow
    this.tunnelPath = null;
    this.pathPoints = [];
    
    // Storage for ulcer positions
    this.ulcers = [];
    
    // For the particle texture
    this.particleTexture = null;
    
    // Track particle types to maintain ulcer positions during resets
    this.particleTypes = []; // 0 = regular, 1 = ulcer
    this.ulcerAssignments = []; // which ulcer each particle belongs to

    // Add a timer for partial particle reset
    this.lastPartialReset = Date.now();

    // For debugging animation duration
    this.lastLoggedTime = -1;
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

  // Create particle texture
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    
    // Create radial gradient for a soft particle
    const gradient = context.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  init() {
    // Check for WebGL support
    if (!this.hasWebGL()) {
      console.error('WebGL not supported');
      this.showWebGLError();
      return;
    }
    
    // Create container if it doesn't exist
    let container = document.getElementById(this.settings.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.settings.containerId;
      container.style.position = 'relative';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.overflow = 'hidden';
      document.body.appendChild(container);
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);
    
    // Setup renderer with better settings for quality
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      canvas: canvas,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(this.settings.backgroundColor);
    this.renderer.autoClear = true;
    
    // Create particle texture
    this.particleTexture = this.createParticleTexture();

    // Setup scene
    this.scene = new THREE.Scene();
    
    // Add fog for depth - but with safety limits on density
    if (this.settings.fogEnabled !== false) {
      // Limit fog density to reasonable values to prevent complete fogging
      const safeFogDensity = this.getSafeFogDensity(this.settings.fogDensity);
      
      // Apply fog with safe density value
      this.scene.fog = new THREE.FogExp2(
        this.settings.backgroundColor, 
        safeFogDensity
      );
      console.log(`Fog initialized with density: ${safeFogDensity}`);
    } else {
      console.log('Fog disabled');
    }

    // Setup camera
    const ratio = container.clientWidth / container.clientHeight;
    const tunnelRadius = this.settings.tunnelRadius;
    const tunnelLength = this.settings.depth;
    const FOV = 60;
    
    this.camera = new THREE.PerspectiveCamera(FOV, ratio, 1, 20000);
    this.camera.position.set(0, 0, -tunnelLength/2 - tunnelRadius * 2);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(this.camera);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(this.settings.ambientLightColor, 0.5);
    this.scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(
      this.settings.pointLightColor, 
      this.settings.pointLightIntensity, 
      2000
    );
    pointLight.position.set(0, 0, 0);
    this.camera.add(pointLight);

    // Generate tunnel path
    this.tunnelPath = this.createTunnelPath();
    this.pathPoints = this.tunnelPath.getPoints(1000);
    
    // Generate ulcers
    this.generateUlcers();

    // Initialize particles
    this.initParticles();
    
    // Event listener for window resize
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }
  
  hasWebGL() {
    try {
      return !!window.WebGLRenderingContext && 
            (!!document.createElement('canvas').getContext('webgl') || 
             !!document.createElement('canvas').getContext('experimental-webgl'));
    } catch(e) {
      return false;
    }
  }
  
  showWebGLError() {
    const container = document.getElementById(this.settings.containerId);
    if (container) {
      container.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white; font-family: Arial, sans-serif;">
          <h2>WebGL Not Supported</h2>
          <p>Your browser doesn't support WebGL which is required for this animation.</p>
          <p>Please try using a modern browser like Chrome, Firefox, or Edge.</p>
        </div>
      `;
    }
  }

  createTunnelPath() {
    // Create a more natural curved tunnel path
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, -this.settings.depth/2),
      new THREE.Vector3(200, 100, -this.settings.depth/3),
      new THREE.Vector3(-150, 50, -this.settings.depth/6),
      new THREE.Vector3(100, -100, 0),
      new THREE.Vector3(-100, -50, this.settings.depth/6),
      new THREE.Vector3(150, 50, this.settings.depth/3),
      new THREE.Vector3(0, 0, this.settings.depth/2)
    ]);
    
    return curve;
  }

  generateUlcers() {
    this.ulcers = [];
    const tunnelLength = this.settings.depth;
    const ulcerCount = this.settings.ulcerCount;
    const tunnelRadius = this.settings.tunnelRadius;
    const distribution = this.settings.ulcerDistribution;
    
    for (let i = 0; i < ulcerCount; i++) {
      // Calculate ulcer position along tunnel - ensure even distribution
      // Adjust distribution to use the configured range
      const t = i / (ulcerCount - 1) * distribution + (1.0 - distribution) / 2;
      const pathPoint = this.tunnelPath.getPoint(t);
      
      // Calculate angle around tunnel circumference
      const angle = Math.random() * Math.PI * 2;
      const radius = tunnelRadius; // Exactly on the tunnel wall
      
      // Calculate position on tunnel wall
      const x = pathPoint.x + Math.cos(angle) * radius;
      const y = pathPoint.y + Math.sin(angle) * radius;
      const z = pathPoint.z;
      
      // Calculate normal vector (pointing inward from tunnel wall)
      const normal = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      ).normalize();
      
      // Add some variation to ulcer size
      const sizeVariation = 0.7 + Math.random() * 0.6;
      
      // Create base color with slight variation if enabled
      let color = new THREE.Color(this.settings.ulcerColor);
      if (this.settings.ulcerColorVariation > 0) {
        const variation = this.settings.ulcerColorVariation;
        color.r += (Math.random() * 2 - 1) * variation;
        color.g += (Math.random() * 2 - 1) * variation;
        color.b += (Math.random() * 2 - 1) * variation;
        color.r = Math.min(Math.max(color.r, 0), 1);
        color.g = Math.min(Math.max(color.g, 0), 1);
        color.b = Math.min(Math.max(color.b, 0), 1);
      }
      
      this.ulcers.push({
        position: new THREE.Vector3(x, y, z),
        normal: normal,
        size: this.settings.ulcerSize * sizeVariation,
        t: t, // Store path position for later reference
        angle: angle, // Store angle for later reference
        color: color // Store color for this ulcer
      });
    }
  }

  initParticles() {
    const tunnelRadius = this.settings.tunnelRadius;
    const tunnelLength = this.settings.depth;
    const particleCount = this.settings.particleCount;
    
    // Arrays for vertex attributes
    this.positions = new Float32Array(particleCount * 3);
    this.sizes = new Float32Array(particleCount);
    this.colors = new Float32Array(particleCount * 3);
    this.alphas = new Float32Array(particleCount);
    this.velocities = [];
    this.lifetimes = [];
    this.particleTypes = new Array(particleCount).fill(0); // Initialize all as regular particles
    this.ulcerAssignments = new Array(particleCount).fill(-1); // Initialize with no ulcer assignment
    
    // Create geometry and material
    this.geometry = new THREE.BufferGeometry();
    
    // Generate particles - ensure even distribution along tunnel
    const particlesPerSection = 20; // Number of particles around the circumference
    const particlesPerUlcer = Math.floor(particleCount * 0.2 / this.ulcers.length);
    let particleIndex = 0;
    
    // First, create particles for the tunnel walls
    for (let t = 0; t < 1; t += 0.01) {
      const pathPoint = this.tunnelPath.getPoint(t);
      
      // Create particles around this point on the tunnel
      for (let i = 0; i < particlesPerSection; i++) {
        if (particleIndex >= particleCount) break;
        
        // Position around the tunnel circumference
        const angle = (i / particlesPerSection) * Math.PI * 2;
        const radius = tunnelRadius * (0.95 + Math.random() * 0.05);
        
        // Calculate position
        this.positions[particleIndex * 3] = pathPoint.x + Math.cos(angle) * radius;
        this.positions[particleIndex * 3 + 1] = pathPoint.y + Math.sin(angle) * radius;
        this.positions[particleIndex * 3 + 2] = pathPoint.z;
        
        // Set regular particle size
        this.sizes[particleIndex] = this.settings.size * (0.8 + Math.random() * 0.4);
        
        // Set regular color (fuschia)
        const color = new THREE.Color(this.settings.color);
        this.colors[particleIndex * 3] = color.r;
        this.colors[particleIndex * 3 + 1] = color.g;
        this.colors[particleIndex * 3 + 2] = color.b;
        
        // Add velocity
        this.velocities.push(new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        ));
        
        // Particle lifetime
        this.lifetimes.push(2 + Math.random() * 3);
        
        // Full opacity
        this.alphas[particleIndex] = 1.0;
        
        particleIndex++;
      }
    }
    
    // Next, create particles for ulcers
    if (this.settings.enableUlcers) {
      for (let u = 0; u < this.ulcers.length; u++) {
        const ulcer = this.ulcers[u];
        
        // Create particles for this ulcer
        for (let i = 0; i < particlesPerUlcer; i++) {
          if (particleIndex >= particleCount) break;
          
          // Position within the ulcer - using a 2D disc distribution plus inward depression
          const theta = Math.random() * Math.PI * 2; // Around the ulcer center
          
          // Radial distance - use compactness setting to control distribution
          // Higher compactness = more concentrated in center
          const compactness = this.settings.ulcerCompactness;
          const r = ulcer.size * Math.pow(Math.random(), compactness) * compactness;
          
          // Depth - create a depression effect (negative means inward from tunnel wall)
          // Use depth factor setting to control how deep the ulcers appear
          const depthFactor = this.settings.ulcerDepthFactor;
          const edgeSoftness = this.settings.ulcerEdgeSoftness;
          
          // Calculate depth - deeper in center, gradually becoming level with wall at edges
          // Edge softness controls how quickly depth reduces toward edges
          const depthProfile = 1.0 - Math.pow(r/(ulcer.size * compactness), 1/edgeSoftness);
          const ulcerDepth = -ulcer.size * depthFactor * depthProfile;
          
          // Create a tangent basis for the ulcer surface
          const tangent1 = new THREE.Vector3(1, 0, 0);
          if (Math.abs(ulcer.normal.dot(tangent1)) > 0.9) {
            tangent1.set(0, 1, 0); // Switch basis if too parallel
          }
          tangent1.crossVectors(tangent1, ulcer.normal).normalize();
          const tangent2 = new THREE.Vector3().crossVectors(ulcer.normal, tangent1).normalize();
          
          // Calculate position using the tangent basis plus depth along normal
          const pos = new THREE.Vector3().copy(ulcer.position);
          pos.addScaledVector(tangent1, Math.cos(theta) * r);
          pos.addScaledVector(tangent2, Math.sin(theta) * r);
          pos.addScaledVector(ulcer.normal, ulcerDepth); // Move inward from wall
          
          this.positions[particleIndex * 3] = pos.x;
          this.positions[particleIndex * 3 + 1] = pos.y;
          this.positions[particleIndex * 3 + 2] = pos.z;
          
          // Set ulcer particle size - make inner particles larger for depth effect
          const particleSizeFactor = 1.0 + Math.abs(ulcerDepth) / (ulcer.size * 0.2);
          this.sizes[particleIndex] = this.settings.size * this.settings.ulcerSizeMultiplier * 
            (0.8 + Math.random() * 0.3) * particleSizeFactor;
          
          // Set ulcer color - use the stored color with the ulcer
          const color = ulcer.color;
          this.colors[particleIndex * 3] = color.r;
          this.colors[particleIndex * 3 + 1] = color.g;
          this.colors[particleIndex * 3 + 2] = color.b;
          
          // Add velocity - slightly biased inward for the depression effect
          const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
          );
          vel.addScaledVector(ulcer.normal, -0.1); // Slight inward bias
          this.velocities.push(vel);
          
          // Particle lifetime
          this.lifetimes.push(2 + Math.random() * 3);
          
          // Full opacity
          this.alphas[particleIndex] = 1.0;
          
          // Mark as ulcer particle
          this.particleTypes[particleIndex] = 1;
          this.ulcerAssignments[particleIndex] = u;
          
          particleIndex++;
        }
      }
    }
    
    // Fill any remaining particles with random distribution
    while (particleIndex < particleCount) {
      // Get random position along tunnel path
      const t = Math.random();
      const pathPoint = this.tunnelPath.getPoint(t);
      
      // Position around the tunnel circumference
      const angle = Math.random() * Math.PI * 2;
      const radius = tunnelRadius * (0.95 + Math.random() * 0.05);
      
      // Calculate position
      this.positions[particleIndex * 3] = pathPoint.x + Math.cos(angle) * radius;
      this.positions[particleIndex * 3 + 1] = pathPoint.y + Math.sin(angle) * radius;
      this.positions[particleIndex * 3 + 2] = pathPoint.z;
      
      // Set regular particle size
      this.sizes[particleIndex] = this.settings.size * (0.8 + Math.random() * 0.4);
      
      // Set regular color (fuschia)
      const color = new THREE.Color(this.settings.color);
      this.colors[particleIndex * 3] = color.r;
      this.colors[particleIndex * 3 + 1] = color.g;
      this.colors[particleIndex * 3 + 2] = color.b;
      
      // Add velocity
      this.velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      ));
      
      // Particle lifetime
      this.lifetimes.push(2 + Math.random() * 3);
      
      // Full opacity
      this.alphas[particleIndex] = 1.0;
      
      particleIndex++;
    }
    
    // Set attributes
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));
    
    // Create material with proper texture
    const vertexShader = `
      attribute float size;
      attribute vec3 color;
      attribute float alpha;
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        vColor = color;
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    const fragmentShader = `
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        vec4 texColor = texture2D(pointTexture, gl_PointCoord);
        gl_FragColor = vec4(vColor, vAlpha) * texColor;
      }
    `;
    
    // Create material with proper texture and blending
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: this.particleTexture }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.01
    });
    
    // Create particle system
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  computeCurl(x, y, z) {
    const eps = 0.0001;
    
    // Calculate curl based on noise field
    const n1 = this.simplex.simplex3(x + eps, y, z);
    const n2 = this.simplex.simplex3(x - eps, y, z);
    const a = (n1 - n2) / (2 * eps);
    
    const n3 = this.simplex.simplex3(x, y + eps, z);
    const n4 = this.simplex.simplex3(x, y - eps, z);
    const b = (n3 - n4) / (2 * eps);
    
    const n5 = this.simplex.simplex3(x, y, z + eps);
    const n6 = this.simplex.simplex3(x, y, z - eps);
    const c = (n5 - n6) / (2 * eps);
    
    // Return curl vector
    return new THREE.Vector3(a, b, c);
  }

  updateParticles(deltaTime) {
    const positions = this.geometry.attributes.position.array;
    const alphas = this.geometry.attributes.alpha.array;
    const sizes = this.geometry.attributes.size.array;
    
    // Check if we need to do a partial reset to maintain particles
    const now = Date.now();
    if ((now - this.lastPartialReset) / 1000 > this.settings.resetInterval) {
      this.partialResetParticles(0.05); // Reset 5% of particles instead of 10%
      this.lastPartialReset = now;
    }
    
    // Speed factor based on settings
    const speedFactor = this.settings.speed * deltaTime;
    
    // Optimization: precalculate time influence
    const timeInfluence = this.time * this.settings.curlNoiseTimeScale;
    
    // Update particles with better performance
    for (let i = 0; i < this.settings.particleCount; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      
      // Calculate curl noise for movement (optimized)
      const curlVec = this.computeCurl(
        x * this.settings.curlNoiseScale,
        y * this.settings.curlNoiseScale,
        z * this.settings.curlNoiseScale + timeInfluence
      );
      
      // Add curl noise to velocity with increased strength
      this.velocities[i].x += curlVec.x * speedFactor * this.settings.curlNoiseStrength;
      this.velocities[i].y += curlVec.y * speedFactor * this.settings.curlNoiseStrength;
      this.velocities[i].z += curlVec.z * speedFactor * this.settings.curlNoiseStrength;
      
      // Apply velocity
      positions[idx] += this.velocities[i].x * speedFactor;
      positions[idx + 1] += this.velocities[i].y * speedFactor;
      positions[idx + 2] += this.velocities[i].z * speedFactor;
      
      // Optimization: only check tunnel force periodically for some particles
      // This reduces computation while still maintaining the tunnel shape
      if (i % 3 === 0) {
        // Add tunnel force to keep particles near the tunnel walls
        const currentPos = new THREE.Vector3(x, y, z);
        
        // Find closest point on tunnel path
        let closestT = 0;
        let minDist = Infinity;
        
        // Optimization: check fewer points along the path
        for (let t = 0; t < 1; t += 0.1) {
          const pathPoint = this.tunnelPath.getPoint(t);
          const dist = currentPos.distanceTo(pathPoint);
          if (dist < minDist) {
            minDist = dist;
            closestT = t;
          }
        }
        
        // Get closest point on path
        const closestPoint = this.tunnelPath.getPoint(closestT);
        
        // Direction from path center to particle
        const dirFromCenter = new THREE.Vector3().subVectors(currentPos, closestPoint).normalize();
        
        // Target distance is the tunnel radius
        const targetDist = this.settings.tunnelRadius;
        const currentDist = currentPos.distanceTo(closestPoint);
        
        // Force towards tunnel wall
        const tunnelForce = this.settings.tunnelForceStrength;
        
        // Apply force to keep particles near tunnel wall
        const forceFactor = (targetDist - currentDist) * tunnelForce * speedFactor;
        
        positions[idx] += dirFromCenter.x * forceFactor;
        positions[idx + 1] += dirFromCenter.y * forceFactor;
        positions[idx + 2] += dirFromCenter.z * forceFactor;
      }
      
      // Apply damping to velocity for stability - use higher value for more movement
      this.velocities[i].multiplyScalar(this.settings.velocityDamping);
      
      // Add small random jitter to particles for more dynamic movement
      if (Math.random() < 0.1) { // Only apply to 10% of particles each frame
        this.velocities[i].x += (Math.random() - 0.5) * 0.2 * speedFactor;
        this.velocities[i].y += (Math.random() - 0.5) * 0.2 * speedFactor;
        this.velocities[i].z += (Math.random() - 0.5) * 0.2 * speedFactor;
      }
      
      // Reset alpha to prevent fading issue during loops
      alphas[i] = 1.0;
    }
    
    // Update geometry attributes
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
  }

  updateCamera() {
    // Calculate progress through the animation (0 to 1)
    const currentTime = Date.now();
    if (!this.startTime) this.startTime = currentTime;
    
    // Get the animation duration from settings
    const animDuration = this.settings.animationDuration;
    
    // Calculate progress based on the configured duration
    const elapsedTime = (currentTime - this.startTime) / 1000; // in seconds
    this.progress = Math.min(elapsedTime / animDuration, 1);
    
    // Log progress for debugging (remove in production)
    if (Math.floor(elapsedTime) % 5 === 0 && Math.floor(elapsedTime) !== this.lastLoggedTime) {
      console.log(`Animation progress: ${Math.floor(elapsedTime)}s / ${animDuration}s (${Math.floor(this.progress * 100)}%)`);
      this.lastLoggedTime = Math.floor(elapsedTime);
    }
    
    // Position camera along the path based on progress
    const pathPosition = this.tunnelPath.getPoint(this.progress);
    
    // Look ahead along the path
    const lookAheadDistance = 0.05;
    const lookAtPosition = this.tunnelPath.getPoint(
      Math.min(this.progress + lookAheadDistance, 1)
    );
    
    // Set camera position and rotation
    this.camera.position.copy(pathPosition);
    this.camera.lookAt(lookAtPosition);
    
    // Loop animation if completed
    if (this.progress >= 1) {
      // Reset animation state
      this.startTime = currentTime;
      this.progress = 0;
      this.lastLoggedTime = -1; // Reset logging counter
      console.log(`Animation loop completed. Restarting...`);
      
      // Reinitialize particles to prevent them from disappearing
      this.resetParticles();
    }
  }

  resetParticles() {
    const positions = this.geometry.attributes.position.array;
    const sizes = this.geometry.attributes.size.array;
    const colors = this.geometry.attributes.color.array;
    const tunnelRadius = this.settings.tunnelRadius;
    
    // Reset particles based on their type
    for (let i = 0; i < this.settings.particleCount; i++) {
      const idx = i * 3;
      
      // Check if this is an ulcer particle
      if (this.particleTypes[i] === 1) {
        // This is an ulcer particle - keep it in the same ulcer
        const ulcerIndex = this.ulcerAssignments[i];
        if (ulcerIndex >= 0 && ulcerIndex < this.ulcers.length) {
          const ulcer = this.ulcers[ulcerIndex];
          
          // Position within the ulcer - using a 2D disc plus inward depression
          const theta = Math.random() * Math.PI * 2;
          
          // Use compactness setting - get from class settings
          const r = ulcer.size * Math.pow(Math.random(), this.settings.ulcerCompactness) * this.settings.ulcerCompactness;
          
          // Use depth factor and edge softness settings - get from class settings
          const depthProfile = 1.0 - Math.pow(r/(ulcer.size * this.settings.ulcerCompactness), 1/this.settings.ulcerEdgeSoftness);
          const ulcerDepth = -ulcer.size * this.settings.ulcerDepthFactor * depthProfile;
          
          // Create a tangent basis for the ulcer surface
          const tangent1 = new THREE.Vector3(1, 0, 0);
          if (Math.abs(ulcer.normal.dot(tangent1)) > 0.9) {
            tangent1.set(0, 1, 0);
          }
          tangent1.crossVectors(tangent1, ulcer.normal).normalize();
          const tangent2 = new THREE.Vector3().crossVectors(ulcer.normal, tangent1).normalize();
          
          // Calculate position using the tangent basis plus depth along normal
          const pos = new THREE.Vector3().copy(ulcer.position);
          pos.addScaledVector(tangent1, Math.cos(theta) * r);
          pos.addScaledVector(tangent2, Math.sin(theta) * r);
          pos.addScaledVector(ulcer.normal, ulcerDepth);
          
          positions[idx] = pos.x;
          positions[idx + 1] = pos.y;
          positions[idx + 2] = pos.z;
          
          // Set ulcer particle size - make inner particles larger for depth effect
          const particleSizeFactor = 1.0 + Math.abs(ulcerDepth) / (ulcer.size * 0.2);
          sizes[i] = this.settings.size * this.settings.ulcerSizeMultiplier * 
            (0.8 + Math.random() * 0.3) * particleSizeFactor;
          
          // Set ulcer color - use the stored color with the ulcer
          const color = ulcer.color;
          colors[idx] = color.r;
          colors[idx + 1] = color.g;
          colors[idx + 2] = color.b;
          
          // Add slight inward bias to velocity for depression effect
          const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
          );
          vel.addScaledVector(ulcer.normal, -0.1);
          this.velocities[i].copy(vel);
        }
      } else {
        // This is a regular wall particle - reset to a random position on the tunnel wall
        const t = Math.random();
        const pathPoint = this.tunnelPath.getPoint(t);
        
        // Position around the tunnel circumference
        const angle = Math.random() * Math.PI * 2;
        const radius = tunnelRadius * (0.95 + Math.random() * 0.05);
        
        // Calculate new position
        positions[idx] = pathPoint.x + Math.cos(angle) * radius;
        positions[idx + 1] = pathPoint.y + Math.sin(angle) * radius;
        positions[idx + 2] = pathPoint.z;
      }
      
      // Reset velocity for all particles with more energy
      this.velocities[i].set(
        (Math.random() - 0.5) * 0.5, // Increased from 0.2
        (Math.random() - 0.5) * 0.5, // Increased from 0.2
        (Math.random() - 0.5) * 0.5  // Increased from 0.2
      );
      
      // Ensure full opacity
      this.alphas[i] = 1.0;
    }
    
    // Update the geometry attributes
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
  }

  onWindowResize() {
    const container = document.getElementById(this.settings.containerId);
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    // Request next frame
    requestAnimationFrame(this.animate.bind(this));
    
    // Calculate delta time
    const now = Date.now();
    const deltaTime = Math.min((now - this.lastFrame) / 1000, 0.1); // Cap at 0.1 seconds for stability
    this.lastFrame = now;
    this.time += deltaTime;
    
    // Update camera position
    this.updateCamera();
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    this.animate();
  }

  // Partially reset some particles to maintain tunnel visibility
  partialResetParticles(fraction) {
    const positions = this.geometry.attributes.position.array;
    const tunnelRadius = this.settings.tunnelRadius;
    const particleCount = this.settings.particleCount;
    
    // Calculate how many particles to reset
    const particlesToReset = Math.floor(particleCount * fraction);
    
    // Select random particles to reset
    for (let i = 0; i < particlesToReset; i++) {
      const particleIndex = Math.floor(Math.random() * particleCount);
      
      // Only reset regular particles, not ulcer particles
      if (this.particleTypes[particleIndex] === 0) {
        const idx = particleIndex * 3;
        
        // Get random position along tunnel path
        const t = Math.random();
        const pathPoint = this.tunnelPath.getPoint(t);
        
        // Position around the tunnel circumference
        const angle = Math.random() * Math.PI * 2;
        const radius = tunnelRadius * (0.95 + Math.random() * 0.05);
        
        // Calculate position
        positions[idx] = pathPoint.x + Math.cos(angle) * radius;
        positions[idx + 1] = pathPoint.y + Math.sin(angle) * radius;
        positions[idx + 2] = pathPoint.z;
        
        // Reset velocity with more energy
        this.velocities[particleIndex].set(
          (Math.random() - 0.5) * 0.5, // Increased from 0.2
          (Math.random() - 0.5) * 0.5, // Increased from 0.2
          (Math.random() - 0.5) * 0.5  // Increased from 0.2
        );
        
        // Ensure full opacity
        this.alphas[particleIndex] = 1.0;
      }
    }
    
    // Update geometry
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
  }

  // Helper method to get safe fog density
  getSafeFogDensity(density) {
    // Ensure fog density is within a reasonable range
    const safeDensity = Math.min(Math.max(density, 0.0001), 0.01);
    if (density !== safeDensity) {
      console.warn(`Fog density clamped from ${density} to ${safeDensity} for visibility`);
    }
    return safeDensity;
  }

  // Add a method to update fog settings
  updateFogSettings(density) {
    if (!this.scene) return;
    
    // Get safe density value
    const safeDensity = this.getSafeFogDensity(density);
    
    // Create fog if it doesn't exist
    if (!this.scene.fog) {
      this.scene.fog = new THREE.FogExp2(this.settings.backgroundColor, safeDensity);
    } else {
      // Update existing fog
      this.scene.fog.density = safeDensity;
    }
    
    console.log(`Fog density updated to: ${safeDensity}`);
    
    // Update stored setting
    this.settings.fogDensity = safeDensity;
  }

  // Add a method to toggle fog on/off
  toggleFog(enabled) {
    if (!this.scene) return;
    
    if (enabled) {
      // Enable fog if it was disabled
      if (!this.scene.fog) {
        const safeDensity = this.getSafeFogDensity(this.settings.fogDensity);
        this.scene.fog = new THREE.FogExp2(this.settings.backgroundColor, safeDensity);
        console.log(`Fog enabled with density: ${safeDensity}`);
      }
    } else {
      // Disable fog
      this.scene.fog = null;
      console.log('Fog disabled');
    }
    
    // Update stored setting
    this.settings.fogEnabled = !!enabled;
  }

  // Expose a public method to control fog
  setFogDensity(density) {
    this.updateFogSettings(density);
  }

  // Add a method to update ulcer appearance at runtime
  updateUlcerSettings(settings) {
    // Update ulcer settings
    if (settings.ulcerDepthFactor !== undefined) {
      this.settings.ulcerDepthFactor = settings.ulcerDepthFactor;
    }
    
    if (settings.ulcerCompactness !== undefined) {
      this.settings.ulcerCompactness = settings.ulcerCompactness;
    }
    
    if (settings.ulcerEdgeSoftness !== undefined) {
      this.settings.ulcerEdgeSoftness = settings.ulcerEdgeSoftness;
    }
    
    if (settings.ulcerSizeMultiplier !== undefined) {
      this.settings.ulcerSizeMultiplier = settings.ulcerSizeMultiplier;
    }
    
    if (settings.ulcerColor !== undefined) {
      this.settings.ulcerColor = settings.ulcerColor;
      
      // Update existing ulcers' colors
      for (let i = 0; i < this.ulcers.length; i++) {
        this.ulcers[i].color = new THREE.Color(settings.ulcerColor);
      }
      
      // Update particle colors
      const colors = this.geometry.attributes.color.array;
      for (let i = 0; i < this.settings.particleCount; i++) {
        if (this.particleTypes[i] === 1) {
          const idx = i * 3;
          const ulcerIndex = this.ulcerAssignments[i];
          if (ulcerIndex >= 0 && ulcerIndex < this.ulcers.length) {
            const color = this.ulcers[ulcerIndex].color;
            colors[idx] = color.r;
            colors[idx + 1] = color.g;
            colors[idx + 2] = color.b;
          }
        }
      }
      this.geometry.attributes.color.needsUpdate = true;
    }
    
    console.log('Updated ulcer settings:', settings);
  }
}

// Function to initialize and start the animation
function initStomachTunnelAnimation(options = {}) {
  // Check if Three.js is already loaded
  if (typeof THREE !== 'undefined') {
    // Create and start the animation since Three.js is already loaded
    const animation = new StomachTunnelAnimation(options);
    animation.init();
    animation.start();
    
    // Return the animation instance for external control
    return animation;
  } else {
    // Load Three.js script dynamically if not already loaded
    function loadScript(url, callback) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      script.onload = callback;
      document.head.appendChild(script);
    }
    
    // Start loading Three.js
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', () => {
      // Create and start the animation once Three.js is loaded
      const animation = new StomachTunnelAnimation(options);
      animation.init();
      animation.start();
      
      // Expose the animation instance globally for external control
      window.stomachAnimation = animation;
      console.log('Animation initialized and exposed as window.stomachAnimation');
      console.log('You can control fog with: window.stomachAnimation.setFogDensity(0.003)');
    });
  }
}

// Create HTML structure for local testing
function createTestPage() {
  // Create container
  const container = document.createElement('div');
  container.id = 'animation-container';
  container.style.width = '100%';
  container.style.height = '100vh';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);
  
  // Add some styles
  const style = document.createElement('style');
  style.textContent = `
    body { 
      margin: 0; 
      padding: 0; 
      background: #000; 
      overflow: hidden;
    }
    
    #animation-container {
      width: 100%;
      height: 100vh;
    }
    
    /* Add control panel for fog */
    #control-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0,0,0,0.5);
      padding: 10px;
      border-radius: 5px;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 1000;
    }
  `;
  document.head.appendChild(style);
  
  // Add control panel
  const controlPanel = document.createElement('div');
  controlPanel.id = 'control-panel';
  controlPanel.innerHTML = `
    <div style="margin-bottom: 10px;">
      <label for="fog-density">Fog Density: </label>
      <input type="range" id="fog-density" min="0" max="0.01" step="0.0001" value="0.002" />
      <span id="fog-value">0.002</span>
    </div>
    <div style="margin-bottom: 10px;">
      <label for="fog-toggle">Fog: </label>
      <input type="checkbox" id="fog-toggle" checked />
    </div>
    <div style="margin-bottom: 10px;">
      <label for="ulcer-depth">Ulcer Depth: </label>
      <input type="range" id="ulcer-depth" min="0.1" max="1.0" step="0.05" value="0.4" />
      <span id="depth-value">0.4</span>
    </div>
    <div style="margin-bottom: 10px;">
      <label for="ulcer-compact">Ulcer Compactness: </label>
      <input type="range" id="ulcer-compact" min="0.2" max="1.0" step="0.05" value="0.6" />
      <span id="compact-value">0.6</span>
    </div>
    <div style="margin-bottom: 10px;">
      <label for="ulcer-edge">Edge Softness: </label>
      <input type="range" id="ulcer-edge" min="0.1" max="1.0" step="0.05" value="0.3" />
      <span id="edge-value">0.3</span>
    </div>
  `;
  document.body.appendChild(controlPanel);
  
  // Initialize animation
  const animation = initStomachTunnelAnimation({
    containerId: 'animation-container',
    animationDuration: 20 // 20 seconds for full animation
  });
  
  // Set up control panel functionality once animation is ready
  setTimeout(() => {
    const fogSlider = document.getElementById('fog-density');
    const fogValue = document.getElementById('fog-value');
    const fogToggle = document.getElementById('fog-toggle');
    
    // Ulcer controls
    const ulcerDepthSlider = document.getElementById('ulcer-depth');
    const depthValue = document.getElementById('depth-value');
    const ulcerCompactSlider = document.getElementById('ulcer-compact');
    const compactValue = document.getElementById('compact-value');
    const ulcerEdgeSlider = document.getElementById('ulcer-edge');
    const edgeValue = document.getElementById('edge-value');
    
    if (fogSlider && window.stomachAnimation) {
      fogSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        window.stomachAnimation.setFogDensity(value);
        fogValue.textContent = value.toFixed(4);
      });
    }
    
    if (fogToggle && window.stomachAnimation) {
      fogToggle.addEventListener('change', (e) => {
        window.stomachAnimation.toggleFog(e.target.checked);
      });
    }
    
    // Set up ulcer control events
    if (ulcerDepthSlider && window.stomachAnimation) {
      ulcerDepthSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        window.stomachAnimation.updateUlcerSettings({ ulcerDepthFactor: value });
        depthValue.textContent = value.toFixed(2);
      });
    }
    
    if (ulcerCompactSlider && window.stomachAnimation) {
      ulcerCompactSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        window.stomachAnimation.updateUlcerSettings({ ulcerCompactness: value });
        compactValue.textContent = value.toFixed(2);
      });
    }
    
    if (ulcerEdgeSlider && window.stomachAnimation) {
      ulcerEdgeSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        window.stomachAnimation.updateUlcerSettings({ ulcerEdgeSoftness: value });
        edgeValue.textContent = value.toFixed(2);
      });
    }
  }, 2000); // Wait for animation to be ready
}

// Initialize the test page if this file is run directly
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createTestPage);
} else {
  createTestPage();
}

/**
 * HOW TO CONTROL FOG:
 * 
 * If you're using this in Webflow or another environment, you can control fog with:
 * 
 * 1. To change fog density:
 *    stomachAnimation.setFogDensity(0.003); // Values between 0.0001 and 0.01
 * 
 * 2. To toggle fog on/off:
 *    stomachAnimation.toggleFog(false); // Turn off fog
 *    stomachAnimation.toggleFog(true);  // Turn on fog
 * 
 * The animation instance is exposed as 'window.stomachAnimation' when loaded.
 */ 