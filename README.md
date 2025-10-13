# globe-wc

A ThreeJS-based 3D globe web component for visualizing geopolitical data. Part of the MMM/ThinkerToys ecosystem.

![license](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue.svg)

## Features

- 🌍 **3D Interactive Globe** - Smooth ThreeJS-based rendering
- 🖱️ **Mouse Controls** - Drag to rotate, scroll to zoom
- 🎯 **Geopolitical Ready** - Designed for country/region visualization
- 🎨 **Customizable** - Color coding, markers, and overlays
- 📍 **Lat/Long Support** - Easy geographic positioning
- 🔄 **Auto-rotate** - Optional automatic rotation
- ⚡ **Zero dependencies** - Just needs THREE.js (peer dependency)
- 🎭 **Shadow DOM** - Fully encapsulated styling
- 📢 **Event-driven** - Custom events for all interactions

## Installation

\`\`\`bash
npm install @mmmlib/globe-wc
\`\`\`

Or use directly via CDN:

\`\`\`html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script type="module" src="path/to/globe-wc.js"></script>
\`\`\`

## Usage

### Basic Usage

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script type="module" src="path/to/globe-wc.js"></script>
</head>
<body>
    <globe-wc width="800" height="800"></globe-wc>
</body>
</html>
\`\`\`

### JavaScript API

\`\`\`javascript
const globe = document.querySelector('globe-wc');

// Add a country/region marker
globe.addCountry({
  name: 'United States',
  color: 0xff0000,
  lat: 40,
  lng: -100,
  size: 10
});

// Remove a country
globe.removeCountry('United States');

// Get all countries
const countries = globe.getCountries();

// Rotate to coordinates
globe.rotateTo(51.5074, -0.1278);

// Reset view
globe.reset();
\`\`\`

## Development

\`\`\`bash
npm install
npm run dev
npm run build
\`\`\`

## License

AGPL-3.0-or-later © smurp
