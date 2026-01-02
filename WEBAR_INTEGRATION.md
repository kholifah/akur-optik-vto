# WebAR.rocks.face Integration Guide

This document explains how the 3D models are integrated with WebAR.rocks.face for virtual try-on experiences.

## Overview

The app supports two AR approaches for trying on glasses:

1. **MediaPipe-based AR** (Current default)
   - Uses MediaPipe FaceMesh for automatic face landmark detection
   - Displays 2D glasses overlay positioned on the face
   - Works reliably for quick, lightweight AR experience

2. **WebAR.rocks.face** (Enhanced 3D AR - ready for integration)
   - Professional AR library with advanced face tracking
   - Can render 3D glasses models directly on the face
   - Better tracking and positioning for 3D models

## 3D Model Files

Located in `/public/models3D/`:
- `glasses1.glb` - Standard glasses model
- `glasses2.glb` - Alternative glasses model (wider frames)
- `occluder.glb` - Face occluder for realistic rendering
- `occluderHighPoly.json` - High-poly occluder metadata

### Product Mapping

The app automatically maps products to 3D models based on frame width:
- Products with frameWidth < 150mm → Use `glasses1.glb`
- Products with frameWidth ≥ 150mm → Use `glasses2.glb`

You can customize this mapping in `src/components/ProductModal.tsx`:

```typescript
const getModelUrl = () => {
  const modelIndex = product.frameWidth >= 150 ? 2 : 1;
  return `/models3D/glasses${modelIndex}.glb`
}
```

## Current Implementation

### Files Involved

- `src/components/ProductModal.tsx` - Main AR/3D tab management
- `src/components/VTOCanvas.tsx` - Webcam canvas with MediaPipe landmark detection
- `lib/overlay.ts` - Face overlay positioning mathematics
- `/public/models3D/` - GLB model files

### How It Works

1. **AR Tab (2D Overlay)**
   - VTOCanvas captures video from user's camera
   - MediaPipe FaceMesh detects facial landmarks (left eye, right eye, nose bridge)
   - `computeTransformFromEyes()` calculates position, scale, and rotation based on detected face
   - 2D product image is displayed as overlay with manual controls

2. **3D Tab**
   - model-viewer web component displays the 3D GLB model
   - Users can rotate, zoom, and inspect the glasses from all angles

## Enhancing with WebAR.rocks.face

To fully utilize WebAR.rocks.face with 3D model rendering:

### Step 1: Initialize WebAR.rocks.face

In `ProductModal.tsx`, when switching to AR tab:

```typescript
useEffect(() => {
  if (virtualTab === 'ar' && typeof window !== 'undefined' && (window as any).WEBARROCKSFACE) {
    initializeWebARRocks(product, modelUrl);
  }
}, [virtualTab, product, modelUrl]);

const initializeWebARRocks = async (product: Product, modelUrl: string) => {
  const WEBARROCKSFACE = (window as any).WEBARROCKSFACE;
  
  if (!WEBARROCKSFACE) return;
  
  const state = {
    canvasWidth: 640,
    canvasHeight: 480,
    isInitialized: false
  };

  // Configure the AR engine
  const config = {
    hasFlip: true,
    canvasId: 'webar-face-container',
    NNCPath: 'https://cdn.jsdelivr.net/gh/WebAR-rocks/WebAR.rocks.face@master/dist/',
  };

  // Load the model
  const loader = new THREE.GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const model = gltf.scene;

  // Position and scale the model on the face
  model.scale.set(0.01, 0.01, 0.01);
  
  // Attach to face and render
  WEBARROCKSFACE.onWebARRocksInit(() => {
    console.log('WebAR.rocks.face initialized');
    // Add model to scene and bind to face landmarks
  });
};
```

### Step 2: Set Up Three.js Integration

WebAR.rocks.face works best with Three.js for 3D model rendering. You'll need to:

1. Install Three.js:
```bash
npm install three
```

2. Load Three.js in the ProductModal:
```typescript
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/three@r128/build/three.min.js';
  document.head.appendChild(script);
}, []);
```

3. Integrate model loading and face tracking

### Step 3: Testing

After integration:

1. Open the app at `http://localhost:3000`
2. Select a product and click "Try Virtually"
3. Click the "AR" tab
4. Grant camera permissions
5. Your face should be detected and glasses rendered

## Troubleshooting

### Camera not loading
- Check browser permissions (Settings > Site settings > Camera)
- Ensure HTTPS (or localhost) for camera access
- Check browser console for MediaPipe/WebAR.rocks errors

### 3D models not showing
- Verify GLB files exist in `/public/models3D/`
- Check file paths in `getModelUrl()` function
- Verify model-viewer script is loaded (check Network tab)

### Face landmarks not detected
- Ensure good lighting
- Face should be centered and clearly visible
- Try manual controls (+/- buttons) if MediaPipe fails

### WebAR.rocks.face not initializing
- Check that the script loaded: `(window as any).WEBARROCKSFACE` should exist
- Check browser console for errors
- Verify CDN URLs are accessible

## Performance Optimization

- Use compressed GLB models (<2MB each)
- Limit face mesh refinement to improve speed
- Consider using model LOD (Level of Detail) for different devices
- Test on mobile devices with camera permissions

## Future Enhancements

- [ ] Add WebAR.rocks.face for improved 3D model rendering
- [ ] Implement color/variant selection in AR preview
- [ ] Add AR scene lighting and shadows
- [ ] Support multiple frame styles simultaneously
- [ ] Mobile-optimized AR UI with QR code sharing
- [ ] Occlusion for realistic face-glasses interaction

## Resources

- [WebAR.rocks.face Documentation](https://github.com/WebAR-rocks/WebAR.rocks.face)
- [MediaPipe FaceMesh](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [model-viewer Documentation](https://modelviewer.dev/)
- [Three.js Documentation](https://threejs.org/docs/)

## API Keys / Licenses

- WebAR.rocks.face: Free to use (jsdelivr CDN)
- MediaPipe: Open source (Google)
- model-viewer: Open source (Google)
- Three.js: Open source (MIT License)

All libraries are loaded from public CDNs with no API keys required.
