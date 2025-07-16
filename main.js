import * as THREE from 'three';
export { THREE };

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import Split from 'split-grid';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationSystem } from './animation.js';
import { KeyframePanel } from './keyframe-panel.js';
import { ModelIO } from './model-io.js';
import { ClothPhysics } from './cloth-physics.js';

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
    this.setupUI();
    
    this.selectedObject = null;
    this.isPlaying = false;
    this.frameCount = 0;
    this.lastTime = 0;
    
    this.animationSystem = new AnimationSystem(this);
    this.keyframePanel = new KeyframePanel(this);
    this.modelIO = new ModelIO(this);
    this.clothPhysics = new ClothPhysics(this);
    
    this.setupPropertiesPanel();
    this.setupTimelineControls();
    this.setupViewportControls();
    this.setupPerformanceMonitoring();
    
    this.setupMenuSystem();
    this.setupToolSystem();
    this.setupWorkspaceSystem();
    this.setupTooltips();
    this.setupThemeToggle();
    this.setupRenderPanel();
    this.setupTextureGenerator();
    this.setupHistorySystem();
    this.setupAssetLibrary();
    this.setupHotkeys();
    
    this.animate();
  }

  setupScene() {
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
    this.renderer.setClearColor(0x2a2a2a);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.updateRendererSize();
  }

  setupControls() {
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.scene.add(this.transformControls);
    
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.orbitControls.enabled = !event.value;
    });
    
    this.transformControls.addEventListener('objectChange', () => {
      this.updateObjectProperties();
    });
  }

  setupGrid() {
    this.grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
    this.scene.add(this.grid);
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.directionalLight.position.set(10, 10, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(this.directionalLight);
  }

  setupUI() {
    // Setup property tabs
    const propTabs = document.querySelectorAll('.prop-tab');
    const propPanels = document.querySelectorAll('.prop-panel');
    
    propTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        
        propTabs.forEach(t => t.classList.remove('active'));
        propPanels.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`${tabId}-panel`).classList.add('active');
      });
    });

    // Setup workspace tabs
    const workspaceTabs = document.querySelectorAll('.workspace-tab');
    workspaceTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const workspace = tab.dataset.workspace;
        this.switchWorkspace(workspace);
        
        workspaceTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.updateRendererSize());
    
    // Tool buttons - header
    document.getElementById('addCube').addEventListener('click', () => this.addObject('cube'));
    document.getElementById('addSphere').addEventListener('click', () => this.addObject('sphere'));
    document.getElementById('addCylinder').addEventListener('click', () => this.addObject('cylinder'));
    document.getElementById('addCloth').addEventListener('click', () => this.clothPhysics.createCloth());
    document.getElementById('delete').addEventListener('click', () => this.deleteSelected());
    document.getElementById('importModel').addEventListener('click', () => this.modelIO.importModel());
    document.getElementById('duplicateObject').addEventListener('click', () => this.duplicateSelected());
    
    // Tool buttons - properties panel
    document.getElementById('addCube2').addEventListener('click', () => this.addObject('cube'));
    document.getElementById('addSphere2').addEventListener('click', () => this.addObject('sphere'));
    document.getElementById('addCylinder2').addEventListener('click', () => this.addObject('cylinder'));
    document.getElementById('addCloth2').addEventListener('click', () => this.clothPhysics.createCloth());
    document.getElementById('delete2').addEventListener('click', () => this.deleteSelected());
    document.getElementById('importModel2').addEventListener('click', () => this.modelIO.importModel());
    document.getElementById('duplicateObject2').addEventListener('click', () => this.duplicateSelected());
    
    // Smart tools
    document.getElementById('autoArrange').addEventListener('click', () => this.autoArrangeObjects());
    document.getElementById('autoArrange2').addEventListener('click', () => this.autoArrangeObjects());
    document.getElementById('snapGrid').addEventListener('click', () => this.snapToGrid());
    document.getElementById('snapGrid2').addEventListener('click', () => this.snapToGrid());
    document.getElementById('smartMaterial').addEventListener('click', () => this.suggestMaterial());
    document.getElementById('smartMaterial2').addEventListener('click', () => this.suggestMaterial());
    document.getElementById('generateTexture').addEventListener('click', () => this.showTextureGenerator());
    
    // Post-processing
    document.getElementById('depthBlur').addEventListener('click', () => this.applyDepthBlur());
    document.getElementById('bloom').addEventListener('click', () => this.applyBloom());
    document.getElementById('hdrFilter').addEventListener('click', () => this.applyHDRFilter());
    document.getElementById('vintageFilter').addEventListener('click', () => this.applyVintageFilter());

    // Click handling for object selection
    this.renderer.domElement.addEventListener('click', (event) => this.handleObjectClick(event));
    
    // Context menu handling
    this.renderer.domElement.addEventListener('contextmenu', (event) => this.handleContextMenu(event));
    document.addEventListener('click', (event) => this.hideContextMenu(event));
    
    // Setup context menu actions
    this.setupContextMenu();
  }

  setupTooltips() {
    const tooltip = document.getElementById('tooltip');
    const elementsWithTooltips = document.querySelectorAll('[title]');
    
    elementsWithTooltips.forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        const title = e.target.getAttribute('title');
        if (title) {
          tooltip.textContent = title;
          tooltip.classList.add('show');
        }
      });
      
      element.addEventListener('mousemove', (e) => {
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY + 10 + 'px';
      });
      
      element.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
      });
    });
  }

  setupThemeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const compactModeToggle = document.getElementById('compactModeToggle');
    
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      darkModeToggle.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
      localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
    });
    
    compactModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('compact-mode');
      compactModeToggle.textContent = document.body.classList.contains('compact-mode') ? '🖥️' : '📱';
      localStorage.setItem('compactMode', document.body.classList.contains('compact-mode') ? 'true' : 'false');
    });
    
    // Load saved preferences
    const savedTheme = localStorage.getItem('theme');
    const savedCompactMode = localStorage.getItem('compactMode');
    
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      darkModeToggle.textContent = '☀️';
    }
    
    if (savedCompactMode === 'true') {
      document.body.classList.add('compact-mode');
      compactModeToggle.textContent = '🖥️';
    }
  }

  setupRenderPanel() {
    const renderModal = document.getElementById('renderModal');
    const closeRenderModal = document.getElementById('closeRenderModal');
    const renderType = document.getElementById('renderType');
    const fpsOption = document.getElementById('fpsOption');
    const startRender = document.getElementById('startRender');
    const downloadRender = document.getElementById('downloadRender');
    
    // Show render panel
    document.getElementById('renderImage').addEventListener('click', () => {
      renderType.value = 'image';
      fpsOption.style.display = 'none';
      renderModal.classList.add('active');
    });
    
    document.getElementById('renderAnimation').addEventListener('click', () => {
      renderType.value = 'animation';
      fpsOption.style.display = 'block';
      renderModal.classList.add('active');
    });
    
    // Close modal
    closeRenderModal.addEventListener('click', () => {
      renderModal.classList.remove('active');
    });
    
    // Render type change
    renderType.addEventListener('change', (e) => {
      fpsOption.style.display = e.target.value === 'animation' ? 'block' : 'none';
    });
    
    // Start render
    startRender.addEventListener('click', () => {
      this.startRender();
    });
    
    // Download render
    downloadRender.addEventListener('click', () => {
      this.downloadRender();
    });
  }

  setupTextureGenerator() {
    const textureModal = document.getElementById('textureModal');
    const closeTextureModal = document.getElementById('closeTextureModal');
    const generateTextureBtn = document.getElementById('generateTextureBtn');
    const applyTexture = document.getElementById('applyTexture');
    
    closeTextureModal.addEventListener('click', () => {
      textureModal.classList.remove('active');
    });
    
    generateTextureBtn.addEventListener('click', () => {
      this.generateTexture();
    });
    
    applyTexture.addEventListener('click', () => {
      this.applyGeneratedTexture();
    });
  }

  setupHistorySystem() {
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
    
    document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    document.getElementById('redoBtn').addEventListener('click', () => this.redo());
    document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());
    
    // Save initial state
    this.saveToHistory('Initial state');
  }

  setupAssetLibrary() {
    const assetGrid = document.getElementById('assetGrid');
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    this.assetLibrary = {
      primitives: [
        { name: 'Cube', icon: '📦', type: 'cube' },
        { name: 'Sphere', icon: '⚪', type: 'sphere' },
        { name: 'Cylinder', icon: '🛢️', type: 'cylinder' },
        { name: 'Plane', icon: '⬜', type: 'plane' },
        { name: 'Torus', icon: '🍩', type: 'torus' },
        { name: 'Cone', icon: '🔺', type: 'cone' }
      ],
      furniture: [
        { name: 'Chair', icon: '🪑', type: 'chair' },
        { name: 'Table', icon: '🪑', type: 'table' },
        { name: 'Lamp', icon: '💡', type: 'lamp' }
      ],
      nature: [
        { name: 'Tree', icon: '🌳', type: 'tree' },
        { name: 'Rock', icon: '🪨', type: 'rock' },
        { name: 'Grass', icon: '🌱', type: 'grass' }
      ],
      custom: []
    };
    
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateAssetGrid(btn.dataset.category);
      });
    });
    
    // Load initial category
    this.updateAssetGrid('primitives');
    
    // Project controls
    document.getElementById('saveProject').addEventListener('click', () => this.saveProject());
    document.getElementById('loadProject').addEventListener('click', () => this.loadProject());
    document.getElementById('exportProject').addEventListener('click', () => this.exportScene());
  }

  setupHotkeys() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              this.redo();
            } else {
              this.undo();
            }
            break;
          case 's':
            e.preventDefault();
            this.saveProject();
            break;
          case 'o':
            e.preventDefault();
            this.loadProject();
            break;
        }
      } else {
        switch(e.key) {
          case 'Delete':
          case 'x':
            if (this.selectedObject) {
              this.deleteSelected();
            }
            break;
          case 'g':
            this.setTransformMode('translate');
            break;
          case 'r':
            this.setTransformMode('rotate');
            break;
          case 's':
            this.setTransformMode('scale');
            break;
          case 'i':
            this.animationSystem.addKeyframe();
            break;
        }
      }
    });
  }

  setupPropertiesPanel() {
    // Scene properties
    document.getElementById('backgroundColor').addEventListener('change', (e) => {
      this.renderer.setClearColor(e.target.value);
    });

    // Lighting controls
    document.getElementById('ambientLight').addEventListener('input', (e) => {
      this.ambientLight.intensity = parseFloat(e.target.value);
      e.target.nextElementSibling.textContent = e.target.value;
    });

    document.getElementById('directionalLight').addEventListener('input', (e) => {
      this.directionalLight.intensity = parseFloat(e.target.value);
      e.target.nextElementSibling.textContent = e.target.value;
    });

    document.getElementById('enableShadows').addEventListener('change', (e) => {
      this.renderer.shadowMap.enabled = e.target.checked;
      this.updateShadows();
    });

    // Transform controls
    const posInputs = ['posX', 'posY', 'posZ'];
    const rotInputs = ['rotX', 'rotY', 'rotZ'];
    const scaleInputs = ['scaleX', 'scaleY', 'scaleZ'];

    posInputs.forEach((id, index) => {
      document.getElementById(id).addEventListener('change', (e) => {
        if (this.selectedObject) {
          const axis = ['x', 'y', 'z'][index];
          this.selectedObject.position[axis] = parseFloat(e.target.value);
        }
      });
    });

    rotInputs.forEach((id, index) => {
      document.getElementById(id).addEventListener('change', (e) => {
        if (this.selectedObject) {
          const axis = ['x', 'y', 'z'][index];
          this.selectedObject.rotation[axis] = parseFloat(e.target.value) * (Math.PI / 180);
        }
      });
    });

    scaleInputs.forEach((id, index) => {
      document.getElementById(id).addEventListener('change', (e) => {
        if (this.selectedObject) {
          const axis = ['x', 'y', 'z'][index];
          this.selectedObject.scale[axis] = parseFloat(e.target.value);
        }
      });
    });

    // Material controls
    document.getElementById('materialColor').addEventListener('change', (e) => {
      if (this.selectedObject && this.selectedObject.material) {
        this.selectedObject.material.color.setHex(e.target.value.replace('#', '0x'));
      }
    });

    document.getElementById('wireframeMode').addEventListener('change', (e) => {
      if (this.selectedObject && this.selectedObject.material) {
        this.selectedObject.material.wireframe = e.target.checked;
      }
    });
    
    // Setup texture library
    this.setupTextureLibrary();
  }

  setupTextureLibrary() {
    // Add Find Textures button to tools panel
    const textureSection = document.createElement('div');
    textureSection.className = 'prop-section';
    textureSection.innerHTML = `
      <h3>🖼️ Textures</h3>
      <div class="tool-grid">
        <button class="tool-btn" id="findTextures" title="Find Textures">
          <span class="icon">🔍</span>
          <span class="label">Find Textures</span>
        </button>
      </div>
    `;
    
    // Add to tools panel
    const toolsPanel = document.getElementById('tools-panel');
    if (toolsPanel) {
      toolsPanel.appendChild(textureSection);
    }
    
    // Setup texture library data
    this.textureLibrary = [
      { name: 'Brick', pattern: 'brick', color: '#8B4513' },
      { name: 'Wood', pattern: 'wood', color: '#DEB887' },
      { name: 'Metal', pattern: 'metal', color: '#C0C0C0' },
      { name: 'Stone', pattern: 'stone', color: '#696969' },
      { name: 'Marble', pattern: 'marble', color: '#F0F8FF' },
      { name: 'Concrete', pattern: 'concrete', color: '#A9A9A9' },
      { name: 'Leather', pattern: 'leather', color: '#654321' },
      { name: 'Fabric', pattern: 'fabric', color: '#4682B4' },
      { name: 'Grass', pattern: 'grass', color: '#90EE90' },
      { name: 'Sand', pattern: 'sand', color: '#F4A460' },
      { name: 'Water', pattern: 'water', color: '#0077BE' },
      { name: 'Lava', pattern: 'lava', color: '#FF4500' },
      { name: 'Ice', pattern: 'ice', color: '#B0E0E6' },
      { name: 'Rust', pattern: 'rust', color: '#B7410E' },
      { name: 'Gold', pattern: 'gold', color: '#FFD700' },
      { name: 'Silver', pattern: 'silver', color: '#C0C0C0' },
      { name: 'Copper', pattern: 'copper', color: '#B87333' },
      { name: 'Carbon', pattern: 'carbon', color: '#36454F' },
      { name: 'Plastic', pattern: 'plastic', color: '#FF6B6B' },
      { name: 'Rubber', pattern: 'rubber', color: '#36454F' },
      { name: 'Glass', pattern: 'glass', color: '#E6F3FF' },
      { name: 'Diamond', pattern: 'diamond', color: '#B9F2FF' },
      { name: 'Ceramic', pattern: 'ceramic', color: '#F5F5DC' },
      { name: 'Tile', pattern: 'tile', color: '#FFFFFF' },
      { name: 'Fur', pattern: 'fur', color: '#8B4513' },
      { name: 'Scales', pattern: 'scales', color: '#228B22' },
      { name: 'Bark', pattern: 'bark', color: '#8B4513' },
      { name: 'Leaves', pattern: 'leaves', color: '#32CD32' },
      { name: 'Cloud', pattern: 'cloud', color: '#F0F8FF' },
      { name: 'Fire', pattern: 'fire', color: '#FF4500' }
    ];
    
    // Setup event listeners
    document.getElementById('findTextures').addEventListener('click', () => this.showTextureLibrary());
    
    // Setup texture library modal
    document.getElementById('closeTextureLibrary').addEventListener('click', () => {
      document.getElementById('textureLibraryModal').classList.remove('active');
    });
    
    document.getElementById('applySelectedTexture').addEventListener('click', () => {
      this.applySelectedTexture();
    });
  }

  setupContextMenu() {
    document.getElementById('contextDuplicate').addEventListener('click', () => {
      this.duplicateSelected();
      this.hideContextMenu();
    });
    
    document.getElementById('contextIsolate').addEventListener('click', () => {
      this.isolateSelected();
      this.hideContextMenu();
    });
    
    document.getElementById('contextDelete').addEventListener('click', () => {
      this.deleteSelected();
      this.hideContextMenu();
    });
  }

  handleContextMenu(event) {
    event.preventDefault();
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      let object = intersects[0].object;
      
      while (object.parent && object.parent.type !== 'Scene') {
        object = object.parent;
      }
      
      if (object.type === 'Mesh' || object.type === 'Object3D' || object.type === 'Group') {
        this.selectObject(object);
        this.showContextMenu(event.clientX, event.clientY);
      }
    }
  }

  showContextMenu(x, y) {
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.classList.add('active');
  }

  hideContextMenu(event) {
    const contextMenu = document.getElementById('contextMenu');
    if (event && contextMenu.contains(event.target)) {
      return;
    }
    contextMenu.classList.remove('active');
  }

  isolateSelected() {
    if (!this.selectedObject) return;
    
    this.scene.traverse((child) => {
      if (child.isMesh && child !== this.selectedObject && child !== this.grid) {
        child.visible = false;
      }
    });
    
    this.saveToHistory('Isolated object');
    document.getElementById('statusMessage').textContent = 'Object isolated';
  }

  showTextureLibrary() {
    const modal = document.getElementById('textureLibraryModal');
    const library = document.getElementById('textureLibrary');
    
    library.innerHTML = '';
    
    this.textureLibrary.forEach((texture, index) => {
      const item = document.createElement('div');
      item.className = 'texture-item';
      item.style.backgroundColor = texture.color;
      item.dataset.index = index;
      
      // Generate texture pattern
      const canvas = document.createElement('canvas');
      canvas.width = 80;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      this.generateTexturePattern(ctx, texture.pattern, texture.color);
      
      item.style.backgroundImage = `url(${canvas.toDataURL()})`;
      
      const nameEl = document.createElement('div');
      nameEl.className = 'texture-name';
      nameEl.textContent = texture.name;
      item.appendChild(nameEl);
      
      item.addEventListener('click', () => {
        document.querySelectorAll('.texture-item').forEach(t => t.classList.remove('selected'));
        item.classList.add('selected');
        this.selectedTexture = texture;
        document.getElementById('applySelectedTexture').style.display = 'block';
      });
      
      library.appendChild(item);
    });
    
    modal.classList.add('active');
  }

  generateTexturePattern(ctx, pattern, color) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    switch(pattern) {
      case 'brick':
        this.generateBrickPattern(ctx, width, height);
        break;
      case 'wood':
        this.generateWoodPattern(ctx, width, height);
        break;
      case 'metal':
        this.generateMetalPattern(ctx, width, height);
        break;
      case 'stone':
        this.generateStonePattern(ctx, width, height);
        break;
      case 'marble':
        this.generateMarblePattern(ctx, width, height);
        break;
      case 'concrete':
        this.generateConcretePattern(ctx, width, height);
        break;
      case 'leather':
        this.generateLeatherPattern(ctx, width, height);
        break;
      case 'fabric':
        this.generateFabricPattern(ctx, width, height);
        break;
      case 'grass':
        this.generateGrassPattern(ctx, width, height);
        break;
      case 'water':
        this.generateWaterPattern(ctx, width, height);
        break;
      default:
        this.generateNoisePattern(ctx, width, height);
    }
  }

  generateBrickPattern(ctx, width, height) {
    const brickWidth = 20;
    const brickHeight = 10;
    
    for (let y = 0; y < height; y += brickHeight) {
      const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
      for (let x = -offset; x < width; x += brickWidth) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeRect(x, y, brickWidth, brickHeight);
      }
    }
  }

  generateWoodPattern(ctx, width, height) {
    for (let i = 0; i < 10; i++) {
      const y = (i / 10) * height;
      ctx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      
      for (let x = 0; x < width; x += 5) {
        const wave = Math.sin(x * 0.1) * 2;
        ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
  }

  generateMetalPattern(ctx, width, height) {
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const length = Math.random() * 20 + 5;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + Math.random() * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
  }

  generateStonePattern(ctx, width, height) {
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 1;
      
      ctx.fillStyle = `rgba(64, 64, 64, ${0.2 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  generateMarblePattern(ctx, width, height) {
    for (let i = 0; i < 5; i++) {
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      
      ctx.strokeStyle = `rgba(180, 180, 180, ${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 2 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      for (let j = 0; j < 20; j++) {
        const x = startX + Math.sin(j * 0.5) * 30;
        const y = startY + j * 4;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  generateConcretePattern(ctx, width, height) {
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1 + 0.5;
      
      ctx.fillStyle = `rgba(100, 100, 100, ${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  generateLeatherPattern(ctx, width, height) {
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 8 + 3;
      
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.2 + Math.random() * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  generateFabricPattern(ctx, width, height) {
    const threadSize = 4;
    for (let x = 0; x < width; x += threadSize) {
      for (let y = 0; y < height; y += threadSize) {
        const brightness = (x + y) % (threadSize * 2) === 0 ? 0.3 : 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fillRect(x, y, threadSize, threadSize);
      }
    }
  }

  generateGrassPattern(ctx, width, height) {
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const height2 = Math.random() * 10 + 5;
      
      ctx.strokeStyle = `rgba(34, 139, 34, ${0.3 + Math.random() * 0.4})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.random() * 2 - 1, y - height2);
      ctx.stroke();
    }
  }

  generateWaterPattern(ctx, width, height) {
    for (let i = 0; i < 8; i++) {
      const y = (i / 8) * height;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + Math.random() * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      
      for (let x = 0; x < width; x += 3) {
        const wave = Math.sin(x * 0.2 + i) * 3;
        ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
  }

  generateNoisePattern(ctx, width, height) {
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 1;
      
      ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  applySelectedTexture() {
    if (!this.selectedObject || !this.selectedTexture) return;
    
    // Create texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    this.generateTexturePattern(ctx, this.selectedTexture.pattern, this.selectedTexture.color);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    if (this.selectedObject.material) {
      this.selectedObject.material.map = texture;
      this.selectedObject.material.needsUpdate = true;
    }
    
    document.getElementById('textureLibraryModal').classList.remove('active');
    this.saveToHistory(`Applied ${this.selectedTexture.name} texture`);
    document.getElementById('statusMessage').textContent = `${this.selectedTexture.name} texture applied`;
  }

  setupTimelineControls() {
    document.getElementById('play').addEventListener('click', () => this.toggleAnimation());
    document.getElementById('addKeyframe').addEventListener('click', () => this.animationSystem.addKeyframe());
    
    document.getElementById('timeline').addEventListener('input', (e) => {
      this.animationSystem.setCurrentTime(parseFloat(e.target.value));
    });

    document.getElementById('currentFrame').addEventListener('change', (e) => {
      this.animationSystem.setCurrentTime(parseFloat(e.target.value));
    });

    document.getElementById('exportVideo').addEventListener('click', () => this.exportVideo());
  }

  setupViewportControls() {
    // Viewport shading
    document.getElementById('viewportShading').addEventListener('change', (e) => {
      this.setViewportShading(e.target.value);
    });

    // Navigation cube
    const navFaces = document.querySelectorAll('.nav-face');
    navFaces.forEach(face => {
      face.addEventListener('click', () => {
        this.setViewportView(face.dataset.view);
      });
    });

    // Overlay toggles
    document.querySelectorAll('.overlay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        if (btn.textContent === 'Grid') {
          this.grid.visible = btn.classList.contains('active');
        }
      });
    });
  }

  setupPerformanceMonitoring() {
    setInterval(() => {
      this.updatePerformanceStats();
    }, 1000);
  }

  updatePerformanceStats() {
    document.getElementById('fpsCounter').textContent = `FPS: ${Math.round(this.frameCount)}`;
    document.getElementById('objectCount').textContent = `Objects: ${this.scene.children.length}`;
    document.getElementById('renderInfo').textContent = `Tris: ${this.renderer.info.render.triangles}`;
    
    if (performance.memory) {
      const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      document.getElementById('memoryUsage').textContent = `Memory: ${memoryMB}MB`;
    }
    
    this.frameCount = 0;
  }

  setViewportShading(mode) {
    this.scene.traverse((child) => {
      if (child.isMesh) {
        switch (mode) {
          case 'wireframe':
            child.material.wireframe = true;
            break;
          case 'solid':
            child.material.wireframe = false;
            break;
        }
      }
    });
  }

  setViewportView(view) {
    const distance = 10;
    switch (view) {
      case 'front':
        this.camera.position.set(0, 0, distance);
        break;
      case 'back':
        this.camera.position.set(0, 0, -distance);
        break;
      case 'right':
        this.camera.position.set(distance, 0, 0);
        break;
      case 'left':
        this.camera.position.set(-distance, 0, 0);
        break;
      case 'top':
        this.camera.position.set(0, distance, 0);
        break;
      case 'bottom':
        this.camera.position.set(0, -distance, 0);
        break;
    }
    this.camera.lookAt(0, 0, 0);
  }

  updateObjectProperties() {
    if (!this.selectedObject) return;

    // Update transform inputs
    document.getElementById('posX').value = this.selectedObject.position.x.toFixed(2);
    document.getElementById('posY').value = this.selectedObject.position.y.toFixed(2);
    document.getElementById('posZ').value = this.selectedObject.position.z.toFixed(2);

    document.getElementById('rotX').value = (this.selectedObject.rotation.x * 180 / Math.PI).toFixed(2);
    document.getElementById('rotY').value = (this.selectedObject.rotation.y * 180 / Math.PI).toFixed(2);
    document.getElementById('rotZ').value = (this.selectedObject.rotation.z * 180 / Math.PI).toFixed(2);

    document.getElementById('scaleX').value = this.selectedObject.scale.x.toFixed(2);
    document.getElementById('scaleY').value = this.selectedObject.scale.y.toFixed(2);
    document.getElementById('scaleZ').value = this.selectedObject.scale.z.toFixed(2);

    // Update object info
    document.getElementById('objectName').value = this.selectedObject.name || 'Unnamed';
    document.getElementById('objectType').value = this.selectedObject.type;

    // Update material properties
    if (this.selectedObject.material) {
      document.getElementById('materialColor').value = '#' + this.selectedObject.material.color.getHexString();
      document.getElementById('wireframeMode').checked = this.selectedObject.material.wireframe;
    }
  }

  updateShadows() {
    this.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = this.renderer.shadowMap.enabled;
        child.receiveShadow = this.renderer.shadowMap.enabled;
      }
    });
  }

  toggleAnimation() {
    this.isPlaying = !this.isPlaying;
    const playButton = document.getElementById('play');
    playButton.textContent = this.isPlaying ? '⏸' : '▶';
    
    document.getElementById('statusMessage').textContent = this.isPlaying ? 'Playing...' : 'Ready';
  }

  exportVideo() {
    if (!this.renderer.domElement.captureStream) {
      alert('Video export not supported in this browser');
      return;
    }

    const stream = this.renderer.domElement.captureStream();
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'blender-clone-animation.webm';
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start();
    document.getElementById('statusMessage').textContent = 'Recording video...';
    
    setTimeout(() => {
      recorder.stop();
      document.getElementById('statusMessage').textContent = 'Video exported successfully';
    }, 5000);
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
        material = new THREE.MeshPhongMaterial({ color: 0x00ff88 });
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        material = new THREE.MeshPhongMaterial({ color: 0xff8800 });
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        material = new THREE.MeshPhongMaterial({ color: 0x8800ff });
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(2, 2);
        material = new THREE.MeshPhongMaterial({ color: 0x888888 });
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
        material = new THREE.MeshPhongMaterial({ color: 0xff0088 });
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1, 32);
        material = new THREE.MeshPhongMaterial({ color: 0x00ff88 });
        break;
    }
    
    mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    this.scene.add(mesh);
    this.selectObject(mesh);
    this.saveToHistory(`Added ${type}`);
    
    document.getElementById('statusMessage').textContent = `Added ${type}`;
  }

  handleObjectClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    const intersects = raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      let object = intersects[0].object;
      
      while (object.parent && object.parent.type !== 'Scene') {
        object = object.parent;
      }
      
      if (object === this.transformControls) return;

      if (object.type === 'Mesh' || object.type === 'Object3D' || object.type === 'Group') {
        this.selectObject(object);
      }
    } else {
      this.deselectObject();
    }
  }

  selectObject(object) {
    this.selectedObject = object;
    this.transformControls.attach(object);
    this.updateObjectProperties();
    
    document.getElementById('statusMessage').textContent = `Selected: ${object.name || 'Unnamed'}`;
  }

  deselectObject() {
    this.selectedObject = null;
    this.transformControls.detach();
    document.getElementById('statusMessage').textContent = 'Ready';
  }

  deleteSelected() {
    if (this.selectedObject) {
      this.scene.remove(this.selectedObject);
      this.transformControls.detach();
      this.saveToHistory(`Deleted ${this.selectedObject.name || 'object'}`);
      this.selectedObject = null;
      document.getElementById('statusMessage').textContent = 'Object deleted';
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();
    if (currentTime - this.lastTime >= 1000) {
      this.lastTime = currentTime;
    }
    
    this.frameCount++;
    
    if (this.isPlaying) {
      this.animationSystem.update();
    }
    
    this.clothPhysics.update();
    this.orbitControls.update();
    
    this.renderer.render(this.scene, this.camera);
  }

  setupMenuSystem() {
    // File menu
    document.getElementById('fileMenu').addEventListener('click', (e) => {
      this.toggleDropdown('fileDropdown', e.target);
    });
    
    document.getElementById('newProject').addEventListener('click', () => this.newProject());
    document.getElementById('openProject').addEventListener('click', () => this.loadProject());
    document.getElementById('exportScene').addEventListener('click', () => this.exportScene());
    
    // Edit menu
    document.getElementById('editMenu').addEventListener('click', (e) => {
      this.toggleDropdown('editDropdown', e.target);
    });
    
    document.getElementById('undoAction').addEventListener('click', () => this.undo());
    document.getElementById('redoAction').addEventListener('click', () => this.redo());
    document.getElementById('copyObject').addEventListener('click', () => this.copyObject());
    document.getElementById('pasteObject').addEventListener('click', () => this.pasteObject());
    
    // Add menu
    document.getElementById('addMenu').addEventListener('click', (e) => {
      this.toggleDropdown('addDropdown', e.target);
    });
    
    document.getElementById('addMesh').addEventListener('click', () => this.showAddMeshMenu());
    document.getElementById('addLight').addEventListener('click', () => this.addLight());
    document.getElementById('addCamera').addEventListener('click', () => this.addCamera());
    
    // Render menu
    document.getElementById('renderMenu').addEventListener('click', (e) => {
      this.toggleDropdown('renderDropdown', e.target);
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-item') && !e.target.closest('.menu-dropdown')) {
        this.closeAllDropdowns();
      }
    });
  }

  setupToolSystem() {
    // Transform tools
    document.getElementById('selectTool').addEventListener('click', () => this.setTransformMode('select'));
    document.getElementById('selectTool2').addEventListener('click', () => this.setTransformMode('select'));
    document.getElementById('moveTool').addEventListener('click', () => this.setTransformMode('translate'));
    document.getElementById('moveTool2').addEventListener('click', () => this.setTransformMode('translate'));
    document.getElementById('rotateTool').addEventListener('click', () => this.setTransformMode('rotate'));
    document.getElementById('rotateTool2').addEventListener('click', () => this.setTransformMode('rotate'));
    document.getElementById('scaleTool').addEventListener('click', () => this.setTransformMode('scale'));
    document.getElementById('scaleTool2').addEventListener('click', () => this.setTransformMode('scale'));
  }

  setupWorkspaceSystem() {
    const workspaceTabs = document.querySelectorAll('.workspace-tab');
    workspaceTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const workspace = tab.dataset.workspace;
        this.switchWorkspace(workspace);
        
        workspaceTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }

  toggleDropdown(dropdownId, button) {
    const dropdown = document.getElementById(dropdownId);
    const rect = button.getBoundingClientRect();
    
    this.closeAllDropdowns();
    
    dropdown.style.left = rect.left + 'px';
    dropdown.classList.add('active');
  }

  closeAllDropdowns() {
    document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
      dropdown.classList.remove('active');
    });
  }

  setTransformMode(mode) {
    // Update tool button states
    document.querySelectorAll('.tool-btn').forEach(btn => {
      if (btn.id.includes('Tool')) {
        btn.classList.remove('active');
      }
    });
    
    switch(mode) {
      case 'select':
        document.getElementById('selectTool').classList.add('active');
        document.getElementById('selectTool2').classList.add('active');
        this.transformControls.setMode('translate');
        this.transformControls.showX = this.transformControls.showY = this.transformControls.showZ = false;
        break;
      case 'translate':
        document.getElementById('moveTool').classList.add('active');
        document.getElementById('moveTool2').classList.add('active');
        this.transformControls.setMode('translate');
        this.transformControls.showX = this.transformControls.showY = this.transformControls.showZ = true;
        break;
      case 'rotate':
        document.getElementById('rotateTool').classList.add('active');
        document.getElementById('rotateTool2').classList.add('active');
        this.transformControls.setMode('rotate');
        this.transformControls.showX = this.transformControls.showY = this.transformControls.showZ = true;
        break;
      case 'scale':
        document.getElementById('scaleTool').classList.add('active');
        document.getElementById('scaleTool2').classList.add('active');
        this.transformControls.setMode('scale');
        this.transformControls.showX = this.transformControls.showY = this.transformControls.showZ = true;
        break;
    }
  }

  // Menu functions
  newProject() {
    if (confirm('Create new project? This will clear the current scene.')) {
      this.scene.clear();
      this.setupGrid();
      this.setupLights();
      this.selectedObject = null;
      this.transformControls.detach();
      this.history = [];
      this.historyIndex = -1;
      this.saveToHistory('New project');
      document.getElementById('statusMessage').textContent = 'New project created';
    }
  }

  saveProject() {
    const projectData = {
      version: '1.0',
      scene: this.serializeScene(),
      history: this.history,
      settings: {
        theme: document.body.classList.contains('light-theme') ? 'light' : 'dark',
        compactMode: document.body.classList.contains('compact-mode')
      }
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blender-clone-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    document.getElementById('statusMessage').textContent = 'Project saved';
  }

  loadProject() {
    const input = document.getElementById('projectFileInput');
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target.result);
          this.loadProjectData(projectData);
        } catch (error) {
          alert('Invalid project file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  loadProjectData(projectData) {
    // Load scene
    this.loadSceneState(projectData.scene);
    
    // Load history
    this.history = projectData.history || [];
    this.historyIndex = this.history.length - 1;
    this.updateHistoryUI();
    
    // Load settings
    if (projectData.settings) {
      if (projectData.settings.theme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('darkModeToggle').textContent = '☀️';
      }
      
      if (projectData.settings.compactMode) {
        document.body.classList.add('compact-mode');
        document.getElementById('compactModeToggle').textContent = '🖥️';
      }
    }
    
    document.getElementById('statusMessage').textContent = 'Project loaded';
  }

  duplicateSelected() {
    if (!this.selectedObject) return;
    
    const clone = this.selectedObject.clone();
    clone.position.x += 2;
    clone.material = this.selectedObject.material.clone();
    
    this.scene.add(clone);
    this.selectObject(clone);
    this.saveToHistory(`Duplicated ${this.selectedObject.name || 'object'}`);
    
    document.getElementById('statusMessage').textContent = 'Object duplicated';
  }

  exportScene() {
    const exporter = new THREE.ObjectExporter();
    const result = exporter.parse(this.scene);
    
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.json';
    a.click();
    URL.revokeObjectURL(url);
    
    document.getElementById('statusMessage').textContent = 'Scene exported';
  }

  switchWorkspace(workspace) {
    // Update UI based on workspace
    switch(workspace) {
      case 'modeling':
        document.querySelector('[data-tab="tools"]').click();
        break;
      case 'animation':
        document.querySelector('[data-tab="animation"]').click();
        break;
      case 'shading':
        document.querySelector('[data-tab="material"]').click();
        break;
      case 'rendering':
        // Switch to render settings
        break;
    }
    
    document.getElementById('statusMessage').textContent = `Switched to ${workspace} workspace`;
  }

  renderImage() {
    const canvas = this.renderer.domElement;
    const link = document.createElement('a');
    link.download = 'render.png';
    link.href = canvas.toDataURL();
    link.click();
    
    document.getElementById('statusMessage').textContent = 'Image rendered';
  }

  renderAnimation() {
    this.exportVideo();
  }

  addLight() {
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 5, 0);
    light.castShadow = true;
    light.name = 'Point Light';
    
    this.scene.add(light);
    this.selectObject(light);
    this.saveToHistory('Added light');
    
    document.getElementById('statusMessage').textContent = 'Light added';
  }

  addCamera() {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 5, 5);
    camera.lookAt(0, 0, 0);
    camera.name = 'Camera';
    
    const helper = new THREE.CameraHelper(camera);
    this.scene.add(helper);
    this.saveToHistory('Added camera');
    
    document.getElementById('statusMessage').textContent = 'Camera added';
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadSceneState(this.history[this.historyIndex].state);
      document.getElementById('statusMessage').textContent = `Undid: ${this.history[this.historyIndex + 1].action}`;
      this.updateHistoryUI();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.loadSceneState(this.history[this.historyIndex].state);
      document.getElementById('statusMessage').textContent = `Redid: ${this.history[this.historyIndex].action}`;
      this.updateHistoryUI();
    }
  }

  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
    this.saveToHistory('Cleared history');
    this.updateHistoryUI();
  }

  updateHistoryUI() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    this.history.forEach((entry, index) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      if (index === this.historyIndex) {
        item.classList.add('active');
      }
      
      const time = new Date(entry.timestamp).toLocaleTimeString();
      item.innerHTML = `
        <div style="font-weight: bold; font-size: 11px;">${entry.action}</div>
        <div style="font-size: 10px; color: var(--text-muted);">${time}</div>
      `;
      
      item.addEventListener('click', () => {
        this.historyIndex = index;
        this.loadSceneState(entry.state);
        this.updateHistoryUI();
      });
      
      historyList.appendChild(item);
    });
  }

  updateAssetGrid(category) {
    const assetGrid = document.getElementById('assetGrid');
    assetGrid.innerHTML = '';
    
    const assets = this.assetLibrary[category] || [];
    assets.forEach(asset => {
      const item = document.createElement('div');
      item.className = 'asset-item';
      item.innerHTML = `
        <div class="asset-icon">${asset.icon}</div>
        <div class="asset-name">${asset.name}</div>
      `;
      
      item.addEventListener('click', () => {
        this.addAsset(asset.type);
      });
      
      assetGrid.appendChild(item);
    });
  }

  addAsset(type) {
    switch(type) {
      case 'cube':
      case 'sphere':
      case 'cylinder':
        this.addObject(type);
        break;
      case 'plane':
        this.addObject('plane');
        break;
      case 'torus':
        this.addObject('torus');
        break;
      case 'cone':
        this.addObject('cone');
        break;
      default:
        document.getElementById('statusMessage').textContent = `Asset type ${type} not implemented`;
    }
  }

  autoArrangeObjects() {
    const objects = this.scene.children.filter(child => 
      child.isMesh && child !== this.grid && !child.isHelper
    );
    
    if (objects.length === 0) return;
    
    // Apply rule of thirds and spacing
    const spacing = 3;
    const cols = Math.ceil(Math.sqrt(objects.length));
    const rows = Math.ceil(objects.length / cols);
    
    objects.forEach((obj, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      obj.position.set(
        (col - (cols - 1) / 2) * spacing,
        0,
        (row - (rows - 1) / 2) * spacing
      );
    });
    
    this.saveToHistory('Auto arranged objects');
    document.getElementById('statusMessage').textContent = 'Objects arranged automatically';
  }

  snapToGrid() {
    if (!this.selectedObject) return;
    
    const gridSize = 1;
    this.selectedObject.position.x = Math.round(this.selectedObject.position.x / gridSize) * gridSize;
    this.selectedObject.position.y = Math.round(this.selectedObject.position.y / gridSize) * gridSize;
    this.selectedObject.position.z = Math.round(this.selectedObject.position.z / gridSize) * gridSize;
    
    this.updateObjectProperties();
    this.saveToHistory('Snapped to grid');
    document.getElementById('statusMessage').textContent = 'Snapped to grid';
  }

  suggestMaterial() {
    if (!this.selectedObject) return;
    
    const materialSuggestions = {
      'cube': { color: 0x8B4513, roughness: 0.8, metalness: 0.1 }, // Wood
      'sphere': { color: 0xC0C0C0, roughness: 0.1, metalness: 0.9 }, // Metal
      'cylinder': { color: 0x696969, roughness: 0.3, metalness: 0.7 }, // Steel
      'plane': { color: 0x90EE90, roughness: 0.9, metalness: 0.0 } // Grass
    };
    
    const objectType = this.selectedObject.geometry.type.toLowerCase().replace('geometry', '');
    const suggestion = materialSuggestions[objectType] || materialSuggestions['cube'];
    
    if (this.selectedObject.material) {
      this.selectedObject.material.color.setHex(suggestion.color);
      if (this.selectedObject.material.roughness !== undefined) {
        this.selectedObject.material.roughness = suggestion.roughness;
      }
      if (this.selectedObject.material.metalness !== undefined) {
        this.selectedObject.material.metalness = suggestion.metalness;
      }
    }
    
    this.updateObjectProperties();
    this.saveToHistory('Applied smart material');
    document.getElementById('statusMessage').textContent = 'Smart material applied';
  }

  showTextureGenerator() {
    if (!this.selectedObject) {
      document.getElementById('statusMessage').textContent = 'Please select an object first';
      return;
    }
    document.getElementById('textureModal').classList.add('active');
  }

  generateTexture() {
    const materialType = document.getElementById('materialType').value;
    const textureStyle = document.getElementById('textureStyle').value;
    const baseColor = document.getElementById('baseColor').value;
    
    // Create procedural texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Generate texture based on type
    this.generateProceduralTexture(ctx, materialType, textureStyle, baseColor);
    
    // Preview
    const previewCanvas = document.getElementById('texturePreview');
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.drawImage(canvas, 0, 0, 200, 200);
    
    // Store texture
    this.generatedTexture = new THREE.CanvasTexture(canvas);
    this.generatedTexture.wrapS = THREE.RepeatWrapping;
    this.generatedTexture.wrapT = THREE.RepeatWrapping;
    this.generatedTexture.repeat.set(2, 2);
    
    document.getElementById('applyTexture').style.display = 'block';
    document.getElementById('statusMessage').textContent = 'Texture generated';
  }

  generateProceduralTexture(ctx, type, style, baseColor) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);
    
    // Add texture based on type
    switch(type) {
      case 'wood':
        this.generateWoodTexture(ctx, width, height, style);
        break;
      case 'metal':
        this.generateMetalTexture(ctx, width, height, style);
        break;
      case 'stone':
        this.generateStoneTexture(ctx, width, height, style);
        break;
      case 'fabric':
        this.generateFabricTexture(ctx, width, height, style);
        break;
      case 'plastic':
        this.generatePlasticTexture(ctx, width, height, style);
        break;
      case 'glass':
        this.generateGlassTexture(ctx, width, height, style);
        break;
    }
  }

  generateWoodTexture(ctx, width, height, style) {
    // Wood grain pattern
    for (let i = 0; i < 20; i++) {
      const y = (i / 20) * height;
      const waveHeight = Math.sin(i * 0.3) * 10;
      
      ctx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 2 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(0, y + waveHeight);
      
      for (let x = 0; x < width; x += 10) {
        const wave = Math.sin(x * 0.02) * 5;
        ctx.lineTo(x, y + waveHeight + wave);
      }
      ctx.stroke();
    }
  }

  generateMetalTexture(ctx, width, height, style) {
    // Metal scratches and reflections
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const length = Math.random() * 50 + 10;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
  }

  generateStoneTexture(ctx, width, height, style) {
    // Stone texture with noise
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      
      ctx.fillStyle = `rgba(64, 64, 64, ${0.2 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  generateFabricTexture(ctx, width, height, style) {
    // Fabric weave pattern
    const threadSize = 4;
    for (let x = 0; x < width; x += threadSize) {
      for (let y = 0; y < height; y += threadSize) {
        const brightness = (x + y) % (threadSize * 2) === 0 ? 0.8 : 0.6;
        ctx.fillStyle = `rgba(100, 100, 100, ${brightness})`;
        ctx.fillRect(x, y, threadSize, threadSize);
      }
    }
  }

  generatePlasticTexture(ctx, width, height, style) {
    // Smooth plastic with subtle variations
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 20 + 5;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + Math.random() * 0.1})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  generateGlassTexture(ctx, width, height, style) {
    // Glass with reflections
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const width2 = Math.random() * 100 + 20;
      const height2 = Math.random() * 20 + 5;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
      ctx.fillRect(x, y, width2, height2);
    }
  }

  applyGeneratedTexture() {
    if (!this.selectedObject || !this.generatedTexture) return;
    
    if (this.selectedObject.material) {
      this.selectedObject.material.map = this.generatedTexture;
      this.selectedObject.material.needsUpdate = true;
    }
    
    document.getElementById('textureModal').classList.remove('active');
    this.saveToHistory('Applied generated texture');
    document.getElementById('statusMessage').textContent = 'Texture applied';
  }

  applyDepthBlur() {
    // Simple depth blur effect
    this.renderer.domElement.style.filter = 'blur(1px)';
    setTimeout(() => {
      this.renderer.domElement.style.filter = 'none';
    }, 100);
    document.getElementById('statusMessage').textContent = 'Depth blur applied';
  }

  applyBloom() {
    // Bloom effect simulation
    this.renderer.domElement.style.filter = 'brightness(1.2) saturate(1.3)';
    setTimeout(() => {
      this.renderer.domElement.style.filter = 'none';
    }, 2000);
    document.getElementById('statusMessage').textContent = 'Bloom effect applied';
  }

  applyHDRFilter() {
    // HDR tone mapping
    this.renderer.domElement.style.filter = 'contrast(1.2) brightness(1.1)';
    setTimeout(() => {
      this.renderer.domElement.style.filter = 'none';
    }, 2000);
    document.getElementById('statusMessage').textContent = 'HDR filter applied';
  }

  applyVintageFilter() {
    // Vintage filter
    this.renderer.domElement.style.filter = 'sepia(0.5) contrast(1.2) brightness(0.9)';
    setTimeout(() => {
      this.renderer.domElement.style.filter = 'none';
    }, 2000);
    document.getElementById('statusMessage').textContent = 'Vintage filter applied';
  }

  saveToHistory(action) {
    // Remove any future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Add new state
    const sceneState = this.serializeScene();
    this.history.push({
      action: action,
      state: sceneState,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
    
    this.updateHistoryUI();
  }

  loadSceneState(sceneData) {
    // Clear current objects
    const objectsToRemove = [];
    this.scene.traverse((object) => {
      if (object.isMesh && object !== this.grid && !object.isHelper) {
        objectsToRemove.push(object);
      }
    });
    objectsToRemove.forEach(obj => this.scene.remove(obj));
    
    // Load objects
    sceneData.objects.forEach(objData => {
      const object = this.recreateObject(objData);
      if (object) {
        this.scene.add(object);
      }
    });
    
    // Load camera
    this.camera.position.fromArray(sceneData.camera.position);
    this.camera.rotation.fromArray(sceneData.camera.rotation);
    
    // Load lights
    this.ambientLight.intensity = sceneData.lights.ambient;
    this.directionalLight.intensity = sceneData.lights.directional;
    
    this.selectedObject = null;
    this.transformControls.detach();
  }

  recreateObject(objData) {
    let geometry;
    
    switch(objData.type) {
      case 'BoxGeometry':
        geometry = new THREE.BoxGeometry();
        break;
      case 'SphereGeometry':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        break;
      case 'CylinderGeometry':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        break;
      case 'PlaneGeometry':
        geometry = new THREE.PlaneGeometry();
        break;
      case 'TorusGeometry':
        geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
        break;
      case 'ConeGeometry':
        geometry = new THREE.ConeGeometry(0.5, 1, 32);
        break;
      default:
        return null;
    }
    
    const material = new THREE.MeshPhongMaterial({
      color: objData.material.color,
      wireframe: objData.material.wireframe
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.uuid = objData.uuid;
    mesh.name = objData.name;
    mesh.position.fromArray(objData.position);
    mesh.rotation.fromArray(objData.rotation);
    mesh.scale.fromArray(objData.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  }

  startRender() {
    const quality = document.getElementById('renderQuality').value;
    const type = document.getElementById('renderType').value;
    
    let width, height;
    switch(quality) {
      case 'low': width = 512; height = 512; break;
      case 'medium': width = 1024; height = 1024; break;
      case 'high': width = 2048; height = 2048; break;
    }
    
    // Create render target
    this.renderTarget = new THREE.WebGLRenderTarget(width, height);
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    
    // Show download button
    document.getElementById('downloadRender').style.display = 'block';
    document.getElementById('statusMessage').textContent = 'Render complete';
  }

  downloadRender() {
    if (!this.renderTarget) return;
    
    // Create canvas from render target
    const canvas = document.createElement('canvas');
    canvas.width = this.renderTarget.width;
    canvas.height = this.renderTarget.height;
    const ctx = canvas.getContext('2d');
    
    // Get pixel data
    const pixels = new Uint8Array(this.renderTarget.width * this.renderTarget.height * 4);
    this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, this.renderTarget.width, this.renderTarget.height, pixels);
    
    // Create image data
    const imageData = ctx.createImageData(this.renderTarget.width, this.renderTarget.height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    
    // Download
    const link = document.createElement('a');
    link.download = 'render.png';
    link.href = canvas.toDataURL();
    link.click();
    
    document.getElementById('renderModal').classList.remove('active');
    document.getElementById('statusMessage').textContent = 'Render downloaded';
  }

  serializeScene() {
    const sceneData = {
      objects: [],
      camera: {
        position: this.camera.position.toArray(),
        rotation: this.camera.rotation.toArray()
      },
      lights: {
        ambient: this.ambientLight.intensity,
        directional: this.directionalLight.intensity
      }
    };
    
    this.scene.traverse((object) => {
      if (object.isMesh && object !== this.grid && !object.isHelper) {
        sceneData.objects.push({
          uuid: object.uuid,
          type: object.geometry.type,
          position: object.position.toArray(),
          rotation: object.rotation.toArray(),
          scale: object.scale.toArray(),
          name: object.name,
          material: {
            color: object.material.color.getHex(),
            wireframe: object.material.wireframe
          }
        });
      }
    });
    
    return sceneData;
  }

  showAddMeshMenu() {
    // Create a submenu for mesh types
    const dropdown = document.createElement('div');
    dropdown.className = 'menu-dropdown active';
    dropdown.style.left = '60px';
    dropdown.style.top = '80px';
    
    dropdown.innerHTML = `
      <button class="dropdown-item" onclick="editor.addObject('cube')">Cube</button>
      <button class="dropdown-item" onclick="editor.addObject('sphere')">Sphere</button>
      <button class="dropdown-item" onclick="editor.addObject('cylinder')">Cylinder</button>
      <button class="dropdown-item" onclick="editor.addObject('plane')">Plane</button>
    `;
    
    document.body.appendChild(dropdown);
    
    setTimeout(() => {
      dropdown.remove();
    }, 3000);
  }
}

// Initialize the application
const editor = new BlenderClone();
window.editor = editor; // Make it globally accessible for dropdown actions