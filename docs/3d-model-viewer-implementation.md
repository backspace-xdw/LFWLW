# 3D Model Viewer Implementation

## Overview

This document describes the implementation of the 3D model viewing feature for the LFWLW IoT monitoring platform using Three.js and FBX file format support.

## Features Implemented

### 1. 3D Model Viewer Component (`Model3DViewer`)
- **Three.js Integration**: Full 3D scene with camera, lighting, and controls
- **FBX Loader**: Support for loading and displaying FBX model files
- **Interactive Controls**:
  - Orbit controls for rotation, zoom, and pan
  - Auto-rotation with adjustable speed
  - Wireframe mode toggle
  - Reset view button
  - Fullscreen mode support
- **Visual Features**:
  - Grid helper for spatial reference
  - Axes helper for orientation
  - Shadow mapping for realistic rendering
  - Ambient and directional lighting

### 2. 3D Models Management Page (`Model3D`)
- **Model Library**: Display and manage all 3D models
- **View Modes**: 
  - Grid view with thumbnails
  - List view with details
- **Model Operations**:
  - View model in 3D viewer
  - Upload new models (UI ready, backend integration needed)
  - Delete models
  - Search by name, description, or tags
- **Model Information**:
  - Name and description
  - File size and upload date
  - Tags for categorization
  - Optional thumbnail preview

### 3. File Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Model3DViewer/
│   │       ├── index.tsx          # 3D viewer component
│   │       └── index.module.scss  # Viewer styles
│   ├── pages/
│   │   └── Model3D/
│   │       ├── index.tsx          # Models management page
│   │       └── index.module.scss  # Page styles
│   └── App.tsx                    # Added routing
├── public/
│   └── models/                    # FBX model files storage
│       ├── thumbnails/            # Model preview images
│       └── README.md              # Instructions for adding models
└── package.json                   # Added three.js dependency
```

## Technical Implementation

### Dependencies Added
```json
{
  "three": "^0.170.0",
  "@types/three": "^0.170.0"
}
```

### Key Components

#### 1. Three.js Scene Setup
```typescript
// Scene initialization
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
scene.fog = new THREE.Fog(0xf0f0f0, 100, 1000);

// Camera
const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
camera.position.set(50, 50, 50);

// Renderer with antialiasing
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
```

#### 2. FBX Loading
```typescript
const loader = new FBXLoader();
loader.load(modelUrl, (fbx) => {
  // Auto-center and scale model
  const box = new THREE.Box3().setFromObject(fbx);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const scale = 50 / Math.max(size.x, size.y, size.z);
  
  fbx.scale.setScalar(scale);
  fbx.position.sub(center.multiplyScalar(scale));
  
  scene.add(fbx);
});
```

#### 3. Interactive Controls
- **OrbitControls**: For mouse/touch interaction
- **Auto-rotation**: Optional with speed control
- **Wireframe mode**: For technical visualization
- **Fullscreen**: Immersive viewing experience

## Usage Instructions

### For Users

1. **Navigate to 3D Models**:
   - Click "3D模型" in the sidebar menu

2. **View a Model**:
   - Click "View" button on any model card
   - Use mouse to interact:
     - Left click + drag: Rotate
     - Scroll: Zoom in/out
     - Right click + drag: Pan

3. **Model Controls**:
   - Toggle auto-rotation
   - Adjust rotation speed
   - Switch to wireframe mode
   - Enter fullscreen mode
   - Reset camera position

### For Developers

1. **Add FBX Models**:
   - Place `.fbx` files in `/public/models/`
   - Add thumbnails in `/public/models/thumbnails/`
   - Models will be accessible at `/models/your-model.fbx`

2. **Integrate with Backend**:
   - Create API endpoints for model CRUD operations
   - Store model metadata in database
   - Implement file upload endpoint
   - Add model-device associations

## Example Model Data Structure

```typescript
interface Model3DItem {
  id: string;
  name: string;
  description: string;
  fileUrl: string;      // Path to FBX file
  fileSize: string;
  uploadDate: string;
  tags: string[];
  thumbnail?: string;   // Optional preview image
}
```

## Future Enhancements

1. **Backend Integration**:
   - Database storage for model metadata
   - File upload API with validation
   - Model-device relationship mapping

2. **Advanced Features**:
   - Animation support for FBX models
   - Multiple model format support (OBJ, GLTF)
   - Model annotations and hotspots
   - Real-time data overlay on 3D models
   - VR/AR viewing modes

3. **Performance Optimization**:
   - Model compression and optimization
   - Level-of-detail (LOD) support
   - Progressive loading for large models
   - Texture optimization

4. **Integration with IoT Data**:
   - Display real-time sensor data on 3D models
   - Color-code models based on device status
   - Animate model parts based on sensor values
   - Click model parts to view device details

## Notes

- Maximum recommended file size: 50MB
- Supported formats: FBX, OBJ, GLTF, GLB
- Models are automatically centered and scaled
- Shadows are enabled for realistic rendering
- The viewer is responsive and works on mobile devices

---

*Implementation Date: 2025-06-30*
*Version: 1.0*