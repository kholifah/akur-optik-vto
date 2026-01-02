# 3D Glass Models

This directory contains 3D models (.glb files) for each product in the catalog. Each model should be named `{product-id}.glb`.

## Product IDs

- `axis-clear.glb` - AXIS eyeglasses (clear)
- `oscar-clear.glb` - OSCAR eyeglasses
- `filmore-clear.glb` - FILMORE eyeglasses
- `atlas-clear.glb` - ATLAS eyeglasses
- `axis-sun.glb` - AXIS sunglasses
- `oscar-sun.glb` - OSCAR sunglasses
- `filmore-sun.glb` - FILMORE sunglasses
- `breakaway-sun.glb` - BREAKAWAY sunglasses

## How to Add 3D Models

### Option 1: Use Free 3D Glasses Models
1. Visit **Sketchfab** (https://sketchfab.com) or **Poly Haven** (https://polyhaven.com/models)
2. Search for "glasses" or "eyeglasses" models
3. Download models in GLB format
4. Rename and place in this directory

### Option 2: Export from 3D Design Software
Use tools like:
- **Blender** (free, open-source) - design custom frames and export as GLB
- **Tinkercad** (free, browser-based) - quick 3D modeling
- **Fusion 360** (free for personal use)

### Option 3: Generate Sample Models Programmatically
Use a library like `three.js` + `glb-exporter` to create minimal placeholder models:

```javascript
// Sample: Create a simple frame model with three.js and export as GLB
const THREE = require('three');
const GLTFExporter = require('three/examples/jsm/exporters/GLTFExporter');

const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry(0.5, 0.2, 0.1);
const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
const frame = new THREE.Mesh(geometry, material);
scene.add(frame);

const exporter = new GLTFExporter();
exporter.parse(scene, (gltf) => {
  // Save gltf as .glb file
}, {});
```

## Model Specifications

- **Format**: GLB (binary GLTF)
- **Recommended Size**: < 2MB per file
- **Poly Count**: 5,000 - 50,000 triangles for optimal performance
- **Materials**: Use PBR (Physically Based Rendering) materials for best appearance
- **Scale**: Models should be roughly 1:1 scale (glasses ~140mm width)

## Testing

Models are displayed in the ProductModal when users click the "3D" tab while in virtual try-on mode. They auto-rotate and support mouse/touch camera controls via `<model-viewer>`.

## Resources

- **Sketchfab**: https://sketchfab.com/search?q=glasses&type=models&sort_by=-publishedAt
- **Poly Haven**: https://polyhaven.com/models?search=glasses
- **Three.js GLB Export**: https://threejs.org/examples/?q=gltf#webgl_exporter_gltf
- **model-viewer Docs**: https://modelviewer.dev/
