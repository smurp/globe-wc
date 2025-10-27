/**
 * GlobeWC Web Component
 * A ThreeJS-based 3D globe for visualizing geopolitical data
 * @customElement globe-wc
 */
export class GlobeWC extends HTMLElement {
  static get observedAttributes() {
    return ['width', 'height', 'rotate', 'auto-rotate'];
  }
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Internal state
    this._scene = null;
    this._camera = null;
    this._renderer = null;
    this._globe = null;
    this._countries = new Map();
    this._animationId = null;
    this._autoRotate = true;
    this._isDragging = false;
    this._previousMousePosition = { x: 0, y: 0 };
    
    // Configuration
    this._config = {
      width: 600,
      height: 600,
      globeRadius: 2,
      cameraDistance: 5,
      rotationSpeed: 0.001
    };
    
    // Render and setup
    this.render();
    this.setupThreeJS();
    this.setupEventHandlers();
  }
  
  connectedCallback() {
    this.startAnimation();
  }
  
  disconnectedCallback() {
    this.stopAnimation();
    this.cleanup();
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch(name) {
      case 'width':
        this._config.width = parseInt(newValue) || 600;
        this.updateSize();
        break;
      case 'height':
        this._config.height = parseInt(newValue) || 600;
        this.updateSize();
        break;
      case 'rotate':
        const degrees = parseFloat(newValue) || 0;
        if (this._globe) {
          this._globe.rotation.y = degrees * Math.PI / 180;
        }
        break;
      case 'auto-rotate':
        this._autoRotate = newValue !== 'false';
        break;
    }
  }
  
  render() {
    const style = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
        .globe-container {
          width: 100%;
          height: 100%;
          position: relative;
          cursor: grab;
        }
        .globe-container:active {
          cursor: grabbing;
        }
        canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
        .globe-info {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          pointer-events: none;
          display: none;
        }
        .globe-info.visible {
          display: block;
        }
      </style>
    `;
    
    const html = `
      <div class="globe-container">
        <div class="globe-info"></div>
      </div>
    `;
    
    this.shadowRoot.innerHTML = style + html;
  }
  
  setupThreeJS() {
    const container = this.shadowRoot.querySelector('.globe-container');
    
    if (typeof THREE === 'undefined') {
      console.error('THREE.js not loaded. Please include THREE.js before using globe-wc.');
      container.innerHTML = '<div style="padding: 20px; color: red;">Error: THREE.js not loaded</div>';
      return;
    }
    
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x000011);
    
    this._camera = new THREE.PerspectiveCamera(
      45,
      this._config.width / this._config.height,
      0.1,
      1000
    );
    this._camera.position.z = this._config.cameraDistance;
    
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setSize(this._config.width, this._config.height);
    container.appendChild(this._renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    this._scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    this._scene.add(directionalLight);
    
    this.createGlobe();
    this.createCountryOutlines();
  }
  
  createGlobe() {
    const geometry = new THREE.SphereGeometry(
      this._config.globeRadius,
      64,
      64
    );
    
    const material = new THREE.MeshPhongMaterial({
      color: 0x2233ff,
      emissive: 0x112244,
      specular: 0x333333,
      shininess: 25,
      flatShading: false
    });
    
    this._globe = new THREE.Mesh(geometry, material);
    this._scene.add(this._globe);
    
    this.addGraticule();
  }
  
  addGraticule() {
    const graticuleGroup = new THREE.Group();
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.3
    });
    
    for (let lat = -80; lat <= 80; lat += 20) {
      const geometry = new THREE.BufferGeometry();
      const points = [];
      
      for (let lng = 0; lng <= 360; lng += 5) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = lng * Math.PI / 180;
        
        points.push(new THREE.Vector3(
          this._config.globeRadius * Math.sin(phi) * Math.cos(theta),
          this._config.globeRadius * Math.cos(phi),
          this._config.globeRadius * Math.sin(phi) * Math.sin(theta)
        ));
      }
      
      geometry.setFromPoints(points);
      const line = new THREE.Line(geometry, linesMaterial);
      graticuleGroup.add(line);
    }
    
    for (let lng = 0; lng < 180; lng += 20) {
      const geometry = new THREE.BufferGeometry();
      const points = [];
      
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = lng * Math.PI / 180;
        
        points.push(new THREE.Vector3(
          this._config.globeRadius * Math.sin(phi) * Math.cos(theta),
          this._config.globeRadius * Math.cos(phi),
          this._config.globeRadius * Math.sin(phi) * Math.sin(theta)
        ));
      }
      
      geometry.setFromPoints(points);
      const line = new THREE.Line(geometry, linesMaterial);
      graticuleGroup.add(line);
    }
    
    this._globe.add(graticuleGroup);
  }
  
  async createCountryOutlines() {
    try {
      // Fetch world countries GeoJSON from a reliable CDN
      const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      const data = await response.json();
      
      // Note: world-atlas uses TopoJSON, so we need to convert it
      // For simplicity, let's use a direct GeoJSON source instead
      const geoResponse = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
      const geoData = await geoResponse.json();
      
      this.renderCountries(geoData);
      
    } catch (error) {
      console.warn('Could not load country data, using sample markers:', error);
      // Fallback to sample markers
      const sampleCountries = [
        { name: 'North America', color: 0xffff00, lat: 40, lng: -100, size: 10 },
        { name: 'Europe', color: 0xff00ff, lat: 51, lng: 10, size: 8 },
        { name: 'Australia', color: 0x00ff00, lat: -25, lng: 135, size: 15 }
      ];
      sampleCountries.forEach(country => this.addCountryMarker(country));
    }
  }

  renderCountries(geoData) {
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    
    geoData.features.forEach(feature => {
      const coordinates = feature.geometry.coordinates;
      const geometryType = feature.geometry.type;
      
      if (geometryType === 'Polygon') {
        this.drawPolygon(coordinates, material);
      } else if (geometryType === 'MultiPolygon') {
        coordinates.forEach(polygon => {
          this.drawPolygon(polygon, material);
        });
      }
    });
  }

  drawPolygon(coordinates, material) {
    coordinates.forEach(ring => {
      const points = [];
      
      ring.forEach(([lng, lat]) => {
        // Convert lat/lng to 3D position on sphere
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lng + 180) * Math.PI / 180;
        const radius = this._config.globeRadius + 0.01;
        
        points.push(new THREE.Vector3(
          -radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        ));
      });
      
      if (points.length > 0) {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        this._globe.add(line);
      }
    });
  }

  
  setupEventHandlers() {
    const container = this.shadowRoot.querySelector('.globe-container');
    
    container.addEventListener('mousedown', (e) => {
      this._isDragging = true;
      this._previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
      this._autoRotate = false;
    });
    
    container.addEventListener('mousemove', (e) => {
      if (!this._isDragging || !this._globe) return;
      
      const deltaX = e.clientX - this._previousMousePosition.x;
      const deltaY = e.clientY - this._previousMousePosition.y;
      
      this._globe.rotation.y += deltaX * 0.005;
      this._globe.rotation.x += deltaY * 0.005;
      
      this._globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this._globe.rotation.x));
      
      this._previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    });
    
    container.addEventListener('mouseup', () => {
      this._isDragging = false;
    });
    
    container.addEventListener('mouseleave', () => {
      this._isDragging = false;
    });
    
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      this._camera.position.z = Math.max(3, Math.min(10, this._camera.position.z + delta));
    });
    
    this.dispatchEvent(new CustomEvent('globe-initialized', {
      detail: { 
        countries: Array.from(this._countries.keys())
      },
      bubbles: true,
      composed: true
    }));
  }
  
  animate() {
    this._animationId = requestAnimationFrame(() => this.animate());
    
    if (this._autoRotate && this._globe && !this._isDragging) {
      this._globe.rotation.y += this._config.rotationSpeed;
    }
    
    if (this._renderer && this._scene && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  }
  
  startAnimation() {
    if (!this._animationId) {
      this.animate();
    }
  }
  
  stopAnimation() {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }
  
  updateSize() {
    if (!this._camera || !this._renderer) return;
    
    const width = this._config.width;
    const height = this._config.height;
    
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(width, height);
  }
  
  cleanup() {
    if (this._globe) {
      this._globe.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    if (this._renderer) {
      this._renderer.dispose();
    }
    
    this._countries.clear();
  }
  
  addCountry(countryData) {
    this.addCountryMarker(countryData);
    
    this.dispatchEvent(new CustomEvent('country-added', {
      detail: countryData,
      bubbles: true,
      composed: true
    }));
  }
  
  removeCountry(name) {
    const marker = this._countries.get(name);
    if (marker && this._globe) {
      this._globe.remove(marker);
      this._countries.delete(name);
      
      this.dispatchEvent(new CustomEvent('country-removed', {
        detail: { name },
        bubbles: true,
        composed: true
      }));
    }
  }
  
  getCountries() {
    return Array.from(this._countries.keys());
  }
  
  rotateTo(lat, lng, duration = 1000) {
    const targetRotY = -lng * Math.PI / 180;
    const targetRotX = lat * Math.PI / 180;
    
    if (this._globe) {
      this._globe.rotation.y = targetRotY;
      this._globe.rotation.x = targetRotX;
    }
  }
  
  reset() {
    if (this._globe) {
      this._globe.rotation.x = 0;
      this._globe.rotation.y = 0;
    }
    if (this._camera) {
      this._camera.position.z = this._config.cameraDistance;
    }
    this._autoRotate = true;
  }
}

customElements.define('globe-wc', GlobeWC);

