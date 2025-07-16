import { THREE } from './main.js';

export class AnimationSystem {
  constructor(editor) {
    this.editor = editor;
    this.keyframes = new Map();
    this.currentTime = 0;
    this.duration = 250;
    this.fps = 30;
    this.lastUpdateTime = 0;
    this.interpolationMode = 'linear';
  }

  addKeyframe() {
    if (!this.editor.selectedObject) {
      document.getElementById('statusMessage').textContent = 'No object selected';
      return;
    }
    
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
    
    document.getElementById('statusMessage').textContent = `Keyframe added at frame ${Math.round(time)}`;
  }

  setCurrentTime(time) {
    this.currentTime = Math.min(Math.max(time, 0), this.duration);
    this.updateObjects();
    this.updateTimeDisplay();
  }

  updateTimeDisplay() {
    const frame = Math.round(this.currentTime);
    const seconds = Math.floor(frame / this.fps);
    const remainingFrames = frame % this.fps;
    
    document.getElementById('currentFrame').value = frame;
    document.getElementById('timeline').value = this.currentTime;
  }

  update() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
    
    if (deltaTime >= 1 / this.fps) {
      this.currentTime = (this.currentTime + 1) % this.duration;
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
    if (prevTime > nextTime) {
      alpha = (this.currentTime - prevTime) / (this.duration - prevTime + nextTime);
    }
    
    alpha = Math.max(0, Math.min(1, alpha));
    
    // Apply interpolation curve
    if (this.interpolationMode === 'bezier') {
      alpha = this.bezierInterpolation(alpha);
    }
    
    const prevFrames = this.keyframes.get(prevTime);
    const nextFrames = this.keyframes.get(nextTime);
    
    for (const [uuid, prevFrame] of prevFrames) {
      const nextFrame = nextFrames.get(uuid);
      const object = this.editor.scene.getObjectByProperty('uuid', uuid);
      
      if (object && nextFrame) {
        object.position.lerpVectors(prevFrame.position, nextFrame.position, alpha);
        
        const prevEuler = new THREE.Vector3(prevFrame.rotation.x, prevFrame.rotation.y, prevFrame.rotation.z);
        const nextEuler = new THREE.Vector3(nextFrame.rotation.x, nextFrame.rotation.y, nextFrame.rotation.z);
        const interpolatedEuler = new THREE.Vector3();
        interpolatedEuler.lerpVectors(prevEuler, nextEuler, alpha);
        object.rotation.setFromVector3(interpolatedEuler);
        
        object.scale.lerpVectors(prevFrame.scale, nextFrame.scale, alpha);
      }
    }
  }

  bezierInterpolation(t) {
    return t * t * (3.0 - 2.0 * t);
  }

  setInterpolationMode(mode) {
    this.interpolationMode = mode;
  }
}