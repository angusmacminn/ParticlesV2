// Add debugging at the start of the file

// Add easing functions at the top of the file
// These will make the camera movement smoother
function easeLinear(t) {
  return t;
}

function easeInQuad(t) {
  return t * t;
}

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeInCubic(t) {
  return t * t * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Simplex Noise implementation
 * Based on the algorithm by Ken Perlin
 */
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
    
    // To remove the need for index wrapping, double the permutation table length
    this.perm = [];
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }
  
  /**
   * Dot product helper function
   */
  dot(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }
  
  /**
   * 3D simplex noise function
   */
  simplex3(xin, yin, zin) {
    let n0, n1, n2, n3; // Noise contributions from the four corners
    
    // Skew the input space to determine which simplex cell we're in
    const F3 = 1.0 / 3.0;
    const s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const G3 = 1.0 / 6.0; // Very nice and simple unskew factor, too
    const t = (i + j + k) * G3;
    const X0 = i - t; // Unskew the cell origin back to (x,y,z) space
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0; // The x,y,z distances from the cell origin
    const y0 = yin - Y0;
    const z0 = zin - Z0;
    
    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    let i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    let i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
    
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } // X Y Z order
      else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } // X Z Y order
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } // Z X Y order
    } else { // x0<y0
      if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } // Z Y X order
      else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } // Y Z X order
      else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } // Y X Z order
    }
    
    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    const x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;
    
    // Work out the hashed gradient indices of the four simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
    const gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
    const gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;
    
    // Calculate the contribution from the four corners
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
    
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to stay just inside [-1,1]
    return 32.0 * (n0 + n1 + n2 + n3);
  }
  
  /**
   * Seed the noise function
   */
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


// ============================================================================
// CurlNoiseParticleSystem.js
// ============================================================================

// Note: References to THREE, OrbitControls, Stats, GUI, SimplexNoise
// will now use the global versions loaded via CDN or defined above.

