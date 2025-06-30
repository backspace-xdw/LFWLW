# 3D Models Folder

This folder is used to store 3D model files for the LFWLW IoT monitoring platform.

## Supported Formats

- `.fbx` - Autodesk FBX (recommended)
- `.obj` - Wavefront OBJ
- `.gltf` - GL Transmission Format
- `.glb` - GLB (binary version of glTF)

## Folder Structure

```
models/
├── thumbnails/     # Thumbnail images for model preview
│   ├── model1.jpg
│   └── model2.png
├── model1.fbx      # 3D model files
├── model2.fbx
└── README.md       # This file
```

## Adding New Models

1. Place your FBX model file in this `models/` directory
2. (Optional) Add a thumbnail image with the same name in the `thumbnails/` folder
3. The model will be automatically available in the 3D Models page

## Naming Convention

- Use lowercase letters and hyphens for file names
- Example: `water-pump.fbx`, `valve-assembly.fbx`
- Thumbnail should have the same name: `water-pump.jpg`

## Model Requirements

- Maximum file size: 50MB
- Recommended polygon count: < 500,000 for optimal performance
- Ensure models are properly centered and scaled

## Example Models

You can place your actual FBX files here. For demo purposes, the system includes mock data that references:
- `/models/water-pump.fbx`
- `/models/valve-assembly.fbx`
- `/models/storage-tank.fbx`