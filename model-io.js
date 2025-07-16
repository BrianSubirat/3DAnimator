import { THREE } from './main.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelIO {
  constructor(editor) {
    this.editor = editor;
    this.setupInputElement();
  }

  setupInputElement() {
    const inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.id = 'modelInput';
    inputElement.accept = '.obj,.gltf,.glb';
    inputElement.style.display = 'none';
    document.body.appendChild(inputElement);

    this.inputElement = inputElement;
    this.inputElement.addEventListener('change', (e) => this.handleFileSelect(e));
  }

  importModel() {
    this.inputElement.click();
  }

  centerModel(object) {
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Center the model at origin
    object.position.sub(center);
    
    // Optional: scale model to reasonable size if it's too big
    const maxSize = Math.max(size.x, size.y, size.z);
    if (maxSize > 10) {
      const scale = 10 / maxSize;
      object.scale.multiplyScalar(scale);
    }
    
    // Enable shadows for all meshes in the model
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const extension = file.name.split('.').pop().toLowerCase();
      
      if (extension === 'obj') {
        const loader = new OBJLoader();
        const object = loader.parse(e.target.result);
        this.centerModel(object);
        this.editor.scene.add(object);
        this.editor.selectObject(object);
      } else if (extension === 'gltf' || extension === 'glb') {
        const loader = new GLTFLoader();
        loader.parse(e.target.result, '', (gltf) => {
          this.centerModel(gltf.scene);
          this.editor.scene.add(gltf.scene);
          this.editor.selectObject(gltf.scene);
        });
      }
    };
    
    if (['gltf', 'glb'].includes(file.name.split('.').pop().toLowerCase())) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }
}