class CurlNoiseParticleSystem {
  constructor(options = {}) {
    // Default settings
    this.settings = {
      particleCount: options.particleCount || 20000, // Increased from 15000
      width: options.width || 2000,
      height: options.height || 2000,
      depth: options.depth || 8000, // Make tunnel longer
      speed: options.speed || 1.5, // Reduced from 2 for more gentle movement
      step: options.step || 1500,
      size: options.size || 25, // Increased from smaller default
      color: options.color || 0xEA368E, // Fuschia default color
      rotate: options.rotate !== undefined ? options.rotate : false, // Disabled by default
      oldMethod: options.oldMethod !== undefined ? options.oldMethod : false,
      // Tunnel specific settings
      tunnelRadius: options.tunnelRadius || 400,  // Default tunnel radius
      tunnelForceStrength: options.tunnelForceStrength || 0.1, // Strength of force keeping particles in tunnel
      flowSpeed: options.flowSpeed || 1.2, // Reduced from 1.5 for gentler flow
      spiralFactor: options.spiralFactor || 0.12, // Reduced spiral motion for subtlety
      // Scroll settings
      scrollSpeed: options.scrollSpeed || 1.0, // How fast to move through tunnel when scrolling
      scrollSmoothing: options.scrollSmoothing || 0.08, // Increased smoothing
      // Color settings
      backgroundColor: options.backgroundColor || 0x000000, // Black background color
      ambientLightColor: options.ambientLightColor || 0xEA368E, // Fuschia ambient light
      pointLightColor: options.pointLightColor || 0xffffff, // White endoscope light
      pointLightIntensity: options.pointLightIntensity || 2.5, // Reduced from 3.0 for less intensity
      // Visibility settings
      fogDistance: options.fogDistance || 500, // Reduced from 1500 - particles appear closer
      fogDensity: options.fogDensity || 0.001, // How quickly particles fade in with distance
      // Ulcer settings
      enableUlcers: options.enableUlcers !== undefined ? options.enableUlcers : true,
      ulcerCount: options.ulcerCount || 15, // Number of ulcers
      ulcerSize: options.ulcerSize || 200, // Size of ulcers
      ulcerColor: options.ulcerColor || 0x99ff66, // Bright green color for ulcers
      ulcerIntensity: options.ulcerIntensity || 1.5, // Brightness multiplier for ulcers
      ulcerSizeMultiplier: options.ulcerSizeMultiplier || 3.0, // Increased from 2.0
      // Camera movement settings
      cameraAnimationDuration: options.cameraAnimationDuration || 20.0,  // Increased from 15.0 for slower movement
      cameraStopPosition: options.cameraStopPosition !== undefined ? options.cameraStopPosition : 0.92, // Where to stop (0-1)
      cameraEasingType: options.cameraEasingType || 'easeInOutCubic', // Type of easing to use
      cameraShakeAmount: options.cameraShakeAmount !== undefined ? options.cameraShakeAmount : 0.2, // Reduced from 0.3 for subtler shake
      cameraShakeSpeed: options.cameraShakeSpeed !== undefined ? options.cameraShakeSpeed : 1.5, // Reduced from 2.0 for gentler shake
      cameraLookAheadDistance: options.cameraLookAheadDistance !== undefined ? options.cameraLookAheadDistance : 0.02, // Look ahead distance
      cameraSmoothingFactor: options.cameraSmoothingFactor !== undefined ? options.cameraSmoothingFactor : 8.0, // Position smoothing
      cameraRollAmount: options.cameraRollAmount !== undefined ? options.cameraRollAmount : 0.003, // Reduced from 0.005 for subtler roll
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

    // Add this after the class properties in the CurlNoiseParticleSystem constructor (around line 150)
    this.mouseX = 0;
    this.targetMouseX = 0;
    this.parallaxAmount = 0.05; // How much the camera moves based on mouse position
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
    
    // Remove scissor test - render to full canvas

    // Setup scene
    this.scene = new THREE.Scene();

    // Setup camera for tunnel view
    const ratio = window.innerWidth / window.innerHeight;
    const tunnelRadius = this.settings.tunnelRadius;
    const tunnelLength = this.settings.depth;
    const FOV = 70; // Increased from 60 to match setRightSidePosition method
    
    this.camera = new THREE.PerspectiveCamera(FOV, ratio, 1, 20000);
    
    // Position camera at beginning of tunnel - get offset from createTunnelPath
    const HERO_OFFSET_X = window.innerWidth * 1.2; // Increased from 0.6 to 1.2
    this.camera.position.set(HERO_OFFSET_X, 0, -tunnelLength/2 - tunnelRadius * 2);
    this.camera.lookAt(HERO_OFFSET_X, 0, 0);
    this.scene.add(this.camera);

    // Setup controls - check if OrbitControls exists on THREE global
    if (typeof THREE !== 'undefined' && THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.maxDistance = this.settings.depth;
        this.controls.minDistance = tunnelRadius;
        this.controls.autoRotate = false; // Disabled for scroll navigation
        this.controls.enabled = false; // Disable controls for scroll-based navigation
        this.controls.autoRotateSpeed = 0.5;
        this.controls.target = new THREE.Vector3(0, 0, 0);
    } else {
        console.warn('THREE.OrbitControls not loaded. Controls disabled.');
        this.controls = null;
    }

    // Setup stats - check if Stats exists globally
    /* Commenting out stats for Webflow
    if (typeof Stats !== 'undefined') {
        this.stats = new Stats();
        this.stats.showPanel(0);
        this.stats.domElement.style.position = 'fixed';
        this.stats.domElement.style.bottom = '10px';
        this.stats.domElement.style.left = '10px';
        this.stats.domElement.style.zIndex = '1000';
        document.body.appendChild(this.stats.domElement);
    } else {
        console.warn('Stats.js not loaded. Performance monitor disabled.');
        this.stats = null;
    }
    */
    this.stats = null; // Disable stats for Webflow

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
    
    // Setup GUI controls - commented out for Webflow
    /* 
    if (typeof dat !== 'undefined' && dat.GUI) {
        this.setupGUI();
    } else {
        console.warn('dat.GUI not loaded. GUI controls disabled.');
        this.gui = null;
    }
    */
    this.gui = null; // Disable GUI for Webflow

    // Then in the init method, after the window resize listener (around line 320)
    // Add mouse movement tracking for parallax effect
    window.addEventListener('mousemove', (event) => {
      // Get mouse position as -1 to 1 value from center of screen
      this.targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    }, false);
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
    loader.crossOrigin = 'anonymous'; // Important for CORS
    
    const texture = loader.load(
        'https://al-ro.github.io/images/embers/ember_texture.png',
        // Success callback
        (texture) => {
            this.rebuildParticleSystems(texture);
        },
        // Progress callback
        (xhr) => {
            
        },
        // Error callback
        (error) => {
            
            const fallbackTexture = this.createFallbackTexture();
            this.rebuildParticleSystems(fallbackTexture);
        }
    );
    
    // Also try with a fallback texture as backup
    this.rebuildParticleSystems(this.createFallbackTexture());
  }

  createFallbackTexture() {
    // Create a simple circular gradient as a fallback
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Create radial gradient for particle
    const gradient = ctx.createRadialGradient(
        size/2, size/2, 0,
        size/2, size/2, size/2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
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
      let r, g, b;
      if (this.geometry && this.geometry.getAttribute('color')) {
        const colorAttribute = this.geometry.getAttribute('color');
        r = colorAttribute.array[index];
        g = colorAttribute.array[index+1];
        b = colorAttribute.array[index+2];
      } else {
        // Default color if no attribute
        const color = new THREE.Color(this.settings.color);
        r = color.r;
        g = color.g;
        b = color.b;
      }
      
      // MODIFIED: Increase color brightness to make particles more visible
      const brightnessMultiplier = 1.5; // Increased from 1.0
      group.colors.push(r * brightnessMultiplier, g * brightnessMultiplier, b * brightnessMultiplier);
      
      // Store mapping from original index to group index
      group.indices.push(i);
    }
    
    // Create particle systems for each group
    this.particleSystems = [];
    this.points = null; // Clear the main points reference
    
    // Always create the fallback texture if needed
    if (!texture) {
      texture = this.createFallbackTexture();
    }
    
    // Process each size group
    for (const [groupName, group] of Object.entries(sizeGroups)) {
      // Skip empty groups
      if (group.positions.length === 0) continue;
      
      // Create geometry for this group
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(group.positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(group.colors, 3));
      
      // Create material for this group with more subtle settings
      const material = new THREE.PointsMaterial({
        size: group.size,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        map: texture,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 1.0
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

    // MODIFIED: Add stronger ambient lighting
    if (!this.ambientLight) {
      this.ambientLight = new THREE.AmbientLight(this.settings.ambientLightColor, 1.5); // Increased intensity
      this.scene.add(this.ambientLight);
    }

    // MODIFIED: Add stronger point light at camera
    if (!this.endoscopeLight) {
      this.endoscopeLight = new THREE.PointLight(
        this.settings.pointLightColor, 
        this.settings.pointLightIntensity, 
        200 // Increased range from 50
      );
      this.camera.add(this.endoscopeLight);
      this.endoscopeLight.position.set(0, 0, -10); // Moved further in front of camera
      this.scene.add(this.camera);
    }
  }

  setupGUI() {
    // Create GUI instance if it wasn't created in init
    if (!dat || !dat.GUI || !this.gui) {
      if (typeof dat !== 'undefined' && dat.GUI) {
        this.gui = new dat.GUI({ autoPlace: false });
      } else {
        console.warn('dat.GUI not available for setupGUI.');
        return;
      }
    }

    // Clear existing GUI elements if resetting
    if (this.gui && this.gui.__folders) {
      Object.keys(this.gui.__folders).forEach(folderName => {
        this.gui.removeFolder(this.gui.__folders[folderName]);
      });
      // Remove top-level controllers
      const controllers = [...this.gui.__controllers];
      controllers.forEach(controller => this.gui.remove(controller));
    }

    // Create folders for organization
    const flowFolder = this.gui.addFolder('Flow Settings');
    const tunnelFolder = this.gui.addFolder('Tunnel Shape');
    const visualFolder = this.gui.addFolder('Visual Settings');
    const colorFolder = this.gui.addFolder('Color Settings');
    const ulcerFolder = this.gui.addFolder('Ulcer Settings');
    const fogFolder = this.gui.addFolder('Fog Settings');
    const miscFolder = this.gui.addFolder('Misc Settings');
    const cameraFolder = this.gui.addFolder('Camera Animation');

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
    // fogDensity is now used internally in updateParticleVisibility

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

    // Camera animation controls
    cameraFolder.add(this.settings, 'cameraAnimationDuration', 5, 30, 1).name('Duration (sec)');
    cameraFolder.add(this.settings, 'cameraStopPosition', 0.5, 0.99, 0.01).name('Stop Position');
    
    // Easing type dropdown
    const easingOptions = {
      'Linear': 'linear',
      'Ease In Quad': 'easeInQuad',
      'Ease Out Quad': 'easeOutQuad',
      'Ease In-Out Quad': 'easeInOutQuad',
      'Ease In Cubic': 'easeInCubic',
      'Ease Out Cubic': 'easeOutCubic',
      'Ease In-Out Cubic': 'easeInOutCubic'
    };
    
    cameraFolder.add(this.settings, 'cameraEasingType', easingOptions).name('Easing Type');
    
    // Camera movement effects
    cameraFolder.add(this.settings, 'cameraShakeAmount', 0, 1, 0.05).name('Shake Intensity');
    cameraFolder.add(this.settings, 'cameraShakeSpeed', 0, 5, 0.1).name('Shake Speed');
    cameraFolder.add(this.settings, 'cameraLookAheadDistance', 0, 0.1, 0.005).name('Look Ahead');
    cameraFolder.add(this.settings, 'cameraSmoothingFactor', 1, 20, 0.5).name('Smoothing');
    cameraFolder.add(this.settings, 'cameraRollAmount', 0, 0.02, 0.001).name('Roll Amount');

    // Add a restart button specifically for the camera animation
    const cameraControls = {
      restart: () => {
        
        this.linearProgress = 0;
        this.scrollProgress = 0;
        if (this.previousCameraPosition) {
          // Reset previous camera position to avoid jumps
          const startProgress = 0;
          const startPoint = this.tunnelPath.getPointAt(startProgress);
          this.previousCameraPosition.set(startPoint.x, startPoint.y, startPoint.z);
        }
      }
    };
    cameraFolder.add(cameraControls, 'restart').name('Restart Animation');

    // Add reset button
    const resetButton = {
      reset: () => {
        this.resetParticles();
      }
    };
    miscFolder.add(resetButton, 'reset').name('Reset Particles');
    miscFolder.add(this.settings, 'oldMethod').name('Alt Curl Method');

    // Open folders by default
    flowFolder.open();
    visualFolder.open();
    colorFolder.open();
    ulcerFolder.open();
    fogFolder.open();
    cameraFolder.open();

    // Add GUI to container
    let guiContainer = document.getElementById('gui_container');
    if (!guiContainer) {
      console.warn('#gui_container not found. Appending GUI to body.');
      guiContainer = document.createElement('div');
      Object.assign(guiContainer.style, {
        position: 'fixed', top: '10px', right: '10px', zIndex: '1000'
      });
      document.body.appendChild(guiContainer);
    }
    // Ensure container is empty before appending
    while (guiContainer.firstChild) {
      guiContainer.removeChild(guiContainer.firstChild);
    }
    guiContainer.appendChild(this.gui.domElement);
  }

  setSize() {
    if (!this.particleSystems) return;
    for (const system of this.particleSystems) {
      if (system.name === 'normal') {
        system.material.size = this.settings.size;
      } else if (system.name === 'ulcer') {
        // Ensure multiplier is applied correctly when base size changes
        system.material.size = this.settings.size * this.settings.ulcerSizeMultiplier; 
      }
      if (system.material) system.material.needsUpdate = true;
    }
  }

  setColor() {
    // Base color change requires recalculating all particle colors
    this.rebuildParticleSystems();
  }
  
  setBackgroundColor() {
    if (this.renderer) {
        this.renderer.setClearColor(this.settings.backgroundColor);
    }
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
    // Avoid division by zero
    if (length === 0) return [0, 0, 0]; 
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
    
    return this.normalize(curl); // Ensure curl is normalized
  }

  move(dT) {
    if (!this.tunnelPath) return; // Don't move if path not generated yet

    const tunnelRadius = this.settings.tunnelRadius;
    const tunnelLength = this.settings.depth;
    const tunnelForceStrength = this.settings.tunnelForceStrength;
    const flowSpeed = this.settings.flowSpeed;
    const spiralFactor = this.settings.spiralFactor;
    const frameRateFactor = dT * 60; // For frame-rate independence (assuming target 60fps)

    for (let i = 0; i < this.settings.particleCount * 3; i += 3) {
      const particleIndex = Math.floor(i / 3);

      const curl = this.computeCurl(
        this.particles[i] / this.settings.step,
        this.particles[i+1] / this.settings.step,
        this.particles[i+2] / this.settings.step
      );
      if (isNaN(curl[0]) || isNaN(curl[1]) || isNaN(curl[2])) {
        curl[0] = 0; curl[1] = 0; curl[2] = 1;
      }

      const particlePos = new THREE.Vector3(this.particles[i], this.particles[i+1], this.particles[i+2]);

      const zProgress = (particlePos.z + tunnelLength/2) / tunnelLength;
      const clampedProgress = Math.max(0.001, Math.min(0.999, zProgress)); // Avoid exact ends for tangent calc

      const pathPoint = this.tunnelPath.getPointAt(clampedProgress);
      const tangent = this.tunnelPath.getTangentAt(clampedProgress); // Direction of the path

      const toCenter = new THREE.Vector3().subVectors(pathPoint, particlePos);
      const radialDist = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y); // Approx dist in XY plane relative to path

      let tunnelForceX = 0;
      let tunnelForceY = 0;

      if (radialDist > 0) {
        const normToCenterX = toCenter.x / radialDist;
        const normToCenterY = toCenter.y / radialDist;
        let forceMagnitude = 0;
        if (radialDist > tunnelRadius) {
          forceMagnitude = (radialDist - tunnelRadius) * tunnelForceStrength;
        } else if (radialDist < tunnelRadius * 0.8) {
           forceMagnitude = -(tunnelRadius * 0.8 - radialDist) * tunnelForceStrength * 0.5;
        }
        tunnelForceX = normToCenterX * forceMagnitude;
        tunnelForceY = normToCenterY * forceMagnitude;

        if (spiralFactor > 0) {
          const tangentX = -normToCenterY;
          const tangentY = normToCenterX;
          tunnelForceX += tangentX * spiralFactor;
          tunnelForceY += tangentY * spiralFactor;
        }
      }

      const flowForce = tangent.multiplyScalar(flowSpeed * 5);
      const curlInfluence = 0.5;

      this.velocities[i]   = this.settings.speed * curl[0] * curlInfluence + tunnelForceX + flowForce.x;
      this.velocities[i+1] = this.settings.speed * curl[1] * curlInfluence + tunnelForceY + flowForce.y;
      this.velocities[i+2] = this.settings.speed * curl[2] * curlInfluence              + flowForce.z;

      this.particles[i]   += this.velocities[i]   * frameRateFactor;
      this.particles[i+1] += this.velocities[i+1] * frameRateFactor;
      this.particles[i+2] += this.velocities[i+2] * frameRateFactor;

      this.times[particleIndex] += dT;

      // --- Respawn Logic ---
      const currentPos = new THREE.Vector3(this.particles[i], this.particles[i+1], this.particles[i+2]);
      const currentPathPoint = this.tunnelPath.getPointAt(clampedProgress);
      const distFromPath = currentPos.distanceTo(currentPathPoint);

      if (distFromPath > tunnelRadius * 2 ||
          this.particles[i+2] < -tunnelLength / 2 - tunnelRadius * 2 ||
          this.particles[i+2] > tunnelLength / 2 + tunnelRadius * 2 ||
          this.times[particleIndex] > this.lifetimes[particleIndex])
      {
        const respawnProgress = Math.random() * 0.8 + 0.1;
        const newPathPoint = this.tunnelPath.getPointAt(respawnProgress);
        const newTangent = this.tunnelPath.getTangentAt(respawnProgress).normalize();
        const up = Math.abs(newTangent.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(newTangent, up).normalize();
        const upDir = new THREE.Vector3().crossVectors(right, newTangent).normalize();
        const newTheta = Math.random() * Math.PI * 2;
        const newRadius = tunnelRadius * (0.7 + Math.random() * 0.3);
        const newX = newPathPoint.x + (right.x * newRadius * Math.cos(newTheta) + upDir.x * newRadius * Math.sin(newTheta));
        const newY = newPathPoint.y + (right.y * newRadius * Math.cos(newTheta) + upDir.y * newRadius * Math.sin(newTheta));
        const newZ = newPathPoint.z + (right.z * newRadius * Math.cos(newTheta) + upDir.z * newRadius * Math.sin(newTheta));

        this.particles[i]   = newX;
        this.particles[i+1] = newY;
        this.particles[i+2] = newZ;
        this.positions[i]   = newX;
        this.positions[i+1] = newY;
        this.positions[i+2] = newZ;
        this.velocities[i] = 0;
        this.velocities[i+1] = 0;
        this.velocities[i+2] = flowSpeed * 2;
        this.times[particleIndex] = 0.0;
        this.lifetimes[particleIndex] = 2.0 + Math.random() * 2.0;
        this.alphas[particleIndex] = 0;
      }
    }
  }


  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    
    // Remove scissor test update - render to full canvas
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
    if (this.stats) this.stats.begin();

    const thisFrame = Date.now();
    const dT = Math.min((thisFrame - this.lastFrame) / 1000, 1 / 30); // Clamp delta time
    this.time += dT;
    this.lastFrame = thisFrame;

    this.updateCameraFromScroll(dT);
    this.move(dT);
    this.updateParticleVisibility();

    if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
    }

    if (this.stats) this.stats.end();

    requestAnimationFrame(this.animate.bind(this));
  }
  
  start() {
    this.lastFrame = Date.now();
    this.animate();
  }

  // Reset particles to new positions based on current settings
  resetParticles() {
    if (!this.tunnelPath) {
        console.warn("Tunnel path not available for particle reset.");
        return;
    }
    this.simplex.seed(Math.random());
    this.tunnelPath = this.createTunnelPath();
    this.pathPoints = this.tunnelPath.getPoints(1000);
    this.generateUlcers();

    const tunnelRadius = this.settings.tunnelRadius;
    for (let i = 0; i < this.settings.particleCount; i++) {
      const particleIndex = i * 3;
      const pathPos = Math.random();
      const pathPoint = this.tunnelPath.getPointAt(pathPos);
      const theta = Math.random() * Math.PI * 2;
      const radiusVariation = Math.pow(Math.random(), 0.5);
      const radius = tunnelRadius * (0.7 + radiusVariation * 0.3);
      const tangent = this.tunnelPath.getTangentAt(pathPos).normalize();
      const up = Math.abs(tangent.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const upDir = new THREE.Vector3().crossVectors(right, tangent).normalize();
      const x = pathPoint.x + (right.x * radius * Math.cos(theta) + upDir.x * radius * Math.sin(theta));
      const y = pathPoint.y + (right.y * radius * Math.cos(theta) + upDir.y * radius * Math.sin(theta));
      const z = pathPoint.z + (right.z * radius * Math.cos(theta) + upDir.z * radius * Math.sin(theta));

      this.particles[particleIndex] = x;
      this.particles[particleIndex+1] = y;
      this.particles[particleIndex+2] = z;
      this.positions[particleIndex] = x;
      this.positions[particleIndex+1] = y;
      this.positions[particleIndex+2] = z;
      const vx = (pathPoint.x - x) * 0.01 + (Math.random() - 0.5) * 0.4;
      const vy = (pathPoint.y - y) * 0.01 + (Math.random() - 0.5) * 0.4;
      const vz = (pathPoint.z - z) * 0.01 + (Math.random() - 0.5) * 0.4;
      this.velocities[particleIndex] = vx;
      this.velocities[particleIndex+1] = vy;
      this.velocities[particleIndex+2] = vz;
      this.times[i] = 0;
      this.lifetimes[i] = 2.0 + Math.random() * 2.0;
      this.alphas[i] = 0;

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
      this.sizes[i] = isUlcerParticle ? this.settings.size * this.settings.ulcerSizeMultiplier : this.settings.size;
    }
    this.rebuildParticleSystems();
  }

  // Modify the updateCameraFromScroll method to use the new settings
  updateCameraFromScroll(dT) {
    if (!this.tunnelPath || !this.camera) return;

    // Get camera movement settings from this.settings
    const totalAnimationTime = this.settings.cameraAnimationDuration;
    const maxProgress = this.settings.cameraStopPosition;
    const shakeAmount = this.settings.cameraShakeAmount;
    const shakeSpeed = this.settings.cameraShakeSpeed;
    const baseLookAheadAmount = this.settings.cameraLookAheadDistance;
    const smoothingFactor = this.settings.cameraSmoothingFactor;
    const rollAmount = this.settings.cameraRollAmount;
    const tunnelRadius = this.settings.tunnelRadius;
    
    // Increment linear progress based on time
    this.linearProgress = this.linearProgress || 0;
    this.linearProgress += dT / totalAnimationTime;
    
    // Clamp to 0-maxProgress range
    this.linearProgress = Math.max(0, Math.min(maxProgress, this.linearProgress));
    
    // Apply easing to the progress for smoother camera movement
    const normalizedProgress = this.linearProgress / maxProgress;
    
    // Apply selected easing function
    let easedNormalizedProgress;
    
    switch(this.settings.cameraEasingType) {
      case 'linear':
        easedNormalizedProgress = easeLinear(normalizedProgress);
        break;
      case 'easeInQuad':
        easedNormalizedProgress = easeInQuad(normalizedProgress);
        break;
      case 'easeOutQuad':
        easedNormalizedProgress = easeOutQuad(normalizedProgress);
        break;
      case 'easeInOutQuad':
        easedNormalizedProgress = easeInOutQuad(normalizedProgress);
        break;
      case 'easeInCubic':
        easedNormalizedProgress = easeInCubic(normalizedProgress);
        break;
      case 'easeOutCubic':
        easedNormalizedProgress = easeOutCubic(normalizedProgress);
        break;
      case 'easeInOutCubic':
      default:
        easedNormalizedProgress = easeInOutCubic(normalizedProgress);
        break;
    }
    
    // Remap back to [0, maxProgress]
    this.scrollProgress = easedNormalizedProgress * maxProgress;
    
    // Get position on the curved path
    const pathPosition = this.tunnelPath.getPointAt(this.scrollProgress);

    // Calculate look-ahead point - safely manage the end of the tunnel
    const lookAheadAmount = Math.min(baseLookAheadAmount, 1.0 - this.scrollProgress - 0.01);
    const lookAtProgress = Math.min(this.scrollProgress + lookAheadAmount, 0.99);
    const lookAtPosition = this.tunnelPath.getPointAt(lookAtProgress);

    // Add camera shake - using eased time for smoother oscillations
    const oscillationTime = this.time * (0.5 + easedNormalizedProgress * 0.5);
    const oscillationX = Math.sin(oscillationTime * shakeSpeed * 1.1) * shakeAmount;
    const oscillationY = Math.cos(oscillationTime * shakeSpeed * 0.9) * shakeAmount;

    // Create target position
    const targetPosition = new THREE.Vector3(
      pathPosition.x + oscillationX,
      pathPosition.y + oscillationY,
      pathPosition.z
    );
    
    // Apply mouse-based parallax effect - ADD THIS HERE
    // Smoothly approach the target mouse x value
    this.mouseX = this.mouseX || 0;
    this.targetMouseX = this.targetMouseX || 0;
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    
    // Apply parallax offset to x position based on mouseX
    const parallaxOffset = this.mouseX * this.parallaxAmount * tunnelRadius;
    targetPosition.x += parallaxOffset;

    // Smoothly interpolate camera position for extra stability
    if (!this.previousCameraPosition) {
      this.previousCameraPosition = targetPosition.clone();
    } else {
      // Interpolate between previous and target position (extra smoothing)
      const positionLerpFactor = Math.min(1.0, dT * smoothingFactor);
      this.previousCameraPosition.lerp(targetPosition, positionLerpFactor);
      
      // Apply the smoothed position
      this.camera.position.copy(this.previousCameraPosition);
    }
    
    // Look toward the look-ahead point
    this.camera.lookAt(lookAtPosition);

    // Slight roll for more realism, with smoother oscillation
    this.camera.rotation.z = Math.sin(oscillationTime * 0.3) * rollAmount;

    return this.scrollProgress;
  }


  createTunnelPath() {
    // Use a much larger multiplier to push tunnel far to the right side
    const HERO_OFFSET_X = window.innerWidth * 1.2; // Increased from 0.6 to 1.2
    return this.createTunnelPathWithOffset(HERO_OFFSET_X);
  }

  createTunnelPathWithOffset(offsetX) {
    const curvePoints = [];
    const segments = 30;
    const tunnelLength = this.settings.depth;
    const baseRadius = this.settings.tunnelRadius;

    const primaryAmplitude = baseRadius * 1.5;
    const primaryFreq = 1.5;
    const secondaryAmplitude = baseRadius * 0.5;
    const secondaryFreq = 5.0;
    const verticalAmplitude = baseRadius * 0.8;
    const verticalFreq = 1.2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const z = -tunnelLength/2 + tunnelLength * t;
      const xOffset = primaryAmplitude * Math.sin(t * Math.PI * primaryFreq) * Math.cos(t * Math.PI * 0.3) +
                      secondaryAmplitude * Math.sin(t * Math.PI * secondaryFreq);
      const yOffset = verticalAmplitude * Math.cos(t * Math.PI * verticalFreq) +
                      secondaryAmplitude * 0.5 * Math.cos(t * Math.PI * secondaryFreq * 1.5);
      // Apply the specified horizontal offset to all tunnel points
      curvePoints.push(new THREE.Vector3(xOffset + offsetX, yOffset, z));
    }
    return new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5);
  }

  updateParticleVisibility() {
    if (!this.camera || !this.particleSystems) return;

    const cameraPos = this.camera.position.clone();
    const fogStartDistance = this.settings.fogDistance;
    const fogFadeLength = 1500; // How far it takes to fade completely
    const fogEndDistance = fogStartDistance + fogFadeLength;

    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    const baseColor = new THREE.Color(this.settings.color);

    for (const system of this.particleSystems) {
        if (!system.points || !system.points.geometry) continue;
        const positions = system.points.geometry.getAttribute('position').array;
        const colors = system.points.geometry.getAttribute('color').array;

        for (let i = 0; i < system.originalIndices.length; i++) {
            const originalIndex = system.originalIndices[i];
            const originalPositionIndex = originalIndex * 3;
            const positionInGroupIndex = i * 3;

            // Update Position
            positions[positionInGroupIndex]     = this.particles[originalPositionIndex];
            positions[positionInGroupIndex + 1] = this.particles[originalPositionIndex + 1];
            positions[positionInGroupIndex + 2] = this.particles[originalPositionIndex + 2];

            // Calculate Visibility (Alpha)
            const particlePos = new THREE.Vector3(
                this.particles[originalPositionIndex],
                this.particles[originalPositionIndex + 1],
                this.particles[originalPositionIndex + 2]
            );

            const toParticle = particlePos.clone().sub(cameraPos);
            const distance = toParticle.length();
            const dotProduct = toParticle.dot(cameraDirection);
            const inFront = dotProduct > -100;

            let targetAlpha = 0;
            if (inFront && distance > 10) {
                 if (distance < fogStartDistance) {
                     targetAlpha = 1.0;
                 } else if (distance > fogEndDistance) {
                     targetAlpha = 0.0;
                 } else {
                     targetAlpha = 1.0 - (distance - fogStartDistance) / fogFadeLength;
                 }
            }

            const alphaLerpFactor = 0.1;
            this.alphas[originalIndex] = (this.alphas[originalIndex] || 0) * (1 - alphaLerpFactor) + targetAlpha * alphaLerpFactor;
            this.alphas[originalIndex] = Math.max(0, Math.min(1, this.alphas[originalIndex]));

            // Update Color
            let finalColor = baseColor.clone();
            if (this.settings.enableUlcers && this.ulcers.length > 0) {
                for (const ulcer of this.ulcers) {
                    const distanceToUlcer = particlePos.distanceTo(ulcer.position);
                    if (distanceToUlcer < ulcer.size) {
                        finalColor = ulcer.color.clone();
                        const ulcerIntensityFactor = 1 - (distanceToUlcer / ulcer.size);
                        if (ulcerIntensityFactor > 0.5) {
                            finalColor.multiplyScalar(1.0 + (this.settings.ulcerIntensity - 1.0) * (ulcerIntensityFactor - 0.5) * 2);
                        }
                        break;
                    }
                }
            }

            // Apply alpha to color components for additive blending
            colors[positionInGroupIndex]     = finalColor.r * this.alphas[originalIndex];
            colors[positionInGroupIndex + 1] = finalColor.g * this.alphas[originalIndex];
            colors[positionInGroupIndex + 2] = finalColor.b * this.alphas[originalIndex];
        }

        system.points.geometry.getAttribute('position').needsUpdate = true;
        system.points.geometry.getAttribute('color').needsUpdate = true;
    }
}


  generateUlcers() {
    this.ulcers = [];
    if (!this.settings.enableUlcers || !this.tunnelPath) return;

    const baseUlcerColor = new THREE.Color(this.settings.ulcerColor);

    for (let i = 0; i < this.settings.ulcerCount; i++) {
      const pathPos = 0.1 + Math.random() * 0.8;
      const pathPoint = this.tunnelPath.getPointAt(pathPos);
      const theta = Math.random() * Math.PI * 2;
      const tangent = this.tunnelPath.getTangentAt(pathPos).normalize();
      const up = Math.abs(tangent.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const upDir = new THREE.Vector3().crossVectors(right, tangent).normalize();
      const radius = this.settings.tunnelRadius;
      const x = pathPoint.x + (right.x * radius * Math.cos(theta) + upDir.x * radius * Math.sin(theta));
      const y = pathPoint.y + (right.y * radius * Math.cos(theta) + upDir.y * radius * Math.sin(theta));
      const z = pathPoint.z + (right.z * radius * Math.cos(theta) + upDir.z * radius * Math.sin(theta));
      const sizeVariation = 0.7 + Math.random() * 0.6;
      const ulcerColor = baseUlcerColor.clone();
      ulcerColor.offsetHSL(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.3) * 0.2,
          (Math.random() - 0.5) * 0.1
      );
      this.ulcers.push({
        position: new THREE.Vector3(x, y, z),
        size: this.settings.ulcerSize * sizeVariation,
        color: ulcerColor,
      });
    }
  }

  regenerateUlcers() {
    this.generateUlcers();
    this.resetParticles();
  }

  updateUlcerSizes() {
    if (!this.particleSystems || this.particleSystems.length === 0) return;
    for (const system of this.particleSystems) {
        if (system.name === 'ulcer') {
            system.material.size = this.settings.size * this.settings.ulcerSizeMultiplier;
        } else if (system.name === 'normal') {
             system.material.size = this.settings.size;
        }
        if (system.material) system.material.needsUpdate = true;
    }
  }

  rebuildParticleSystems(texture) {
    if (this.particleSystems) {
      for (const system of this.particleSystems) {
          if (system.points) {
              if (system.points.geometry) system.points.geometry.dispose();
              if (system.points.material) {
                  if (system.points.material.map) system.points.material.map.dispose();
                  system.points.material.dispose();
              }
              this.scene.remove(system.points);
          }
      }
    }
    this.particleSystems = [];

    // Ensure we have a valid texture
    if (!texture) {
      texture = this.createFallbackTexture();
      
    }

    this.createMultipleSizedParticleSystems(texture);
  }

  setRightSidePosition(enabled) {
    
    if (enabled) {
      // Update camera and tunnel path with larger offset
      const tunnelLength = this.settings.depth;
      const tunnelRadius = this.settings.tunnelRadius;
      
      // Use a larger offset to push tunnel to right side of viewport
      const HERO_OFFSET_X = window.innerWidth * 1.2; // Increased from 0.6 to 1.2
      
      // No scissor test - render to full canvas
      if (this.renderer) {
        // Make sure scissor test is disabled
        this.renderer.setScissorTest(false);
      }
      
      // Regenerate tunnel path with offset
      this.tunnelPath = this.createTunnelPathWithOffset(HERO_OFFSET_X);
      this.pathPoints = this.tunnelPath.getPoints(1000);
      
      // Reset camera position to match the offset
      if (this.camera) {
        this.camera.position.set(HERO_OFFSET_X, 0, -tunnelLength/2 - tunnelRadius * 2);
        this.camera.lookAt(HERO_OFFSET_X, 0, 0);
        
        // Adjust camera FOV to create more room on the left
        this.camera.fov = 70; // Increased from default
        this.camera.updateProjectionMatrix();
      }
      
      // Reset all particles with the new tunnel path
      this.resetParticles();
    }
    return this;
  }
}


// ============================================================================
// main.js (Initialization Code)
// ============================================================================

(function() { // IIFE Start
    

    // Dependency Checks
    if (typeof THREE === 'undefined') { 
        console.error("THREE.js not loaded!"); 
        return; 
    } else {
        
    }
    // Optional libs checked within their usage points

    const checkWebGLCompatibility = () => {
        try {
            const canvas = document.createElement('canvas');
            const hasWebGL = !!window.WebGLRenderingContext &&
                   (!!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl'));
            
            return hasWebGL;
        } catch(e) {
            console.error('WebGL check error:', e);
            return false;
        }
    };

    const setupContainers = () => {
        let canvasContainer = document.getElementById('canvas_container');
        if (!canvasContainer) {
            console.warn('#canvas_container not found. Creating default.');
            canvasContainer = document.createElement('div');
            canvasContainer.id = 'canvas_container';
            Object.assign(canvasContainer.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none'
            });
            document.body.insertBefore(canvasContainer, document.body.firstChild);
        } else {
            // Update existing container to ensure correct positioning
            Object.assign(canvasContainer.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none'
            });
        }
        let canvas = document.getElementById('canvas_1');
        if (!canvas) {
            console.warn('#canvas_1 not found. Creating default.');
            canvas = document.createElement('canvas');
            canvas.id = 'canvas_1';
            Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%' });
            canvasContainer.appendChild(canvas);
        } else {
             Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%' });
        }
        
        // Hide debug elements for Webflow
        const hideElement = (id) => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        };
        
        hideElement('debug_button');
        hideElement('restart_button');
        hideElement('timer');
        hideElement('gui_container');
    };

