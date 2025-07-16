import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class ClothPhysics {
  constructor(editor) {
    this.editor = editor;
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
    
    this.clothBodies = [];
    this.clothMeshes = [];
    this.colliders = [];
    this.isRunning = false;
    
    this.setupClothControls();
    this.setupEventListeners();
  }

  setupClothControls() {
    // Add cloth creation controls to the tools panel
    const clothSection = document.createElement('div');
    clothSection.className = 'prop-section';
    clothSection.innerHTML = `
      <h3>🧵 Cloth Settings</h3>
      <div class="prop-group">
        <label>Cloth Size</label>
        <input type="range" id="clothSize" min="1" max="10" value="4" step="1">
        <span class="value-display">4</span>
      </div>
      <div class="prop-group">
        <label>Cloth Color</label>
        <input type="color" id="clothColor" value="#8A2BE2">
      </div>
      <div class="physics-controls">
        <button id="createCloth" class="prop-btn primary">Create Cloth</button>
      </div>
    `;
    
    // Add to tools panel
    const toolsPanel = document.getElementById('tools-panel');
    if (toolsPanel) {
      toolsPanel.appendChild(clothSection);
    }
    
    // Setup event listeners
    document.getElementById('clothSize').addEventListener('input', (e) => {
      e.target.nextElementSibling.textContent = e.target.value;
    });
    
    document.getElementById('createCloth').addEventListener('click', () => {
      this.createCloth();
    });
  }

  setupEventListeners() {
    document.getElementById('playPhysics').addEventListener('click', () => this.togglePhysics());
    document.getElementById('resetPhysics').addEventListener('click', () => this.resetPhysics());
  }

  createCloth() {
    const size = parseInt(document.getElementById('clothSize')?.value || 4);
    const resolution = parseInt(document.getElementById('clothResolution')?.value || 15);
    const color = document.getElementById('clothColor')?.value || '#8A2BE2';
    
    // Create cloth geometry
    const clothGeometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    const clothMaterial = new THREE.MeshPhongMaterial({ 
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    
    const clothMesh = new THREE.Mesh(clothGeometry, clothMaterial);
    clothMesh.position.set(0, 5, 0);
    clothMesh.castShadow = true;
    clothMesh.receiveShadow = true;
    
    this.editor.scene.add(clothMesh);
    this.clothMeshes.push(clothMesh);
    
    // Create physics bodies for cloth particles
    const clothBodies = [];
    const positions = clothGeometry.attributes.position.array;
    const particleShape = new CANNON.Sphere(0.1);
    
    for (let i = 0; i < positions.length; i += 3) {
      const body = new CANNON.Body({ mass: 0.1 });
      body.addShape(particleShape);
      body.position.set(
        positions[i] + clothMesh.position.x,
        positions[i + 1] + clothMesh.position.y,
        positions[i + 2] + clothMesh.position.z
      );
      this.world.addBody(body);
      clothBodies.push(body);
    }
    
    // Add constraints between particles
    this.addClothConstraints(clothBodies, resolution);
    
    this.clothBodies.push(clothBodies);
    
    // Add colliders for existing objects
    this.updateColliders();
    
    document.getElementById('statusMessage').textContent = 'Cloth created';
  }

  addClothConstraints(bodies, resolution) {
    const distance = 0.5;
    
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const index = i * resolution + j;
        
        // Horizontal constraint
        if (j < resolution - 1) {
          const constraint = new CANNON.PointToPointConstraint(
            bodies[index],
            new CANNON.Vec3(distance, 0, 0),
            bodies[index + 1],
            new CANNON.Vec3(-distance, 0, 0)
          );
          this.world.addConstraint(constraint);
        }
        
        // Vertical constraint
        if (i < resolution - 1) {
          const constraint = new CANNON.PointToPointConstraint(
            bodies[index],
            new CANNON.Vec3(0, 0, distance),
            bodies[index + resolution],
            new CANNON.Vec3(0, 0, -distance)
          );
          this.world.addConstraint(constraint);
        }
      }
    }
    
    // Pin top corners
    bodies[0].mass = 0;
    bodies[resolution - 1].mass = 0;
  }

  updateColliders() {
    // Clear existing colliders
    this.colliders.forEach(body => this.world.removeBody(body));
    this.colliders = [];
    
    // Add ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(groundBody);
    this.colliders.push(groundBody);
    
    // Add colliders for scene objects
    this.editor.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const shape = this.createColliderShape(child);
        if (shape) {
          const body = new CANNON.Body({ mass: 0 });
          body.addShape(shape);
          body.position.copy(child.position);
          body.quaternion.copy(child.quaternion);
          this.world.addBody(body);
          this.colliders.push(body);
        }
      }
    });
  }

  createColliderShape(mesh) {
    const geometry = mesh.geometry;
    
    if (geometry instanceof THREE.BoxGeometry) {
      const params = geometry.parameters;
      return new CANNON.Box(new CANNON.Vec3(params.width/2, params.height/2, params.depth/2));
    } else if (geometry instanceof THREE.SphereGeometry) {
      return new CANNON.Sphere(geometry.parameters.radius);
    } else if (geometry instanceof THREE.CylinderGeometry) {
      const params = geometry.parameters;
      return new CANNON.Cylinder(params.radiusTop, params.radiusBottom, params.height, params.radialSegments);
    } else {
      // For complex geometries, use a box approximation
      const bbox = new THREE.Box3().setFromObject(mesh);
      const size = bbox.getSize(new THREE.Vector3());
      return new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
    }
  }

  togglePhysics() {
    this.isRunning = !this.isRunning;
    const button = document.getElementById('playPhysics');
    button.textContent = this.isRunning ? '⏸️ Pause Physics' : '▶️ Play Physics';
    button.className = this.isRunning ? 'full-width-button danger' : 'full-width-button success';
  }

  resetPhysics() {
    this.isRunning = false;
    const button = document.getElementById('playPhysics');
    button.textContent = '▶️ Play Physics';
    button.className = 'full-width-button success';
    
    // Remove all cloth
    this.clothMeshes.forEach(mesh => this.editor.scene.remove(mesh));
    this.clothBodies.forEach(bodies => {
      bodies.forEach(body => this.world.removeBody(body));
    });
    
    this.clothMeshes = [];
    this.clothBodies = [];
    
    // Clear world constraints
    this.world.constraints.forEach(constraint => this.world.removeConstraint(constraint));
  }

  update() {
    if (!this.isRunning) return;
    
    this.world.step(1/60);
    
    // Update cloth mesh positions
    this.clothMeshes.forEach((mesh, meshIndex) => {
      const clothBodies = this.clothBodies[meshIndex];
      const positions = mesh.geometry.attributes.position.array;
      
      for (let i = 0; i < clothBodies.length; i++) {
        const body = clothBodies[i];
        positions[i * 3] = body.position.x - mesh.position.x;
        positions[i * 3 + 1] = body.position.y - mesh.position.y;
        positions[i * 3 + 2] = body.position.z - mesh.position.z;
      }
      
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    });
  }
}