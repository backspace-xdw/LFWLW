declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, Vector3 } from 'three';
  
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    object: Camera;
    domElement: HTMLElement | Document;
    enabled: boolean;
    target: Vector3;
    minDistance: number;
    maxDistance: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    enableDamping: boolean;
    dampingFactor: number;
    update(): void;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/loaders/FBXLoader' {
  import { Group, Loader, LoadingManager } from 'three';
  
  export class FBXLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad: (object: Group) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(buffer: ArrayBuffer | string, path: string): Group;
  }
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Group, Loader, LoadingManager, AnimationClip, Camera, Scene } from 'three';
  
  export interface GLTF {
    scene: Scene;
    scenes: Scene[];
    cameras: Camera[];
    animations: AnimationClip[];
    asset: {
      generator?: string;
      version: string;
    };
  }
  
  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(data: ArrayBuffer | string, path: string, onLoad: (gltf: GLTF) => void, onError?: (error: Error) => void): void;
  }
}