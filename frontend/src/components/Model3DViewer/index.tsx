import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Card, Spin, Alert, Button, Space, Slider, Switch, Typography } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined, ReloadOutlined } from '@ant-design/icons';
import styles from './index.module.scss';

const { Text } = Typography;

interface Model3DViewerProps {
  modelUrl: string;
  modelName?: string;
  height?: number;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

const Model3DViewer: React.FC<Model3DViewerProps> = ({
  modelUrl,
  modelName = '3D Model',
  height = 600,
  onLoad,
  onError,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(2);
  const [wireframe, setWireframe] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    scene.fog = new THREE.Fog(0xf0f0f0, 100, 1000);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / height,
      0.1,
      1000
    );
    camera.position.set(50, 50, 50);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controlsRef.current = controls;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(100, 10);
    scene.add(gridHelper);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const currentHeight = isFullscreen ? window.innerHeight - 64 : height;
      
      cameraRef.current.aspect = width / currentHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, currentHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [height, isFullscreen]);

  // Create demo models programmatically
  const createDemoModel = (type: string): THREE.Group => {
    const group = new THREE.Group();
    
    if (type === 'water-pump') {
      // Create a water pump using basic geometries
      const material = new THREE.MeshPhongMaterial({ color: 0x4488cc, metalness: 0.8 });
      
      // Main body
      const bodyGeometry = new THREE.CylinderGeometry(10, 12, 20, 8);
      const body = new THREE.Mesh(bodyGeometry, material);
      group.add(body);
      
      // Top flange
      const flangeGeometry = new THREE.CylinderGeometry(15, 15, 3, 8);
      const topFlange = new THREE.Mesh(flangeGeometry, material);
      topFlange.position.y = 11.5;
      group.add(topFlange);
      
      // Motor
      const motorGeometry = new THREE.CylinderGeometry(8, 8, 15, 8);
      const motor = new THREE.Mesh(motorGeometry, material);
      motor.position.y = 20;
      group.add(motor);
      
      // Inlet pipe
      const pipeGeometry = new THREE.CylinderGeometry(3, 3, 10, 8);
      const inletPipe = new THREE.Mesh(pipeGeometry, material);
      inletPipe.rotation.z = Math.PI / 2;
      inletPipe.position.x = 15;
      group.add(inletPipe);
      
    } else if (type === 'valve-assembly') {
      // Create a valve assembly
      const material = new THREE.MeshPhongMaterial({ color: 0xcc8844, metalness: 0.7 });
      
      // Valve body
      const bodyGeometry = new THREE.SphereGeometry(8, 8, 8);
      const body = new THREE.Mesh(bodyGeometry, material);
      group.add(body);
      
      // Flanges
      const flangeGeometry = new THREE.CylinderGeometry(10, 10, 2, 8);
      const flange1 = new THREE.Mesh(flangeGeometry, material);
      flange1.rotation.z = Math.PI / 2;
      flange1.position.x = 9;
      group.add(flange1);
      
      const flange2 = new THREE.Mesh(flangeGeometry, material);
      flange2.rotation.z = Math.PI / 2;
      flange2.position.x = -9;
      group.add(flange2);
      
      // Handle stem
      const stemGeometry = new THREE.CylinderGeometry(2, 2, 15, 8);
      const stem = new THREE.Mesh(stemGeometry, material);
      stem.position.y = 10;
      group.add(stem);
      
      // Handle wheel
      const wheelGeometry = new THREE.TorusGeometry(6, 1, 8, 8);
      const wheel = new THREE.Mesh(wheelGeometry, material);
      wheel.position.y = 18;
      group.add(wheel);
      
    } else if (type === 'storage-tank') {
      // Create a storage tank
      const material = new THREE.MeshPhongMaterial({ color: 0x888888, metalness: 0.5 });
      
      // Main cylinder
      const cylinderGeometry = new THREE.CylinderGeometry(15, 15, 30, 16);
      const cylinder = new THREE.Mesh(cylinderGeometry, material);
      group.add(cylinder);
      
      // Top dome
      const domeGeometry = new THREE.SphereGeometry(15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const topDome = new THREE.Mesh(domeGeometry, material);
      topDome.position.y = 15;
      group.add(topDome);
      
      // Bottom dome
      const bottomDome = new THREE.Mesh(domeGeometry, material);
      bottomDome.rotation.x = Math.PI;
      bottomDome.position.y = -15;
      group.add(bottomDome);
      
      // Legs
      const legGeometry = new THREE.CylinderGeometry(1, 1, 10, 8);
      const legMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        const angle = (i / 4) * Math.PI * 2;
        leg.position.x = Math.cos(angle) * 12;
        leg.position.z = Math.sin(angle) * 12;
        leg.position.y = -20;
        group.add(leg);
      }
    }
    
    return group;
  };

