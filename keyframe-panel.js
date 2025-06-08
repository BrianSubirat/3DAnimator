export class KeyframePanel {
  constructor(editor) {
    this.editor = editor;
    this.container = document.getElementById('keyframes-container');
  }

  updateKeyframes() {
    this.container.innerHTML = '';
    
    const keyframes = Array.from(this.editor.animationSystem.keyframes.entries())
      .sort(([timeA], [timeB]) => timeA - timeB);
    
    for (const [time, objects] of keyframes) {
      const keyframeEl = document.createElement('div');
      keyframeEl.className = 'keyframe';
      
      const keyframeContent = document.createElement('div');
      keyframeContent.className = 'keyframe-content';
      
      const timeHeader = document.createElement('div');
      timeHeader.className = 'keyframe-time';
      timeHeader.textContent = `Time: ${time}`;
      
      const objectsList = document.createElement('div');
      objectsList.className = 'keyframe-objects';
      
      objects.forEach((properties, uuid) => {
        const object = this.editor.scene.getObjectByProperty('uuid', uuid);
        if (object) {
          const objectInfo = document.createElement('div');
          objectInfo.className = 'object-info';
          objectInfo.innerHTML = `
            <div class="object-name">🟦 Object ${object.uuid.slice(0, 6)}</div>
            <div class="object-properties">
              <div>Position: (${properties.position.x.toFixed(2)}, ${properties.position.y.toFixed(2)}, ${properties.position.z.toFixed(2)})</div>
              <div>Rotation: (${properties.rotation.x.toFixed(2)}, ${properties.rotation.y.toFixed(2)}, ${properties.rotation.z.toFixed(2)})</div>
              <div>Scale: (${properties.scale.x.toFixed(2)}, ${properties.scale.y.toFixed(2)}, ${properties.scale.z.toFixed(2)})</div>
            </div>
          `;
          objectsList.appendChild(objectInfo);
        }
      });
      
      keyframeContent.appendChild(timeHeader);
      keyframeContent.appendChild(objectsList);
      keyframeEl.appendChild(keyframeContent);
      
      keyframeEl.addEventListener('click', () => {
        this.editor.animationSystem.setCurrentTime(time);
        document.getElementById('timeline').value = time;
      });
      
      this.container.appendChild(keyframeEl);
    }
  }
}