    const createJourneyMarkers = (containerId = 'journey_markers_container') => {
      let markersContainer = document.getElementById(containerId);
      if (!markersContainer) {
          console.warn(`#${containerId} not found. Creating default journey markers container.`);
          markersContainer = document.createElement('div');
          markersContainer.id = containerId;
           Object.assign(markersContainer.style, {
               position: 'fixed', right: '20px', top: '50%',
               transform: 'translateY(-50%)', zIndex: '150',
               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'
           });
          document.body.appendChild(markersContainer);
      }
      markersContainer.innerHTML = '';
      const markerCount = 5;
      for (let i = 0; i < markerCount; i++) {
        const marker = document.createElement('div');
        marker.className = 'journey-marker';
        marker.dataset.position = i / (markerCount - 1);
        // Basic styles are applied via CSS in test3.html now
        markersContainer.appendChild(marker);
      }
      return markersContainer;
    };

    const updateJourneyMarkers = (progress) => {
      const markers = document.querySelectorAll('#journey_markers_container .journey-marker'); // More specific selector
      if (markers.length === 0) return;
      const threshold = (markers.length > 1) ? (1 / ((markers.length - 1) * 2)) : 0.5;
      markers.forEach(marker => {
        const position = parseFloat(marker.dataset.position);
        const isActive = Math.abs(progress - position) < threshold;
        marker.classList.toggle('active', isActive);
      });
    };

