import * as THREE from 'three';
import { CurlNoiseParticleSystem } from './CurlNoiseParticleSystem.js';
import * as dat from 'dat.gui';

// Remove instructions element if it exists
const instructionsElem = document.querySelector('div[style*="bottom: 20px"]');
if (instructionsElem) {
  instructionsElem.remove();
}

// Create containers for canvas and GUI
const createContainers = () => {
  // Create canvas container if it doesn't exist
  let canvasContainer = document.getElementById('canvas_container');
  if (!canvasContainer) {
    canvasContainer = document.createElement('div');
    canvasContainer.id = 'canvas_container';
    canvasContainer.style.position = 'fixed';
    canvasContainer.style.top = '0';
    canvasContainer.style.left = '0';
    canvasContainer.style.width = '100%';
    canvasContainer.style.height = '100%';
    document.body.appendChild(canvasContainer);
  }
  
  // Create GUI container if it doesn't exist
  let guiContainer = document.getElementById('gui_container');
  if (!guiContainer) {
    guiContainer = document.createElement('div');
    guiContainer.id = 'gui_container';
    guiContainer.style.position = 'fixed';
    guiContainer.style.top = '0';
    guiContainer.style.right = '0';
    document.body.appendChild(guiContainer);
  }
  
  return { canvasContainer, guiContainer };
};

// Function to create and initialize the canvas
const createCanvas = (container) => {
  let canvas = document.getElementById('canvas_1');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'canvas_1';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
  } else {
    // Make sure existing canvas has correct styling
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }
  return canvas;
};

// Check for WebGL compatibility
const checkWebGLCompatibility = () => {
  try {
    return !!window.WebGLRenderingContext && 
           (!!document.createElement('canvas').getContext('webgl') || 
            !!document.createElement('canvas').getContext('experimental-webgl'));
  } catch(e) {
    return false;
  }
};

// Create journey markers to visualize scroll progress
const createJourneyMarkers = () => {
  const journeyMarkers = document.createElement('div');
  journeyMarkers.id = 'journey_markers';
  journeyMarkers.style.position = 'fixed';
  journeyMarkers.style.right = '20px';
  journeyMarkers.style.top = '50%';
  journeyMarkers.style.transform = 'translateY(-50%)';
  journeyMarkers.style.zIndex = '150';
  
  // Create 5 markers
  for (let i = 0; i < 5; i++) {
    const marker = document.createElement('div');
    marker.className = 'journey-marker';
    marker.dataset.position = i / 4; // 0 to 1
    marker.style.top = `calc(${i * 25}% - 7px)`;
    journeyMarkers.appendChild(marker);
  }
  
  document.body.appendChild(journeyMarkers);
};

// Update journey marker highlights based on scroll progress
const updateJourneyMarkers = (progress) => {
  const markers = document.querySelectorAll('.journey-marker');
  markers.forEach(marker => {
    const position = parseFloat(marker.dataset.position);
    const distance = Math.abs(progress - position);
    
    if (distance < 0.1) {
      marker.classList.add('active');
    } else {
      marker.classList.remove('active');
    }
  });
};

// Main initialization function
const init = () => {
  // Check WebGL support
if (!checkWebGLCompatibility()) {
  document.body.innerHTML = `
    <div style="color: white; text-align: center; margin-top: 100px; font-family: Arial, sans-serif;">
      <h1>WebGL Error</h1>
      <p>Your browser doesn't support WebGL or it's not enabled.</p>
      <p>Try updating your browser or graphics drivers.</p>
    </div>
  `;
  throw new Error("WebGL not supported");
}

  // Create DOM containers
  const { canvasContainer } = createContainers();
  
  // Create journey markers
  createJourneyMarkers();
  
  // Create canvas
  const canvas = createCanvas(canvasContainer);
  
  // Create particle system
  const particleSystem = new CurlNoiseParticleSystem({
    particleCount: undefined, // Use default based on device
    width: 2000,
    height: 2000,
    depth: 8000, // Longer tunnel
    speed: 7,
    step: 1500,
    size: undefined, // Use default based on device
    color: 0xEA368E, // Fuschia color for tissue
    rotate: false, // Disable auto-rotate for scroll experience
    oldMethod: false,
    // Tunnel specific settings
    tunnelRadius: 400,
    tunnelForceStrength: 0.1,
    flowSpeed: 1.0,
    spiralFactor: 0.2,
    // Scroll settings
    scrollSmoothing: 0.1,
    // Color settings
    backgroundColor: 0x000000, // Black background
    ambientLightColor: 0xEA368E, // Fuschia ambient light to match particles
    pointLightColor: 0xffffff, // Keep white endoscope light for good visibility
    pointLightIntensity: 1.5,  // Endoscope light intensity
    // Ulcer settings
    enableUlcers: true,
    ulcerCount: 14,
    ulcerSize: 240,
    ulcerColor: 0x00FF00, // Bright green color for ulcers
    ulcerIntensity: 2,
    ulcerSizeMultiplier: 2.5 // Make ulcer particles 2.5x larger than normal particles
  });
  
  // Initialize and start the system
  particleSystem.init('canvas_1');
  particleSystem.start();
  
  // Set up scroll event listener to update the particle system's target scroll progress
  const maxScrollDistance = 8000; // Should match the height of #scroll_container
  window.addEventListener('scroll', () => {
    // Calculate progress based on scroll position
    const scrollPosition = window.scrollY;
    particleSystem.targetScrollProgress = Math.min(scrollPosition / maxScrollDistance, 1);
  });
  
  // Add animation loop for journey markers
  const animate = () => {
    // Update journey markers based on particle system's scroll progress
    updateJourneyMarkers(particleSystem.scrollProgress);
    
    // Continue animation
    requestAnimationFrame(animate);
  };
  
  // Start animation loop
  animate();
  
  // Add global resize event listener
  window.addEventListener('resize', () => {
    particleSystem.onWindowResize();
  });
};

// Initialize when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
  } else {
  init();
} 