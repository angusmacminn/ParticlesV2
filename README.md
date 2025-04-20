# Stomach Tunnel Animation

A standalone JavaScript animation that renders a realistic stomach tunnel with ulcers using Three.js.

## Local Testing

To test the animation locally:

1. Clone this repository or download the files
2. Open `index.html` in a web browser
3. The animation will automatically start and loop every 12 seconds

## Integration with Webflow

To add this animation to a Webflow hero section:

1. Upload the `stomach-tunnel-animation.js` file to Webflow (Assets panel)
2. Add an HTML embed element to your hero section with the following code:

```html
<div id="animation-container" style="width: 100%; height: 100%;"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="[YOUR-UPLOADED-JS-FILE-URL]"></script>
<script>
  // Initialize with custom options (all are optional)
  initStomachTunnelAnimation({
    containerId: 'animation-container',
    animationDuration: 30, // in seconds
    particleCount: 25000,  // reduce on mobile for better performance
    tunnelRadius: 400,
    ulcerCount: 14,
    color: 0xEA368E,      // Fuschia color for stomach tissue
    ulcerColor: 0x00FF00  // Green color for ulcers
  });
</script>
```

## Configuration Options

The animation can be customized with the following options:

| Option | Default | Description |
|--------|---------|-------------|
| containerId | 'animation-container' | ID of the container element |
| animationDuration | 12 | Duration of full animation in seconds |
| particleCount | 25000 (5000 on mobile) | Number of particles |
| width | 2000 | Width of the particle system |
| height | 2000 | Height of the particle system |
| depth | 8000 | Depth/length of the tunnel |
| tunnelRadius | 400 | Radius of the tunnel |
| color | 0xEA368E | Color of the stomach tissue (fuschia) |
| ulcerCount | 14 | Number of ulcers |
| ulcerSize | 240 | Size of ulcers |
| ulcerColor | 0x00FF00 | Color of ulcers (green) |
| tunnelForceStrength | 0.15 | How strongly particles stick to tunnel walls |
| fogDistance | 2000 | Distance at which fog appears |
| fogDensity | 0.0008 | Density of fog for depth effect |

## Performance Optimization

This animation includes several optimizations for better performance:

1. Automatic particle count reduction on mobile devices
2. Proper texture handling for better visual quality
3. Efficient path computation to reduce CPU usage
4. Automatic WebGL capability detection
5. Proper WebGL rendering configuration

## Browser Support

This animation requires WebGL support. It works in all modern browsers, including:
- Chrome
- Firefox
- Safari
- Edge

Mobile support is included with automatic detection and reduced particle count for better performance. 