  // Load model (FBX/GLTF or demo)
  useEffect(() => {
    if (!sceneRef.current) return;

    setLoading(true);
    setError(null);

    // Remove previous model if exists
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // Check if it's a demo model
    if (modelUrl.startsWith('demo:')) {
      const demoType = modelUrl.replace('demo:', '');
      const demoModel = createDemoModel(demoType);
      
      // Process the demo model same as loaded models
      const box = new THREE.Box3().setFromObject(demoModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim;
      
      demoModel.scale.setScalar(scale);
      demoModel.position.sub(center.multiplyScalar(scale));
      
      // Enable shadows
      demoModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      modelRef.current = demoModel;
      sceneRef.current.add(demoModel);
      
      setLoading(false);
      onLoad?.();
      return;
    }

    // Determine loader based on file extension
    const fileExtension = modelUrl.split('.').pop()?.toLowerCase();
    let loader: FBXLoader | GLTFLoader;
    
    if (fileExtension === 'fbx') {
      loader = new FBXLoader();
    } else if (fileExtension === 'glb' || fileExtension === 'gltf') {
      loader = new GLTFLoader();
    } else {
      setError('Unsupported file format');
      setLoading(false);
      return;
    }

    const processModel = (object: THREE.Group) => {
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim;
      
      object.scale.setScalar(scale);
      object.position.sub(center.multiplyScalar(scale));
      
      // Enable shadows
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      modelRef.current = object;
      sceneRef.current!.add(object);
      
      setLoading(false);
      onLoad?.();
    };

    if (loader instanceof GLTFLoader) {
      loader.load(
        modelUrl,
        (gltf) => {
          processModel(gltf.scene);
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
        },
        (error) => {
          console.error('Error loading model:', error);
          setError('Failed to load 3D model');
          setLoading(false);
          onError?.(error);
        }
      );
    } else {
      loader.load(
        modelUrl,
        (fbx) => {
          processModel(fbx);
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
        },
        (error) => {
          console.error('Error loading model:', error);
          setError('Failed to load 3D model');
          setLoading(false);
          onError?.(error);
        }
      );
    }
  }, [modelUrl, onLoad, onError]);

  // Update auto-rotation
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = rotationSpeed;
    }
  }, [autoRotate, rotationSpeed]);

  // Update wireframe mode
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.wireframe = wireframe;
              }
            });
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.wireframe = wireframe;
          }
        }
      });
    }
  }, [wireframe]);

  const handleFullscreen = () => {
    if (!mountRef.current) return;
    
    if (!isFullscreen) {
      mountRef.current.parentElement?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleReset = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(50, 50, 50);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <Card 
      className={styles.viewer}
      title={
        <div className={styles.header}>
          <span>{modelName}</span>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              size="small"
            >
              Reset View
            </Button>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={handleFullscreen}
              size="small"
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
          </Space>
        </div>
      }
    >
      <div className={styles.controls}>
        <Space size="large" wrap>
          <div>
            <Text>Auto Rotate: </Text>
            <Switch checked={autoRotate} onChange={setAutoRotate} />
          </div>
          {autoRotate && (
            <div style={{ width: 200 }}>
              <Text>Rotation Speed: </Text>
              <Slider
                min={0.5}
                max={10}
                step={0.5}
                value={rotationSpeed}
                onChange={setRotationSpeed}
              />
            </div>
          )}
          <div>
            <Text>Wireframe: </Text>
            <Switch checked={wireframe} onChange={setWireframe} />
          </div>
        </Space>
      </div>

      <div className={styles.viewerContainer} style={{ height }}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <Spin size="large" tip="Loading 3D Model..." />
          </div>
        )}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            className={styles.error}
          />
        )}
        <div ref={mountRef} className={styles.canvas} />
      </div>

      <div className={styles.instructions}>
        <Text type="secondary">
          Use mouse to rotate, scroll to zoom, right-click to pan
        </Text>
      </div>
    </Card>
  );
};

export default Model3DViewer;