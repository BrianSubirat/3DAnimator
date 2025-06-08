import * as THREE from 'three';
export { THREE };  // Now we can export after importing

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import Split from 'split-grid';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationSystem } from './animation.js';
import { KeyframePanel } from './keyframe-panel.js';
import { ModelIO } from './model-io.js';

class BlenderClone {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.viewport = document.getElementById('viewport');
    this.viewport.appendChild(this.renderer.domElement);
    
    this.setupScene();
    this.setupControls();
    this.setupGrid();
    this.setupLights();
    this.setupEventListeners();
    
    this.selectedObject = null;
    this.isPlaying = false;
    
    this.animationSystem = new AnimationSystem(this);
    this.keyframePanel = new KeyframePanel(this);
    this.modelIO = new ModelIO(this);
    
    this.setupLightingControls();
    this.setupCameraControls();
    this.setupVideoExport();
    
    this.animate();
  }

  setupScene() {
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
    this.renderer.setClearColor(0x1a1a1a);
    this.renderer.shadowMap.enabled = true;
    this.updateRendererSize();
  }

  setupControls() {
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.scene.add(this.transformControls);
    
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.orbitControls.enabled = !event.value;
    });
  }

  setupGrid() {
    const grid = new THREE.GridHelper(20, 20);
    this.scene.add(grid);
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.directionalLight.position.set(10, 10, 10);
    this.directionalLight.castShadow = true;
    this.scene.add(this.directionalLight);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.updateRendererSize());
    
    document.getElementById('addCube').addEventListener('click', () => this.addObject('cube'));
    document.getElementById('addSphere').addEventListener('click', () => this.addObject('sphere'));
    document.getElementById('addCylinder').addEventListener('click', () => this.addObject('cylinder'));
    document.getElementById('delete').addEventListener('click', () => this.deleteSelected());
    document.getElementById('mode').addEventListener('change', (e) => this.setTransformMode(e.target.value));

    // Click handling for object selection
    this.renderer.domElement.addEventListener('click', (event) => this.handleObjectClick(event));

    // Animation controls
    document.getElementById('play').addEventListener('click', () => this.toggleAnimation());
    document.getElementById('addKeyframe').addEventListener('click', () => this.animationSystem.addKeyframe());
    document.getElementById('timeline').addEventListener('input', (e) => {
      this.animationSystem.setCurrentTime(e.target.value);
    });

    // Import only
    document.getElementById('importModel').addEventListener('click', () => this.modelIO.importModel());
  }

  setupLightingControls() {
    document.getElementById('ambientLight').addEventListener('input', (e) => {
      this.ambientLight.intensity = parseFloat(e.target.value);
    });

    document.getElementById('directionalLight').addEventListener('input', (e) => {
      this.directionalLight.intensity = parseFloat(e.target.value);
    });

    document.getElementById('shadowIntensity').addEventListener('input', (e) => {
      this.directionalLight.shadow.intensity = parseFloat(e.target.value);
    });

    document.getElementById('enableShadows').addEventListener('change', (e) => {
      this.renderer.shadowMap.enabled = e.target.checked;
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = e.target.checked;
          object.receiveShadow = e.target.checked;
        }
      });
    });
  }

  setupCameraControls() {
    this.savedCameraPositions = new Map();

    document.getElementById('saveCameraPosition').addEventListener('click', () => {
      const position = this.camera.position.clone();
      const rotation = this.camera.rotation.clone();
      this.savedCameraPositions.set('custom', { position, rotation });
    });

    document.getElementById('resetCamera').addEventListener('click', () => {
      this.camera.position.set(5, 5, 5);
      this.camera.lookAt(0, 0, 0);
    });

    const presetButtons = document.querySelectorAll('.camera-presets button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const preset = button.dataset.preset;
        switch(preset) {
          case 'front':
            this.camera.position.set(0, 0, 5);
            break;
          case 'side':
            this.camera.position.set(5, 0, 0);
            break;
          case 'top':
            this.camera.position.set(0, 5, 0);
            break;
        }
        this.camera.lookAt(0, 0, 0);
      });
    });
  }

  setupVideoExport() {
    document.getElementById('exportVideo').addEventListener('click', () => {
      const stream = this.renderer.domElement.captureStream();
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'animation.webm';
        a.click();
        URL.revokeObjectURL(url);
      };

      // Record for the duration of the animation
      recorder.start();
      this.isPlaying = true;
      setTimeout(() => {
        recorder.stop();
        this.isPlaying = false;
      }, (this.duration / this.animationSystem.fps) * 1000);
    });
  }

  toggleAnimation() {
    this.isPlaying = !this.isPlaying;
    const playButton = document.getElementById('play');
    playButton.textContent = this.isPlaying ? '⏸' : '▶';
  }

  updateRendererSize() {
    const width = this.viewport.clientWidth;
    const height = this.viewport.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  addObject(type) {
    let geometry, material, mesh;
    
    switch(type) {
      case 'cube':
        geometry = new THREE.BoxGeometry();
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        break;
    }
    
    material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
    mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.scene.add(mesh);
    this.selectObject(mesh);
  }

  handleObjectClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    const intersects = raycaster.intersectObjects(this.scene.children);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      if (object.type === 'Mesh') {
        this.selectObject(object);
      }
    }
  }

  selectObject(object) {
    this.selectedObject = object;
    this.transformControls.attach(object);
  }

  deleteSelected() {
    if (this.selectedObject) {
      this.scene.remove(this.selectedObject);
      this.transformControls.detach();
      this.selectedObject = null;
    }
  }

  setTransformMode(mode) {
    this.transformControls.setMode(mode);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (this.isPlaying) {
      this.animationSystem.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application
new BlenderClone();