    // Inside the IIFE, around line ~1530, before the init function
    const setupIntersectionObserver = () => {
      
      const options = {
        root: null, // Use viewport as root
        rootMargin: '0px',
        threshold: 0.1 // Trigger when at least 10% of target is visible
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            
            if (window.particleSystem) {
              // Reset the animation when it comes into view
              window.particleSystem.scrollProgress = 0;
              window.particleSystem.linearProgress = 0;
              
              if (window.particleSystem.previousCameraPosition && window.particleSystem.tunnelPath) {
                const startPoint = window.particleSystem.tunnelPath.getPointAt(0);
                window.particleSystem.previousCameraPosition.set(startPoint.x, startPoint.y, startPoint.z);
              }
            }
          } else {
            
            // Optionally pause animation when not visible
          }
        });
      }, options);
      
      // Observe the canvas container
      const canvasContainer = document.getElementById('canvas_container');
      if (canvasContainer) {
        observer.observe(canvasContainer);
        
      } else {
        console.warn('Canvas container not found for Intersection Observer');
      }
    };

    // Then keep the init function as is
    const init = () => {
        
        if (!checkWebGLCompatibility()) {
            document.body.innerHTML = `<div style="color: white; text-align: center; margin: 50px auto; font-family: sans-serif; padding: 20px; max-width: 600px;"><h1>WebGL Not Supported</h1><p>This animation requires WebGL. Please update your browser or try a different device.</p></div>`;
            console.error("WebGL not supported.");
            return;
        }

        setupContainers();

        // Create the particle system with default settings
        const particleSystem = new CurlNoiseParticleSystem();

        // MODIFIED: Expose particle system to global scope for debugging
        window.particleSystem = particleSystem;

        try {
            
            particleSystem.init('canvas_1');
            
            // MODIFIED: Initialize scrollProgress to 0 (start of animation)
            particleSystem.scrollProgress = 0;
            
            
            particleSystem.start();
            
            
            
            // Add this line to set up the Intersection Observer
            setupIntersectionObserver();
        } catch (e) {
            console.error("Error during particle system initialization:", e);
        }
    };

    // --- Run Initialization ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(); // IIFE End

