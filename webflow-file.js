// SimplexNoise implementation
(function(){
  var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  var F3 = 1.0 / 3.0;
  var G3 = 1.0 / 6.0;
  var F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
  var G4 = (5.0 - Math.sqrt(5.0)) / 20.0;
  var grad3 = new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);
  var grad4 = new Float32Array([0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1, -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1, 1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1, -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0]);
  var p = new Uint8Array(256);
  var perm = new Uint8Array(512);
  var permMod12 = new Uint8Array(512);
  
  var Simplex = function(seed) {
      this.seed(seed || Math.random());
  };
  
  Simplex.prototype = {
      seed: function(seed) {
          for(var i = 0; i < 256; i++) {
              p[i] = Math.floor(seed * 256);
              seed = (seed * 22695477 + 1) % 1;
          }
          for(var i = 0; i < 512; i++) {
              perm[i] = p[i & 255];
              permMod12[i] = perm[i] % 12;
          }
      },
      noise2D: function(xin, yin) {
          var n0, n1, n2;
          var s = (xin + yin) * F2;
          var i = Math.floor(xin + s);
          var j = Math.floor(yin + s);
          var t = (i + j) * G2;
          var X0 = i - t;
          var Y0 = j - t;
          var x0 = xin - X0;
          var y0 = yin - Y0;
          var i1, j1;
          if(x0 > y0) {
              i1 = 1;
              j1 = 0;
          } else {
              i1 = 0;
              j1 = 1;
          }
          var x1 = x0 - i1 + G2;
          var y1 = y0 - j1 + G2;
          var x2 = x0 - 1.0 + 2.0 * G2;
          var y2 = y0 - 1.0 + 2.0 * G2;
          var ii = i & 255;
          var jj = j & 255;
          var gi0 = permMod12[ii + perm[jj]];
          var gi1 = permMod12[ii + i1 + perm[jj + j1]];
          var gi2 = permMod12[ii + 1 + perm[jj + 1]];
          var t0 = 0.5 - x0 * x0 - y0 * y0;
          if(t0 < 0) n0 = 0.0;
          else {
              t0 *= t0;
              n0 = t0 * t0 * this.dot2D(grad3, gi0, x0, y0);
          }
          var t1 = 0.5 - x1 * x1 - y1 * y1;
          if(t1 < 0) n1 = 0.0;
          else {
              t1 *= t1;
              n1 = t1 * t1 * this.dot2D(grad3, gi1, x1, y1);
          }
          var t2 = 0.5 - x2 * x2 - y2 * y2;
          if(t2 < 0) n2 = 0.0;
          else {
              t2 *= t2;
              n2 = t2 * t2 * this.dot2D(grad3, gi2, x2, y2);
          }
          return 70.0 * (n0 + n1 + n2);
      },
      noise3D: function(xin, yin, zin) {
          var n0, n1, n2, n3;
          var s = (xin + yin + zin) * F3;
          var i = Math.floor(xin + s);
          var j = Math.floor(yin + s);
          var k = Math.floor(zin + s);
          var t = (i + j + k) * G3;
          var X0 = i - t;
          var Y0 = j - t;
          var Z0 = k - t;
          var x0 = xin - X0;
          var y0 = yin - Y0;
          var z0 = zin - Z0;
          var i1, j1, k1;
          var i2, j2, k2;
          if(x0 >= y0) {
              if(y0 >= z0) {
                  i1 = 1;
                  j1 = 0;
                  k1 = 0;
                  i2 = 1;
                  j2 = 1;
                  k2 = 0;
              } else if(x0 >= z0) {
                  i1 = 1;
                  j1 = 0;
                  k1 = 0;
                  i2 = 1;
                  j2 = 0;
                  k2 = 1;
              } else {
                  i1 = 0;
                  j1 = 0;
                  k1 = 1;
                  i2 = 1;
                  j2 = 0;
                  k2 = 1;
              }
          } else {
              if(y0 < z0) {
                  i1 = 0;
                  j1 = 0;
                  k1 = 1;
                  i2 = 0;
                  j2 = 1;
                  k2 = 1;
              } else if(x0 < z0) {
                  i1 = 0;
                  j1 = 1;
                  k1 = 0;
                  i2 = 0;
                  j2 = 1;
                  k2 = 1;
              } else {
                  i1 = 0;
                  j1 = 1;
                  k1 = 0;
                  i2 = 1;
                  j2 = 1;
                  k2 = 0;
              }
          }
          var x1 = x0 - i1 + G3;
          var y1 = y0 - j1 + G3;
          var z1 = z0 - k1 + G3;
          var x2 = x0 - i2 + 2.0 * G3;
          var y2 = y0 - j2 + 2.0 * G3;
          var z2 = z0 - k2 + 2.0 * G3;
          var x3 = x0 - 1.0 + 3.0 * G3;
          var y3 = y0 - 1.0 + 3.0 * G3;
          var z3 = z0 - 1.0 + 3.0 * G3;
          var ii = i & 255;
          var jj = j & 255;
          var kk = k & 255;
          var gi0 = permMod12[ii + perm[jj + perm[kk]]];
          var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
          var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
          var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];
          var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
          if(t0 < 0) n0 = 0.0;
          else {
              t0 *= t0;
              n0 = t0 * t0 * this.dot3D(grad3, gi0, x0, y0, z0);
          }
          var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
          if(t1 < 0) n1 = 0.0;
          else {
              t1 *= t1;
              n1 = t1 * t1 * this.dot3D(grad3, gi1, x1, y1, z1);
          }
          var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
          if(t2 < 0) n2 = 0.0;
          else {
              t2 *= t2;
              n2 = t2 * t2 * this.dot3D(grad3, gi2, x2, y2, z2);
          }
          var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
          if(t3 < 0) n3 = 0.0;
          else {
              t3 *= t3;
              n3 = t3 * t3 * this.dot3D(grad3, gi3, x3, y3, z3);
          }
          return 32.0 * (n0 + n1 + n2 + n3);
      },
      dot2D: function(g, i, x, y) {
          return g[i * 3] * x + g[i * 3 + 1] * y;
      },
      dot3D: function(g, i, x, y, z) {
          return g[i * 3] * x + g[i * 3 + 1] * y + g[i * 3 + 2] * z;
      }
  };
  
  window.SimplexNoise = Simplex;
})();

