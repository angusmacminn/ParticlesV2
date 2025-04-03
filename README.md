# Three.js Particle System

A simple 3D particle system built with Three.js.

## Features

- 3D particle system with thousands of particles
- Interactive camera controls with OrbitControls
- Colorful, animated particles
- Responsive design that adjusts to window size

## Prerequisites

- Node.js (v14+)
- npm or yarn

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Running the Project

To start the development server:

```bash
npm run dev
```

This will start the Vite dev server and open the project in your browser.

## Building for Production

To build the project for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## Customization

You can customize the particle system by modifying the parameters passed to the `ParticleSystem` constructor in `src/js/main.js`:

```javascript
const particleSystem = new ParticleSystem({
  particleCount: 10000, // Number of particles
  size: 0.4,            // Size of each particle
  spread: 60,           // How far particles spread from center
  opacity: 0.7          // Opacity of particles
});
```

## Further Development Ideas

- Add particle physics (gravity, attraction, repulsion)
- Create particle emitters at specific locations
- Add interactive controls to modify particle properties
- Implement different particle shapes and textures
- Add color themes or gradients 