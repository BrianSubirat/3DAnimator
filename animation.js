import { THREE } from './main.js';

export class AnimationSystem {
  constructor(editor) {
    this.editor = editor;
    this.keyframes = new Map(); // Map<time, Map<object, properties>>
    this.currentTime = 0;
    this.duration = 100; // Total animation duration in frames
    this.lastUpdateTime = 0;
    this.fps = 30; // Animation frames per second
  }

  addKeyframe() {
    if (!this.editor.selectedObject) return;
    
    const object = this.editor.selectedObject;
    const time = this.currentTime;
    
    if (!this.keyframes.has(time)) {
      this.keyframes.set(time, new Map());
    }
    
    const frame = {
      position: object.position.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone()
    };
    
    this.keyframes.get(time).set(object.uuid, frame);
    this.editor.keyframePanel.updateKeyframes();
  }

  setCurrentTime(time) {
    this.currentTime = Math.min(Math.max(time, 0), this.duration);
    this.updateObjects();
    this.updateTimeDisplay();
  }

  updateTimeDisplay() {
    const seconds = Math.floor(this.currentTime / this.fps);
    const frames = Math.floor(this.currentTime % this.fps);
    document.getElementById('timeDisplay').textContent = 
      `${seconds}:${String(frames).padStart(2, '0')}`;
  }

  update() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    
    if (deltaTime >= 1 / this.fps) {
      this.currentTime = (this.currentTime + 1) % this.duration;
      document.getElementById('timeline').value = this.currentTime;
      this.updateObjects();
      this.updateTimeDisplay();
      this.lastUpdateTime = currentTime;
    }
  }

  updateObjects() {
    const times = Array.from(this.keyframes.keys()).sort((a, b) => a - b);
    if (times.length < 2) return;

    let prevTimeIndex = times.findIndex(t => t > this.currentTime) - 1;
    if (prevTimeIndex === -2) prevTimeIndex = times.length - 1;
    
    const prevTime = times[prevTimeIndex];
    const nextTime = times[(prevTimeIndex + 1) % times.length];
    
    if (prevTime === undefined || nextTime === undefined) return;
    
    let alpha = (this.currentTime - prevTime) / (nextTime - prevTime);
    if (prevTime > nextTime) { // Handle loop case
      alpha = (this.currentTime - prevTime) / (this.duration - prevTime + nextTime);
    }
    
    alpha = Math.max(0, Math.min(1, alpha)); // Clamp between 0 and 1
    
    const prevFrames = this.keyframes.get(prevTime);
    const nextFrames = this.keyframes.get(nextTime);
    
    for (const [uuid, prevFrame] of prevFrames) {
      const nextFrame = nextFrames.get(uuid);
      const object = this.editor.scene.getObjectByProperty('uuid', uuid);
      
      if (object && nextFrame) {
        // Position interpolation
        object.position.lerpVectors(prevFrame.position, nextFrame.position, alpha);
        
        // Rotation interpolation
        const prevEuler = new THREE.Vector3(prevFrame.rotation.x, prevFrame.rotation.y, prevFrame.rotation.z);
        const nextEuler = new THREE.Vector3(nextFrame.rotation.x, nextFrame.rotation.y, nextFrame.rotation.z);
        const interpolatedEuler = new THREE.Vector3();
        interpolatedEuler.lerpVectors(prevEuler, nextEuler, alpha);
        object.rotation.setFromVector3(interpolatedEuler);
        
        // Scale interpolation
        object.scale.lerpVectors(prevFrame.scale, nextFrame.scale, alpha);
      }
    }
  }
}