// Curl Noise Particle System
class CurlNoiseParticleSystem {
  constructor(options = {}) {
    // Default settings
    this.settings = {
      particleCount: options.particleCount || (this.isMobile() ? 2000 : 15000),
      width: options.width || 2000,
      height: options.height || 2000,
      depth: options.depth || 8000, // Make tunnel longer
      speed: options.speed || 4,
      step: options.step || 1500,
      size: options.size || (this.isMobile() ? 150 : 15),
      color: options.color || 0xEA368E, // Fuschia default color
      rotate: options.rotate !== undefined ? options.rotate : false,
      oldMethod: options.oldMethod !== undefined ? options.oldMethod : false,
      // Tunnel specific settings
      tunnelRadius: options.tunnelRadius || 400,  // Default tunnel radius
      tunnelForceStrength: options.tunnelForceStrength || 0.1, // Strength of force keeping particles in tunnel
      flowSpeed: options.flowSpeed || 1.0, // Speed particles flow through the tunnel
      spiralFactor: options.spiralFactor || 0.2, // How much spiral motion to add
      // Color settings
      backgroundColor: options.backgroundColor || 0x000000, // Black background color
      ambientLightColor: options.ambientLightColor || 0xEA368E, // Fuschia ambient light
      pointLightColor: options.pointLightColor || 0xffffff, // White endoscope light
      pointLightIntensity: options.pointLightIntensity || 1.5, // Endoscope light intensity
      // Visibility settings
      fogDistance: options.fogDistance || 1500, // Distance at which particles start to fade in
      fogDensity: options.fogDensity || 0.001, // How quickly particles fade in with distance
      // Ulcer settings
      ulcerColor: options.ulcerColor || 0x00FF00, // Bright green color for ulcers
      ulcerIntensity: options.ulcerIntensity || 1.2, // Brightness multiplier for ulcers
      ulcerSizeMultiplier: options.ulcerSizeMultiplier || 2.5, // How much larger ulcer particles should be
      ulcerRadius: options.ulcerRadius || 150, // Default radius for mouse-controlled ulcer
      mouseInteractionDistance: options.mouseInteractionDistance || 300 // How far from mouse particles are affected
    };

    // Setup scene properties
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.simplex = new SimplexNoise();
    this.simplex.seed(Math.random());
    
    // Animation properties
    this.time = 0;
    this.lastFrame = Date.now();
    
    // Particles
    this.particles = [];
    this.positions = [];
    this.velocities = [];
    this.alphas = [];
    this.sizes = [];
    this.times = [];
    this.lifetimes = [];
    
    // Tunnel path
    this.tunnelPath = null;
    this.pathPoints = [];
    
    // Mouse tracking for ulcer positioning
    this.mouse = new THREE.Vector2(0, 0);
    this.raycaster = new THREE.Raycaster();
    this.mousePosition3D = new THREE.Vector3(0, 0, 0);
    this.mouseUlcer = null;
  }
  
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  }
  
  init(containerId) {
    // Create canvas
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container element not found');
      return;
    }
    
    // Setup canvas
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
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

    // Setup camera for tunnel view - MODIFIED CAMERA POSITION
    const ratio = window.innerWidth / window.innerHeight;
    const tunnelRadius = this.settings.tunnelRadius;
    
    this.camera = new THREE.PerspectiveCamera(70, ratio, 1, 20000); // Wider FOV for better immersion
    
    // Position the camera at the entrance of the tunnel looking inward
    this.camera.position.set(0, 0, -this.settings.depth/2 + tunnelRadius * 2);
    this.camera.lookAt(0, 0, 0); // Look toward the center of the tunnel
    this.scene.add(this.camera);

    // Generate our endoscopy tunnel path
    this.tunnelPath = this.createTunnelPath();
    this.pathPoints = this.tunnelPath.getPoints(1000);

    // Initialize particles
    this.initParticles();
    
    // Setup mouse interaction
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    window.addEventListener('touchmove', this.onTouchMove.bind(this), false);
    
    // Event listener for window resize
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    
    // Start animation
    this.animate();
  }
  
  onMouseMove(event) {
    // Get mouse position in normalized device coordinates (-1 to +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  onTouchMove(event) {
    if (event.touches.length > 0) {
      // Get the first touch position
      this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
      
      // Prevent page scrolling
      event.preventDefault();
    }
  }
  
  updateMousePosition() {
    // Update the raycaster with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Calculate mouse position in 3D space using a different approach
    // Create a plane at a fixed distance in front of the camera
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    
    // Place the interaction plane at a fixed distance in front of camera
    const planeDistance = this.settings.mouseInteractionDistance;
    const planePosition = new THREE.Vector3().copy(this.camera.position);
    planePosition.add(cameraDirection.multiplyScalar(planeDistance));
    
    // Create a plane perpendicular to camera direction
    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(cameraDirection, planePosition);
    
    // Find the intersection point of the ray with the plane
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);
    
    // Update the mouse position in 3D space
    if (intersection) {
      this.mousePosition3D.copy(intersection);
      
      // Optional: Add this line for debug logging if needed
      // console.log("Mouse 3D position:", this.mousePosition3D);
    }
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
    this.alphas = [];
    this.sizes = [];
    
    // Array for colors
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color(this.settings.color);
    
    // Create particles distributed in the tunnel
    for (let i = 0; i < particleCount; i++) {
      // Random position along the path
      const pathPos = Math.random();
      const pathPoint = this.tunnelPath.getPointAt(pathPos);
      
      // Create a tunnel by placing particles in a cylindrical shape
      const theta = Math.random() * Math.PI * 2;
      
      // Random radius with variation
      const radiusVariation = Math.pow(Math.random(), 0.5);
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
      
      // Initialize with slight inward velocity
      const vx = (pathPoint.x - x) * 0.01 + (0.2 - Math.random() * 0.4);
      const vy = (pathPoint.y - y) * 0.01 + (0.2 - Math.random() * 0.4);
      const vz = (pathPoint.z - z) * 0.01 + (0.2 - Math.random() * 0.4);
      
      this.velocities.push(vx, vy, vz);
      
      this.times.push(0);
      this.lifetimes.push(3.0 * Math.random());
      this.alphas.push(1); // Fully visible
      
      // Set normal size by default
      this.sizes.push(this.settings.size);
      
      // Set normal color
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.particles, 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Load texture
    const texture = new THREE.TextureLoader().load('https://al-ro.github.io/images/embers/ember_texture.png');
    
    // Create particle systems for normal and ulcer particles
    this.createMultipleSizedParticleSystems(texture);
    
    // Add ambient lighting to enhance the tissue-like appearance
    this.ambientLight = new THREE.AmbientLight(this.settings.ambientLightColor, 0.5);
    this.scene.add(this.ambientLight);

    // Add point light positioned at camera to simulate endoscope light
    this.endoscopeLight = new THREE.PointLight(
      this.settings.pointLightColor, 
      this.settings.pointLightIntensity, 
      1000
    );
    this.camera.add(this.endoscopeLight);
    this.endoscopeLight.position.set(0, 0, -2); // Position light in front of camera
  }
  
  createMultipleSizedParticleSystems(texture) {
    // Group particles by size to create distinct particle systems
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
    
    // Initially all particles are normal
    for (let i = 0; i < this.settings.particleCount; i++) {
      const index = i * 3;
      
      // All particles start in the normal group
      const group = sizeGroups.normal;
      
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
  }
  
  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height, false);
  }
  
  animate() {
    // Calculate delta time
    const thisFrame = Date.now();
    const dT = (thisFrame - this.lastFrame) / 1000;
    this.time += dT;
    this.lastFrame = thisFrame;
    
    // Update mouse position in 3D
    this.updateMousePosition();
    
    // Move particles
    this.move(dT);
    
    // Update particle visibility based on distance from camera
    this.updateParticleVisibility();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
    
    // Request next frame
    requestAnimationFrame(this.animate.bind(this));
  }
  
  updateParticleVisibility() {
    // Reset particle groups
    this.rebuildParticleGroups();
    
    // Update each particle system
    for (const system of this.particleSystems) {
      system.points.geometry.getAttribute('position').needsUpdate = true;
      system.points.geometry.getAttribute('color').needsUpdate = true;
    }
  }
  
  rebuildParticleGroups() {
    // We need to rebuild which particles belong to which group (normal or ulcer)
    // based on their distance from the mouse position
    
    // Create new arrays for each group
    const normalGroup = {
      positions: [],
      colors: [],
      indices: []
    };
    
    const ulcerGroup = {
      positions: [],
      colors: [],
      indices: []
    };
    
    const mousePosition = this.mousePosition3D;
    const ulcerRadius = this.settings.ulcerRadius * 1.5; // Make ulcer affect area larger
    const color = new THREE.Color(this.settings.color);
    const ulcerColor = new THREE.Color(this.settings.ulcerColor);
    
    // Check each particle against the mouse position
    for (let i = 0; i < this.settings.particleCount; i++) {
      const index = i * 3;
      
      // Get particle position
      const particlePos = new THREE.Vector3(
        this.particles[index],
        this.particles[index + 1],
        this.particles[index + 2]
      );
      
      // Calculate distance from mouse position
      const distanceToMouse = particlePos.distanceTo(mousePosition);
      
      // Determine if this particle should be an ulcer based on mouse proximity
      const isUlcerParticle = distanceToMouse < ulcerRadius;
      
      // Choose the appropriate color based on whether it's an ulcer
      let particleColor;
      let group;
      
      if (isUlcerParticle) {
        // Ulcer particle
        particleColor = ulcerColor.clone(); // Clone to avoid modifying original
        group = ulcerGroup;
        
        // Add some intensity variation based on distance from mouse
        const intensity = 1 - (distanceToMouse / ulcerRadius);
        // Apply stronger intensity multiplier for more visible ulcers
        particleColor.multiplyScalar(this.settings.ulcerIntensity * 1.5);
      } else {
        // Normal particle
        particleColor = color;
        group = normalGroup;
      }
      
      // Add to the appropriate group
      group.positions.push(
        this.particles[index],
        this.particles[index + 1],
        this.particles[index + 2]
      );
      
      // Set the color
      group.colors.push(
        particleColor.r,
        particleColor.g,
        particleColor.b
      );
      
      // Store index mapping
      group.indices.push(i);
    }
    
    // Update geometries for each particle system
    for (const system of this.particleSystems) {
      // Determine which group data to use
      const data = system.name === 'normal' ? normalGroup : ulcerGroup;
      
      // Skip if no particles in this group
      if (data.positions.length === 0) {
        // Hide the points if empty
        system.points.visible = false;
        continue;
      }
      
      // Show the points
      system.points.visible = true;
      
      // Create new attributes
      const positionAttribute = new THREE.Float32BufferAttribute(data.positions, 3);
      const colorAttribute = new THREE.Float32BufferAttribute(data.colors, 3);
      
      // Update geometry
      system.points.geometry.setAttribute('position', positionAttribute);
      system.points.geometry.setAttribute('color', colorAttribute);
      
      // Update the indices mapping
      system.originalIndices = data.indices;
    }
  }
  
  computeCurl(x, y, z) {
    const eps = 0.0001;
    
    // Find rate of change in YZ
    const n1 = this.simplex.noise3D(x, y + eps, z);
    const n2 = this.simplex.noise3D(x, y - eps, z);
    // Average to reduce artifacts
    const a = (n1 - n2) / (2 * eps);
    
    // Find rate of change in XZ
    const n3 = this.simplex.noise3D(x + eps, y, z);
    const n4 = this.simplex.noise3D(x - eps, y, z);
    const b = (n3 - n4) / (2 * eps);
    
    // Find rate of change in XY
    const n5 = this.simplex.noise3D(x, y, z + eps);
    const n6 = this.simplex.noise3D(x, y, z - eps);
    const c = (n5 - n6) / (2 * eps);
    
    // Alternative method
    if (this.settings.oldMethod) {
      const dx = this.simplex.noise3D(x, y + eps, z) - this.simplex.noise3D(x, y - eps, z);
      const dy = this.simplex.noise3D(x + eps, y, z) - this.simplex.noise3D(x - eps, y, z);
      const dz = this.simplex.noise3D(x, y, z + eps) - this.simplex.noise3D(x, y, z - eps);
      
      return new THREE.Vector3(
          dx * 0.5,
          dy * 0.5,
          dz * 0.5
      ).normalize();
    }
    
    // Standard curl calculation
    const curl = [
      a, // Curl X
      b, // Curl Y
      c  // Curl Z
    ];
    
    return curl;
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
        }
      }
      
      // Initialize the particle system when the document is loaded
      document.addEventListener('DOMContentLoaded', function() {
        // Create the particle system
        const particleSystem = new CurlNoiseParticleSystem({
          particleCount: undefined, // Use default based on device
          color: 0xEA368E, // Fuschia color
          backgroundColor: 0x000000, // Black background
          ambientLightColor: 0xEA368E, // Fuschia ambient light
          pointLightColor: 0xffffff, // White endoscope light
          pointLightIntensity: 2.0, // Increased for better visibility
          ulcerColor: 0x00FF00, // Bright green color for ulcers
          ulcerSizeMultiplier: 3.0, // Increased to make ulcer particles more noticeable
          ulcerRadius: 300, // Increased size of the mouse-controlled ulcer area
          mouseInteractionDistance: 600, // Adjusted for better interaction
          tunnelRadius: 400,
          depth: 8000,
          flowSpeed: 0.8,
          spiralFactor: 0.2
        });
        
        // Initialize the visualization
        particleSystem.init('canvas_container');
      });