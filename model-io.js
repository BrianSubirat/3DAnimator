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

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const extension = file.name.split('.').pop().toLowerCase();
      
      if (extension === 'obj') {
        const loader = new OBJLoader();
        const object = loader.parse(e.target.result);
        this.editor.scene.add(object);
      } else if (extension === 'gltf' || extension === 'glb') {
        const loader = new GLTFLoader();
        loader.parse(e.target.result, '', (gltf) => {
          this.editor.scene.add(gltf.scene);
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