export class KeyframePanel {
  constructor(editor) {
    this.editor = editor;
    this.container = document.getElementById('keyframes-container');
  }

  updateKeyframes() {
    this.container.innerHTML = '';
    
    const keyframes = Array.from(this.editor.animationSystem.keyframes.entries())
      .sort(([timeA], [timeB]) => timeA - timeB);
    
    if (keyframes.length === 0) {
      this.container.innerHTML = '<div style="color: #999; font-size: 11px; text-align: center; padding: 20px;">No keyframes</div>';
      return;
    }
    
    for (const [time, objects] of keyframes) {
      const keyframeEl = document.createElement('div');
      keyframeEl.className = 'keyframe';
      
      const timeHeader = document.createElement('div');
      timeHeader.className = 'keyframe-time';
      timeHeader.textContent = `Frame ${Math.round(time)}`;
      
      const objectsList = document.createElement('div');
      objectsList.className = 'keyframe-objects';
      
      objects.forEach((properties, uuid) => {
        const object = this.editor.scene.getObjectByProperty('uuid', uuid);
        if (object) {
          const objectInfo = document.createElement('div');
          objectInfo.className = 'object-info';
          
          const objectName = document.createElement('div');
          objectName.className = 'object-name';
          objectName.textContent = object.name || 'Unnamed Object';
          
          const objectProperties = document.createElement('div');
          objectProperties.className = 'object-properties';
          objectProperties.innerHTML = `
            <div>Pos: (${properties.position.x.toFixed(1)}, ${properties.position.y.toFixed(1)}, ${properties.position.z.toFixed(1)})</div>
            <div>Rot: (${(properties.rotation.x * 180 / Math.PI).toFixed(1)}°, ${(properties.rotation.y * 180 / Math.PI).toFixed(1)}°, ${(properties.rotation.z * 180 / Math.PI).toFixed(1)}°)</div>
            <div>Scale: (${properties.scale.x.toFixed(1)}, ${properties.scale.y.toFixed(1)}, ${properties.scale.z.toFixed(1)})</div>
          `;
          
          objectInfo.appendChild(objectName);
          objectInfo.appendChild(objectProperties);
          objectsList.appendChild(objectInfo);
        }
      });
      
      keyframeEl.appendChild(timeHeader);
      keyframeEl.appendChild(objectsList);
      
      keyframeEl.addEventListener('click', () => {
        this.editor.animationSystem.setCurrentTime(time);
        document.getElementById('timeline').value = time;
        document.getElementById('currentFrame').value = Math.round(time);
      });
      
      this.container.appendChild(keyframeEl);
    }
    
    this.updateTimelineMarkers();
  }

  updateTimelineMarkers() {
    const markersContainer = document.getElementById('keyframeMarkers');
    markersContainer.innerHTML = '';
    
    const keyframes = Array.from(this.editor.animationSystem.keyframes.keys());
    const maxTime = this.editor.animationSystem.duration;
    
    keyframes.forEach(time => {
      const marker = document.createElement('div');
      marker.style.position = 'absolute';
      marker.style.left = `${(time / maxTime) * 100}%`;
      marker.style.top = '0';
      marker.style.width = '2px';
      marker.style.height = '100%';
      marker.style.backgroundColor = '#f5761a';
      marker.style.pointerEvents = 'none';
      markersContainer.appendChild(marker);
    });
  }
}